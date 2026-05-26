# MCP Client/Server Code Walkthrough (`stdio` Transport)

This example demonstrates the smallest fully functional MCP architecture using the official TypeScript SDK.

It implements a simple parent–child process model:

```text
┌─────────────────────┐
│     client.ts       │
│  MCP Client Host    │
└─────────┬───────────┘
          │ stdio transport
          ▼
┌─────────────────────┐
│     server.ts       │
│     MCP Server      │
└─────────────────────┘
```

## Core Idea

* The **client spawns the server as a child process**
* Communication occurs over **stdin/stdout**
* All messages are exchanged as **framed JSON-RPC packets**

---

# High-Level Execution Flow

When you run:

```bash
npx tsx client.ts
```

the system executes the following sequence:

```text
client.ts starts
    │
    ├── creates stdio transport
    │
    ├── spawns server process (npx tsx server.ts)
    │
    ├── binds stdin/stdout streams
    │
    ├── performs MCP handshake
    │
    ├── sends ping request
    │
    ├── receives response
    │
    └── closes session
```

---

# Transport Model: `stdio`

The `stdio` transport uses the operating system’s standard streams:

* `stdin` → incoming data
* `stdout` → outgoing data
* `stderr` → logs and diagnostics

```text
Client stdout ─────► Server stdin
Server stdout ─────► Client stdin
```

## Why this matters

* No network stack required
* Extremely lightweight and fast
* Ideal for CLI tools, local agents, and IDE integrations

---

# `client.ts` Walkthrough

## Full Code

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "server.ts"],
});

const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

try {
  // Establish MCP connection
  await client.connect(transport);
  console.log("Connected to MCP server");

  // Health check RPC
  const pingResult = await client.ping();
  console.log("Ping result:", pingResult);
} catch (error) {
  console.error("MCP error:", error);
} finally {
  // Graceful shutdown
  await client.close();
  console.log("Disconnected");
}
```

---

## Step 1 — SDK Components

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
```

| Component              | Responsibility              |
| ---------------------- | --------------------------- |
| `Client`               | MCP protocol runtime        |
| `StdioClientTransport` | Process I/O transport layer |

---

## Step 2 — Transport Creation

```ts
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "server.ts"],
});
```

This configuration:

* Spawns the server process
* Connects stdin/stdout streams
* Enables framed JSON-RPC communication

Equivalent to:

```ts
spawn("npx", ["tsx", "server.ts"]);
```

---

## Step 3 — Client Initialization

```ts
const client = new Client({
  name: "example-client",
  version: "1.0.0",
});
```

This metadata is used during the MCP handshake for capability negotiation and identification.

---

## Step 4 — Connection & Handshake

```ts
await client.connect(transport);
```

This single call triggers the full MCP lifecycle:

1. Server process starts
2. Streams are attached
3. `initialize` request is sent
4. Server responds with capabilities
5. Session enters **READY** state

```text
MCP session → READY
```

---

## Step 5 — Ping Request

```ts
await client.ping();
```

A minimal health-check RPC:

```json
{ "method": "ping" }
```

Response:

```json
{ "result": {} }
```

### Confirms:

* Transport is alive
* Server is responsive
* Session is valid

---

## Step 6 — Shutdown

```ts
await client.close();
```

This ensures clean teardown of:

* Streams
* Protocol state
* Child process reference

Prevents orphaned processes and hanging Node.js runtimes.

---

# `server.ts` Walkthrough

## Full Code

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
  description: "Example MCP server",
});

const transport = new StdioServerTransport();

await server.connect(transport);

console.log("MCP server running");
```

---

## Step 1 — Server Runtime

| Component              | Role                        |
| ---------------------- | --------------------------- |
| `McpServer`            | MCP protocol engine         |
| `StdioServerTransport` | stdio communication adapter |

At this stage, the server exists but is **not yet connected to I/O**.

---

## Step 2 — Transport Setup

```ts
const transport = new StdioServerTransport();
```

This binds:

* `stdin` → input stream
* `stdout` → output stream

---

## Step 3 — Activation

```ts
await server.connect(transport);
```

This starts the runtime loop:

* Reads incoming bytes from stdin
* Parses framed JSON-RPC messages
* Routes requests to handlers
* Writes responses to stdout

At this point:

```text
Server → ACTIVE
```

---

# Critical Architectural Insight

This system does **not** use networking.

There is:

* No HTTP server
* No WebSocket layer
* No TCP sockets

Instead:

```text
Process ↔ Process communication via OS pipes
```

---

# JSON-RPC Framing Layer

MCP messages are transmitted as framed JSON-RPC payloads:

```http
Content-Length: 123

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "ping"
}
```

## Processing Pipeline

```text
Raw stream
  → read Content-Length header
  → buffer message bytes
  → parse JSON
  → route request
  → return response
```

---

# Lifecycle State Model

```text
UNINITIALIZED
     ↓
INITIALIZING
     ↓
READY
     ↓
ACTIVE (RPC execution)
     ↓
TERMINATED
```

---

# Error Handling Layers

Failures can occur at multiple levels:

* Transport layer (spawn failures, broken pipes)
* Protocol layer (invalid JSON-RPC)
* Handshake layer (initialization errors)
* Execution layer (tool runtime failures)

---

# Logging Constraint

⚠️ Important

`stdout` is reserved for MCP protocol traffic.

```ts
console.log("Server started");
```

can corrupt the message stream.

## Correct approach

```ts
console.error("Server started");
```

---

# Tooling Layer (MCP Extension Model)

MCP servers expose capabilities through tools.

```ts
server.tool(
  "calculate",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: `${a + b}`,
        },
      ],
    };
  }
);
```

---

## Execution Flow

```text
Client → listTools()
       → callTool()
Server → executes handler
       → returns structured result
```

---

# System Architecture Overview

```text
┌──────────────────────────┐
│     Application Host     │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│      MCP Client          │
│  - lifecycle manager     │
│  - protocol engine       │
└────────────┬─────────────┘
             ▼
       stdio (OS pipes)
             ▼
┌──────────────────────────┐
│      MCP Server          │
│  - tools & routing       │
│  - request handler       │
└────────────┬─────────────┘
             ▼
     OS Process Layer
```

---

# Key Takeaways

## 1. MCP is a protocol, not a transport

It defines structure and lifecycle, not how bytes move.

## 2. `stdio` is one transport option

Others (HTTP, WebSocket, etc.) can also exist.

## 3. Everything is process-based

There is no traditional network server.

## 4. Tools are the core abstraction

They transform processes into callable capabilities.

---

# Mental Model Summary

```text
Client Process
    ↓ JSON-RPC over framed stdio
Server Process
    ↓ tool execution
Structured response
```

---

# Final Insight

MCP transforms local processes into **structured, callable capability systems**, enabling AI agents to interact with tools through a consistent protocol rather than ad-hoc integrations.
