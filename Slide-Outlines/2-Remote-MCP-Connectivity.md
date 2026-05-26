# **Slide 1 — Title**

## MCP Streamable HTTP Transport

### Moving from Local stdio to Remote AI Connectivity

* From local process communication → networked MCP systems
* Enabling real-world distributed AI tool access

---

# **Slide 2 — Recap: stdio Transport (Previous Lesson)**

## Local MCP Communication Model

* Uses **stdin / stdout pipes**
* Works only on the same machine
* One-to-one process communication

### Limitation

* ❌ No network access
* ❌ Not scalable

---

# **Slide 3 — What You’re Building Now**

## Streamable HTTP Transport

Upgrade MCP from:

> Local process system → Distributed network service

### New capabilities:

* Remote access over HTTP
* Multi-machine communication
* Cloud deployment ready

---

# **Slide 4 — What “Streamable HTTP” Means**

## HTTP-Based MCP Communication

* MCP messages sent via **HTTP POST**
* Payload = JSON-RPC
* Optional streaming via SSE

### Analogy:

* stdio → walkie-talkie
* HTTP → internet messaging system

---

# **Slide 5 — Why We Need Express**

## MCP Alone is NOT a Web Server

MCP provides:

* Protocol logic
* Message handling

But it does NOT provide:

* HTTP routing
* Port listening
* Request lifecycle

👉 That’s why we use **Express**

---

# **Slide 6 — Step 1: Minimal Express Server**

## Foundation Layer

```ts
import express from "express";

const app = express();
app.use(express.json());

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

# **Slide 7 — Step 2: Add MCP Endpoint**

## Introduce `/mcp` Route

```ts
app.post("/mcp", async (req, res) => {
  // MCP logic will go here
});
```

### Key Idea:

* MCP communication always starts here
* POST = JSON-RPC message transport

---

# **Slide 8 — Step 3: Inspect Incoming Messages**

## Debug First Step

```ts
app.post("/mcp", (req, res) => {
  console.log("Incoming MCP message:", req.body);

  res.json({ status: "received" });
});
```

### Purpose:

* Verify client communication works
* Validate JSON payload structure

---

# **Slide 9 — Step 4: Introduce MCP Server**

## Add MCP Core Engine

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
```

### Create instance (per request later):

* Handles MCP protocol logic
* Registers tools / capabilities

---

# **Slide 10 — Step 5: Add HTTP Transport**

## Streamable HTTP Bridge

```ts
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
```

### Purpose:

* Converts MCP ↔ HTTP
* Bridges protocol + web layer

---

# **Slide 11 — Step 6: Create MCP + Transport**

## First Full MCP Wiring

```ts
app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.json({ status: "created" });
});
```

---

# **Slide 12 — Step 7: Add Lifecycle Cleanup**

## Prevent Memory Leaks

```ts
res.on("close", () => {
  transport.close();
  server.close();
});
```

### Why this matters:

* Each request = new instance
* Must clean up immediately

---

# **Slide 13 — Step 8: Connect MCP System**

## Link Protocol + Transport

```ts
await server.connect(transport);
```

### Meaning:

* MCP engine attaches to HTTP bridge
* Enables message processing

---

# **Slide 14 — Step 9: Handle MCP Request**

## Core Execution Step

```ts
await transport.handleRequest(req, res, req.body);
```

### What happens:

* Parse JSON-RPC
* Execute MCP method
* Send response

---

# **Slide 15 — Step 10: Add Logging**

## Observability Layer

```ts
console.log("Method:", req.body?.method);
```

### Why:

* Debug MCP handshake
* Track tool calls
* Understand client behavior

---

# **Slide 16 — Step 11: Full Server (Assembled)**

## Complete MCP HTTP Server

```ts
app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);

    console.log("Method:", req.body?.method);

    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: req.body?.id ?? null
      });
    }
  }
});
```

---

# **Slide 17 — Step 12: Build the Client (Step-by-Step)**

## Step 1: Create Client

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
```

```ts
const client = new Client({
  name: "example-client",
  version: "1.0.0"
});
```

---

# **Slide 18 — Step 13: Add HTTP Transport (Client)**

## Connect to Server

```ts
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = new URL("http://localhost:3000/mcp");

const transport = new StreamableHTTPClientTransport(baseUrl);
```

---

# **Slide 19 — Step 14: Connect Client**

## Establish MCP Session

```ts
await client.connect(transport);

console.log("Connected to MCP server");
```

---

# **Slide 20 — Step 15: Send MCP Request**

## Ping Test

```ts
const result = await client.ping();

console.log("Ping result:", result);
```

---

# **Slide 21 — Step 16: Cleanup Client**

## Always Close Connection

```ts
await client.close();

console.log("Disconnected");
```

---

# **Slide 22 — Full Client (Assembled)**

```ts
const client = new Client({
  name: "example-client",
  version: "1.0.0"
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

try {
  await client.connect(transport);

  console.log("Connected");

  const result = await client.ping();
  console.log("Ping result:", result);

} catch (err) {
  console.error(err);

} finally {
  await client.close();
  console.log("Disconnected");
}
```

---

# **Slide 23 — End-to-End Flow**

## Full System Execution

```text
Client
  ↓
HTTP POST /mcp
  ↓
Express Server
  ↓
McpServer
  ↓
StreamableHTTP Transport
  ↓
Response
```

---

# **Slide 24 — Key Mental Model**

## MCP HTTP Architecture Layers

* Express → networking layer
* Transport → protocol bridge
* McpServer → intelligence layer
* Client → consumer layer

---

# **Slide 25 — Summary**

## What You Built

* Step-by-step MCP HTTP server
* Express integration layer
* Streamable transport system
* Full client-server MCP cycle

---

# **Slide 26 — Next Step**

## What’s Next

* Adding tools to MCP server
* Stateful sessions
* Streaming responses (SSE)
* Production deployment patterns

