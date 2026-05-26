# Getting Started with the Model Context Protocol (MCP)

Welcome to the comprehensive guide to the **Model Context Protocol (MCP)** — an open standard for connecting Large Language Models (LLMs) to external tools, systems, and data sources.

This document provides a structured technical introduction to MCP, covering:

* Core architecture
* Host / Client / Server responsibilities
* JSON-RPC communication patterns
* Tool execution lifecycle
* `stdio` transport mechanics
* Official TypeScript SDK usage
* Reference implementations for MCP servers and clients

---

# 1. What Is MCP?

The **Model Context Protocol (MCP)** is an open standard introduced by [Anthropic](https://www.anthropic.com?utm_source=chatgpt.com) in late 2024.

Its purpose is to standardize how AI models interact with:

* External APIs
* Databases
* File systems
* Web search engines
* Internal enterprise tools
* Execution runtimes

Before MCP, every AI integration required custom glue code and proprietary orchestration logic.

That approach caused several problems:

* Tight coupling
* Fragile integrations
* Repeated engineering effort
* Vendor lock-in
* Difficult maintenance
* Inconsistent tool interfaces

MCP solves this by defining a universal protocol boundary between AI systems and external execution environments.

---

## MCP at a Glance

```text
┌─────────────────┐         Universal Protocol         ┌─────────────────┐
│                 │ ─────────────────────────────────> │  External Data  │
│    AI Models    │       Model Context Protocol       │    & Systems    │
│  (LLMs/Agents)  │ <───────────────────────────────── │ (Files, DBs...) │
└─────────────────┘                                    └─────────────────┘
```

With MCP, an AI agent can dynamically connect to external capabilities without requiring custom integrations for every new tool.

For example, an MCP-compatible AI agent could:

* Query databases
* Search the web
* Execute code
* Read and write files
* Call REST APIs
* Trigger workflows
* Operate cloud infrastructure

—all through a standardized interface.

This drastically reduces the complexity of extending AI systems in production environments.

---

## Why MCP Matters

MCP introduces several foundational advantages:

### 1. Standardized Tooling

Every tool follows a predictable protocol structure.

This means models can discover and invoke tools dynamically without hardcoded adapters.

### 2. Interoperability

Different AI vendors can communicate with the same MCP-compatible infrastructure.

### 3. Modularity

Capabilities become composable and replaceable.

### 4. Future-Proof Architecture

Tools evolve independently from the host AI application.

As long as both sides maintain protocol compatibility, systems remain interoperable.

---

## Industry Adoption

MCP rapidly gained traction across the AI ecosystem.

### [OpenAI](https://openai.com?utm_source=chatgpt.com)

Added MCP support across:

* Agents SDKs
* Desktop tooling
* Tool orchestration systems

### [Google DeepMind](https://deepmind.google?utm_source=chatgpt.com)

Adopted MCP-compatible approaches for standardized tool interaction patterns.

### [Anthropic](https://www.anthropic.com?utm_source=chatgpt.com)

Continues to lead protocol development and maintain the official SDK ecosystem.

This industry-wide alignment strongly suggests MCP is evolving into foundational infrastructure for modern AI systems.

---

# 2. Core Architecture: Hosts, Clients, and Servers

MCP systems are built around three core architectural roles:

1. **Host**
2. **Client**
3. **Server**

Understanding these roles is essential for building scalable and debuggable MCP integrations.

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         HOST APP                            │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │        Client A         │   │        Client B         │  │
│  └────────────┬────────────┘   └────────────┬────────────┘  │
└───────────────┼─────────────────────────────┼───────────────┘
                │                             │
       (1:1 stdio / HTTP)           (1:1 stdio / HTTP)
                │                             │
                ▼                             ▼
     ┌─────────────────────┐      ┌─────────────────────┐
     │      SERVER A       │      │      SERVER B       │
     │   Database Adapter  │      │   Web Search Tool   │
     └─────────────────────┘      └─────────────────────┘
```

---

## The Host

The **Host** is the primary orchestration environment where the AI runtime executes.

Think of the Host as the control center.

### Examples

* ChatGPT Desktop
* Claude Desktop
* AI coding assistants
* Autonomous agent frameworks
* Enterprise orchestration platforms

### Responsibilities

The Host is responsible for:

* Managing multiple clients
* Routing tool calls
* Maintaining security boundaries
* Handling user interaction
* Managing execution context
* Coordinating workflows

---

## The Client

The **Client** acts as the communication bridge between the Host and exactly one MCP Server.

### Cardinal Rule

> One Client ↔ One Server

This strict 1:1 relationship is a foundational MCP design principle.

### Responsibilities

A Client:

* Establishes transport connections
* Performs protocol handshakes
* Sends JSON-RPC requests
* Receives structured responses
* Manages process lifecycle
* Handles transport-level errors

### Why This Matters

Isolation improves:

* Stability
* Security
* Debuggability
* Fault containment

If a Host needs five tools, it creates five independent clients.

---

## The Server

The **Server** exposes capabilities to the Host.

Servers are responsible for:

* Tool registration
* Request handling
* Business logic execution
* Returning structured responses

### Examples

An MCP Server could wrap:

* PostgreSQL
* Redis
* GitHub APIs
* Weather services
* File systems
* Search engines
* Cloud providers

Servers may run:

* Locally
* Remotely
* Inside containers
* Across networks

---

## Architectural Summary

| Component  | Role                         | Cardinality                 | Responsibility          |
| ---------- | ---------------------------- | --------------------------- | ----------------------- |
| **Host**   | Main AI runtime              | 1 per environment           | Orchestrates everything |
| **Client** | Connection bridge            | 1:1 with Server             | Handles communication   |
| **Server** | External capability provider | 1:N (HTTP) or 1:1 (`stdio`) | Executes tools          |

---

# 3. Communication Protocol: How MCP Tool Calls Work

MCP uses **JSON-RPC 2.0** for all structured communication.

JSON-RPC is:

* Lightweight
* Language-agnostic
* Stateless
* Predictable
* Easy to serialize

This ensures interoperability across languages and execution environments.

---

# 4. MCP Tool Call Lifecycle

The MCP execution flow typically follows four stages:

```text
Agent / Client                                      MCP Server
│                                                   │
│ 1. Discover Tools (tools/list)                   │
│──────────────────────────────────────────────────>│
│                                                   │
│ 2. Tool Definitions Returned                     │
│<──────────────────────────────────────────────────│
│                                                   │
│ 3. Invoke Tool (tools/call)                      │
│──────────────────────────────────────────────────>│
│                                                   │
│ 4. Structured Result Payload                     │
│<──────────────────────────────────────────────────│
▼                                                   ▼
```

---

## Step 1 — Tool Discovery

The client first asks the server which tools are available.

### Example Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

---

### Example Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "name": "get_weather",
      "description": "Retrieves current weather information.",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City name or coordinates"
          }
        },
        "required": ["location"]
      }
    }
  ]
}
```

The returned schema tells the model:

* What tools exist
* What arguments are required
* How parameters should be structured

---

## Step 2 — Tool Invocation

Once the agent selects a tool, it invokes it using `tools/call`.

### Example Request

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "Paris"
    }
  }
}
```

---

## Step 3 — Server Execution

The server:

1. Receives the request
2. Validates arguments
3. Executes business logic
4. Returns structured results

### Example Response

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "temperature": 18,
    "unit": "Celsius",
    "condition": "Cloudy"
  }
}
```

---

# 5. MCP as the “USB-C for AI”

A common analogy is:

> MCP is the USB-C port for AI systems.

Before USB-C, hardware ecosystems were fragmented.

Different devices required:

* Different connectors
* Different protocols
* Different drivers

USB-C unified this ecosystem through standardized interfaces.

MCP applies the same philosophy to AI integrations.

---

## Fragmented vs Unified Architectures

```text
Legacy Integrations (Fragmented)

┌───────┐      Custom Code      ┌────────┐
│ Agent │ ────────────────────> │ Tool A │
├───────┤      Custom Code      ├────────┤
│ Agent │ ────────────────────> │ Tool B │
└───────┘                       └────────┘


Modern MCP Architecture (Unified)

┌───────┐      ┌─────┐      ┌────────┐
│ Agent │ ───> │ MCP │ ───> │ Tool A │
├───────┤      └─────┘      ├────────┤
│ Agent │ ─────────────────>│ Tool B │
└───────┘                   └────────┘
```

---

## Benefits of Standardization

### Plug-and-Play Tooling

New capabilities can be added immediately.

### Cross-Vendor Compatibility

Multiple AI systems can share the same MCP infrastructure.

### Reduced Engineering Overhead

No need for repeated custom integrations.

### Cleaner System Boundaries

Transport and execution logic become modular.

---

# 6. The Official TypeScript SDK

[Model Context Protocol SDK Repository](https://github.com/modelcontextprotocol?utm_source=chatgpt.com)

Anthropic maintains an official TypeScript SDK that abstracts away low-level protocol mechanics.

The SDK handles:

* JSON-RPC framing
* Transport management
* Connection lifecycle
* Tool registration
* Stream handling

This allows developers to focus on application logic rather than protocol plumbing.

---

# 7. Environment Setup

Install the SDK using your preferred package manager.

## NPM

```bash
npm install @modelcontextprotocol/sdk
```

## Yarn

```bash
yarn add @modelcontextprotocol/sdk
```

---

## Recommended TypeScript Runner

Using `tsx` simplifies execution during development.

```bash
npm install -g tsx
```

This allows TypeScript execution without a separate compilation phase.

---

# 8. Understanding the `stdio` Transport

MCP supports multiple transport layers.

One of the most common is:

```text
stdio
```

This uses standard input/output streams for inter-process communication.

---

## How `stdio` Works

```text
Client Process stdout ───────► Server stdin
Client Process stdin  ◄────── Server stdout
```

---

## Key Properties

### Same-Machine Communication

`stdio` is local IPC (Inter-Process Communication).

### Strict 1:1 Relationship

A `stdio` server communicates with exactly one client.

### Lifecycle Coupling

When the client exits, the server process terminates automatically.

---

## Why `stdio` Is Popular

It is:

* Simple
* Secure
* Fast
* Easy to sandbox
* Ideal for local tooling

This makes it perfect for:

* Desktop AI apps
* CLI tooling
* Local development environments

---

# 9. Reference Implementation: MCP Server

Below is a minimal MCP server implementation using the official SDK.

```typescript
// server.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 1. Initialize the MCP server
const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
  description: "Baseline MCP server example."
});

// 2. Create stdio transport
const transport = new StdioServerTransport();

// 3. Connect server to transport
await server.connect(transport);
```

---

## Running the Server

```bash
npx tsx server.ts
```

### Important Note

The process will appear to “hang”.

This is expected.

The server is waiting for a controlling client process to connect via `stdin/stdout`.

---

# 10. Reference Implementation: MCP Client

Below is a matching MCP client implementation.

```typescript
// client.ts

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 1. Configure transport
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "server.ts"]
});

// 2. Initialize client
const client = new Client({
  name: "example-client",
  version: "1.0.0"
});

try {
  console.log("Starting MCP server process...");

  // 3. Connect to server
  await client.connect(transport);

  console.log("Connected successfully.");

  // 4. Verify connectivity
  const pingResult = await client.ping();

  console.log("Ping result:", pingResult);

} catch (error) {

  console.error("MCP runtime error:", error);

} finally {

  // 5. Graceful shutdown
  await client.close();

  console.log("Connection closed.");
}
```

---

# 11. Expected Runtime Output

```text
Starting MCP server process...
Connected successfully.
Ping result: {}
Connection closed.
```

---

# 12. What Happens Behind the Scenes?

When the client starts:

## 1. Process Spawn

The client launches:

```bash
npx tsx server.ts
```

as a child process.

---

## 2. Stream Wiring

The client connects:

* Its write stream → server `stdin`
* Its read stream ← server `stdout`

---

## 3. Protocol Handshake

Both sides negotiate capabilities using JSON-RPC.

---

## 4. Request Execution

The client sends protocol messages like:

* `tools/list`
* `tools/call`
* `ping`

---

## 5. Graceful Shutdown

Calling:

```typescript
await client.close()
```

terminates streams and shuts down the child process safely.

---

# 13. Core Concepts Recap

You now understand the foundational concepts of MCP:

## Architectural Roles

* Hosts orchestrate execution
* Clients manage communication
* Servers expose capabilities

## Communication Standard

* JSON-RPC 2.0
* Structured
* Language-agnostic
* Predictable

## Transport Layer

* `stdio`
* HTTP
* IPC stream handling

## SDK Usage

* Official TypeScript SDK
* Server setup
* Client orchestration
* Lifecycle management

---

# 14. Next Steps

The next step in learning MCP is building real tools.

Typical progression includes:

1. Registering custom tools
2. Defining schemas
3. Integrating APIs
4. Adding authentication
5. Handling streaming responses
6. Implementing remote transports
7. Connecting real LLM runtimes

Once these concepts are combined, you can build fully extensible AI systems capable of dynamically interacting with real-world infrastructure.
