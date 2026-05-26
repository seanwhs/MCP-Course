# 2. Remote MCP Server Connectivity

## Introduction & Context

Welcome back! In the previous lesson, you built a basic MCP server and client using the `stdio` transport. That setup allowed two processes running on the same machine to communicate with each other, giving you your first look at how the **Model Context Protocol (MCP)** enables AI agents to interact with external tools and systems.

As a quick recap:

* `stdio` transport is excellent for local development and experimentation.
* It is simple, lightweight, and easy to debug.
* However, it is limited to one-to-one communication on the same machine.

In this lesson, you’ll take the next major step: exposing your MCP server over the network using **Streamable HTTP transport**.

This is an important milestone because it enables your MCP server to:

* Accept connections from remote clients
* Run on different machines or cloud infrastructure
* Support real-world distributed architectures
* Handle multiple concurrent clients

By the end of this lesson, you will understand how to:

* Build an HTTP-based MCP server
* Connect MCP clients over the network
* Process MCP requests using Express.js
* Understand the MCP HTTP communication lifecycle
* Troubleshoot common connectivity issues

This lesson moves MCP from a local development concept into a practical production-ready architecture.

---

# Understanding Streamable HTTP Transport

Let’s first understand what **Streamable HTTP transport** actually means.

In the previous lesson, you used `stdio` transport, where two programs communicated through standard input and output streams:

```text
Client <---- stdin/stdout ----> Server
```

This works well locally, but it has several limitations:

* Both programs must run on the same machine
* Communication is tightly coupled
* Only a single client can communicate with the server at a time
* It is not suitable for internet or cloud deployments

---

## What Changes with HTTP?

With **Streamable HTTP transport**, MCP messages are sent over standard HTTP connections:

```text
Client <--HTTP/JSON-RPC--> MCP Server
```

This introduces several powerful capabilities:

| Capability            | Benefit                                           |
| --------------------- | ------------------------------------------------- |
| Remote access         | Clients and servers can run on different machines |
| Internet connectivity | MCP servers can be deployed to the cloud          |
| Multi-client support  | Multiple clients can connect simultaneously       |
| Standard protocols    | Uses widely supported HTTP infrastructure         |
| Scalability           | Easier to load balance and scale                  |

---

## Why Is It Called “Streamable”?

The word **streamable** refers to the ability for the server to send:

* A single response
* Or a stream of incremental responses

This enables advanced patterns such as:

* Progress updates
* Long-running tasks
* Real-time notifications
* Incremental AI responses

Conceptually:

```text
Traditional HTTP:
Client ---> Request ---> Server
Client <--- Single Response ---

Streamable HTTP:
Client ---> Request ---> Server
Client <--- Response Stream ---
```

This is similar to how modern web applications can update content in real time without refreshing the page.

---

# Transport Comparison

| Transport Type  | Environment        | Client Support   | Common Use Case        |
| --------------- | ------------------ | ---------------- | ---------------------- |
| `stdio`         | Local machine only | Single client    | Development & testing  |
| Streamable HTTP | Network / Cloud    | Multiple clients | Production deployments |

In practice, most production MCP deployments use HTTP-based transports because they integrate naturally with modern backend infrastructure.

---

# Why We Need a Web Server Framework

At this point, you might wonder:

> “Can’t `McpServer` or `StreamableHTTPServerTransport` directly run an HTTP server?”

The answer is **no**.

The MCP SDK is responsible for:

* Understanding MCP messages
* Handling JSON-RPC communication
* Managing transport protocol logic

However, it does **not** provide a full HTTP server implementation.

Think of the architecture like this:

```text
┌─────────────────────┐
│ Express.js          │  <-- Handles HTTP networking
│ (Web Server)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Streamable HTTP     │  <-- Converts HTTP ↔ MCP messages
│ Transport           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ MCP Server          │  <-- Handles MCP protocol logic
└─────────────────────┘
```

Each layer has a specific responsibility:

| Component      | Responsibility        |
| -------------- | --------------------- |
| Express.js     | HTTP networking       |
| HTTP Transport | MCP message transport |
| MCP Server     | MCP protocol behavior |

This separation of concerns keeps the architecture modular and flexible.

---

# Setting Up Express.js

We’ll use **Express.js** as the HTTP server framework because it is:

* Lightweight
* Widely used
* Easy to understand
* Perfect for API-style services

Start by creating a basic Express server:

```typescript
import express, { Request, Response } from "express";

// Create the Express app
const app = express();

// Automatically parse JSON request bodies
app.use(express.json());

// Port configuration
const PORT = 3000;

// Start the server
app.listen(PORT, () =>
  console.log(`MCP server running at http://localhost:${PORT}/mcp`)
);
```

---

## What This Code Does

### 1. Creates the Express Application

```typescript
const app = express();
```

This creates the web server instance.

---

### 2. Enables JSON Parsing

```typescript
app.use(express.json());
```

MCP messages are sent as JSON-RPC payloads.

Without this middleware:

* `req.body` would be undefined
* Express would not automatically parse incoming JSON

---

### 3. Starts Listening for Requests

```typescript
app.listen(PORT, ...)
```

This tells Express to begin accepting HTTP connections on port `3000`.

---

# Creating the MCP Endpoint

Now we need an endpoint that receives MCP requests.

Add the following route:

```typescript
app.post("/mcp", async (req: Request, res: Response) => {
  // MCP logic will go here
});
```

This creates an HTTP POST endpoint at:

```text
http://localhost:3000/mcp
```

---

## Why POST Requests?

MCP uses **JSON-RPC**, which sends structured request data in the HTTP body.

POST requests are ideal because they:

* Allow request bodies
* Support JSON payloads
* Are standard for RPC-style communication

Each MCP operation—such as:

* `initialize`
* `ping`
* tool calls
* resource requests

will arrive as a POST request to `/mcp`.

---

# Creating the MCP Server and Transport

Inside the route handler, create the MCP server and HTTP transport.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

app.post("/mcp", async (req: Request, res: Response) => {
  // Create the MCP server
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
    description: "Does nothing yet",
  });

  // Create the transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
});
```

---

# Understanding Stateless Mode

Notice this configuration:

```typescript
sessionIdGenerator: undefined
```

This enables **stateless mode**.

In stateless mode:

* Every request is independent
* No session data is preserved
* A fresh transport/server pair is created per request

Conceptually:

```text
Request 1 --> New Server + New Transport
Request 2 --> New Server + New Transport
Request 3 --> New Server + New Transport
```

---

## Why Use Stateless Mode?

Stateless architectures are:

* Simpler to reason about
* Easier to scale horizontally
* Easier to debug
* Safer for isolated request handling

This is common in cloud-native systems.

---

# Connecting the Server and Transport

Now connect the MCP server and transport:

```typescript
try {
  // Connect transport and server
  await server.connect(transport);

  // Log incoming MCP method
  console.log(
    `\nMCP server ready to handle: ${
      req.body?.method || "unknown method"
    }`
  );

  // Handle the MCP request
  await transport.handleRequest(req, res, req.body);
} catch (err) {
  // Error handling comes next
}
```

---

## What Happens Here?

### `server.connect(transport)`

This links:

* the MCP protocol engine
* to the HTTP transport layer

Without this connection, the server cannot process MCP messages.

---

### `transport.handleRequest(...)`

This method:

1. Reads the incoming JSON-RPC request
2. Routes it into the MCP server
3. Generates the MCP response
4. Sends the HTTP response back to the client

---

# Adding Cleanup and Error Handling

Production-grade systems must clean up resources properly.

Add the following:

```typescript
res.on("close", () => {
  console.log("Closing transport and server");
  transport.close();
  server.close();
});
```

This ensures resources are released when the HTTP request ends.

---

## Full Error Handling

```typescript
catch (err) {
  console.error("MCP error:", err);

  if (!res.headersSent) {
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal server error",
      },
      id: null,
    });
  }
}
```

This returns a valid JSON-RPC error response if something fails.

---

# Complete `server.ts`

Here is the complete implementation:

```typescript
import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Create Express app
const app = express();

// Parse JSON request bodies
app.use(express.json());

// MCP endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  // Create MCP server
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
    description: "Does nothing yet",
  });

  // Create transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // Cleanup resources
  res.on("close", () => {
    console.log("Closing transport and server");
    transport.close();
    server.close();
  });

  try {
    // Connect server and transport
    await server.connect(transport);

    // Log incoming method
    console.log(
      `\nMCP server ready to handle: ${
        req.body?.method || "unknown method"
      }`
    );

    // Process request
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Start server
const PORT = 3000;

app.listen(PORT, () =>
  console.log(`MCP server running at http://localhost:${PORT}/mcp`)
);
```

---

# Running the Server

When you start the server, you should see:

```text
MCP server running at http://localhost:3000/mcp
```

This means your MCP server is now reachable over HTTP.

---

# Understanding MCP HTTP Communication

Now let’s examine how communication actually flows between the client and server.

---

# Client → Server Communication

Clients send MCP messages using HTTP POST requests.

Example flow:

```text
Client
   │
   ├── POST /mcp
   │     {
   │       "jsonrpc": "2.0",
   │       "method": "ping"
   │     }
   │
   ▼
Server
```

The request body contains JSON-RPC messages.

---

# Server → Client Communication

The server may respond in two ways:

| Response Type | Use Case                        |
| ------------- | ------------------------------- |
| Standard JSON | Simple request/response         |
| SSE Stream    | Streaming/progressive responses |

---

# What Is SSE?

SSE stands for **Server-Sent Events**.

It allows the server to continuously push messages over a single HTTP connection.

Example:

```text
Client ---> Request
Server ---> Progress update
Server ---> More updates
Server ---> Final result
```

---

# What Our Example Supports

Our implementation only supports:

* HTTP POST requests
* Single JSON responses

We are **not** implementing:

* SSE streaming
* Persistent GET connections
* Server push notifications

This keeps the example intentionally simple.

---

# Optional GET Handler

To explicitly reject unsupported GET requests:

```typescript
app.get("/mcp", async (req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed",
    },
    id: null,
  });
});
```

---

# Building the HTTP MCP Client

Now let’s build a client.

Create `client.ts`:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// MCP server URL
const baseUrl = new URL("http://localhost:3000/mcp");

// Create client
const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

// Create transport
const transport = new StreamableHTTPClientTransport(baseUrl);

try {
  // Connect client
  await client.connect(transport);

  console.log(
    "Connected to MCP server using Streamable HTTP transport"
  );

  // Send ping
  const pingResult = await client.ping();

  console.log("Server ping result:", pingResult);
} catch (error) {
  console.error("Error occurred:", error);
} finally {
  // Close connection
  await client.close();

  console.log("Disconnected from the MCP server");
}
```

---

# Understanding the Client Workflow

The client performs several steps:

```text
1. Create transport
2. Connect to server
3. Initialize MCP session
4. Send requests
5. Receive responses
6. Close connection
```

The transport abstracts away all HTTP communication details.

---

# Expected Client Output

```text
Connected to MCP server using Streamable HTTP transport
Server ping result: {}
Disconnected from the MCP server
```

---

# Understanding the Server Output

Meanwhile, the server displays:

```text
MCP server running at http://localhost:3000/mcp

MCP server ready to handle: initialize
Closing transport and server

MCP server ready to handle: notifications/initialized
Closing transport and server

MCP server ready to handle: ping
Closing transport and server
```

---

# Why Multiple Requests Occur

Before actual work begins, the MCP protocol performs a handshake sequence.

The lifecycle looks like this:

```text
Client --> initialize
Server --> initialize response

Client --> notifications/initialized

Client --> ping
Server --> ping response
```

---

# Why Resources Close Repeatedly

Because we are operating in stateless mode:

* each HTTP request creates a fresh server
* each request gets a new transport
* resources are cleaned up immediately afterward

This is why you repeatedly see:

```text
Closing transport and server
```

---

# End-to-End Communication Flow

Here’s the complete lifecycle:

```text
┌─────────┐
│ Client  │
└────┬────┘
     │ initialize
     ▼
┌─────────┐
│ Server  │
└────┬────┘
     │ initialized notification
     ▼
┌─────────┐
│ Server  │
└────┬────┘
     │ ping
     ▼
┌─────────┐
│ Server  │
└─────────┘
```

---

# Summary

In this lesson, you learned how to:

* Move from local `stdio` transport to network-based HTTP transport
* Build an Express-powered MCP server
* Use `StreamableHTTPServerTransport`
* Connect remote MCP clients
* Understand MCP initialization and request flow
* Handle cleanup and JSON-RPC errors properly
* Operate MCP in stateless mode

This is a major step toward building real production MCP systems.

You now have the foundation needed to:

* Deploy MCP servers remotely
* Integrate AI systems across machines
* Build scalable MCP infrastructure
* Support multi-client architectures

---

# Next Steps

In the next lesson, you will:

* Run the server and client yourself
* Send custom MCP requests
* Add tools and resources
* Experiment with remote connectivity
* Explore more advanced transport patterns

You are now transitioning from simple local experimentation into real distributed MCP application development.
