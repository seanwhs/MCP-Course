# 📘 Student Handbook: Model Context Protocol (MCP)

**Course Level:** Advanced System Architecture / AI Engineering

**Core Stack:** TypeScript, Model Context Protocol SDK, Express, Zod, TSX Engine

---

## 📑 Table of Contents

1. [Module 1: Getting Started with Local MCP (stdio)](https://www.google.com/search?q=%23module-1-getting-started-with-local-mcp-stdio)
2. [Module 2: Remote MCP Connectivity (Stateless HTTP)](https://www.google.com/search?q=%23module-2-remote-mcp-connectivity-stateless-http)
3. [Module 3: Managing Stateful MCP Sessions](https://www.google.com/search?q=%23module-3-managing-stateful-mcp-sessions)
4. [Module 4: Exploring MCP Primitives (Tools, Resources, Prompts)](https://www.google.com/search?q=%23module-4-exploring-mcp-primitives-tools-resources-prompts)
5. [Module 5: Architecture Lab: Building Service Tools](https://www.google.com/search?q=%23module-5-architecture-lab-building-service-tools)
6. [Module 6: Lab Setup & Environment Reference](https://www.google.com/search?q=%23module-6-lab-setup--environment-reference)

---

## 🧩 Module 1: Getting Started with Local MCP (stdio)

### 🎯 Learning Goal

Understand the fundamentals of process-based IPC (Inter-Process Communication) within the Model Context Protocol framework. You will learn how a client program explicitly hosts, communicates with, and cleans up a server running as a local subprocess.

### 🧠 Concept Overview

In `stdio` transport mode, network sockets are completely bypassed. Instead, communication relies directly on operating system standard streams:

* **`stdin` (Standard Input):** Used by the receiver to ingest JSON-RPC incoming frames.
* **`stdout` (Standard Output):** Used by the sender to emit JSON-RPC frames.

This pattern is highly secure and features minimal overhead, making it the default runtime design for desktop-based AI ecosystems like Claude Desktop.

### 🧪 Implementation Blueprint

#### `client.ts`

```typescript
// run with 'npx tsx client.ts'
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
  // Establish connection with the MCP server subprocess
  await client.connect(transport);
  console.log("Connected to the MCP server");

  const pingResult = await client.ping();
  console.log("Server ping result:", pingResult);
} catch (error) {
  console.error("Error occurred:", error);
} finally {
  // Ensure connection closes so the process can exit cleanly
  await client.close();
  console.log("Disconnected from the MCP server");
}

```

#### `server.ts`

```typescript
// run with 'npx tsx server.ts'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Initialize the MCP server with basic metadata
const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
  description: "Example description",
});

// Create a stdio transport instance
const transport = new StdioServerTransport();

// Connect the server to the transport
await server.connect(transport);
console.log('MCP Server Connected Successfully');

```

### 🔍 Deep-Dive Engineering Analysis

* **Process Lifecycle Coupling:** The server's operational lifetime is strictly tied to the parent client. When `client.close()` executes, the runtime triggers a SIGTERM/SIGKILL down to the child process.
* **Stream Pollution Hazard:** Because `stdout` is exclusively reserved for structural JSON-RPC frames, writing standard debugging statements via `console.log()` inside the server will break the client's parser. **Rule:** Always use `console.error()` for server logging in `stdio` mode to redirect output safely to `stderr`.

---

## 🌐 Module 2: Remote MCP Connectivity (Stateless HTTP)

### 🎯 Learning Goal

Transition from local process boundaries to network boundaries. You will learn how to handle stateless JSON-RPC over conventional HTTP request/response loops via Express.

### 🧠 Concept Overview

When your LLM backend is separated from your tools by a network layer, `stdio` is no longer viable. In a **Stateless HTTP Architecture**:

* Every single HTTP POST request targeting the endpoint maps to a discrete transaction.
* A temporary `McpServer` and transport wrapper are spun up *per incoming request*.
* The lifecycle lasts only as long as the underlying HTTP connection remains open.

### 🧪 Implementation Blueprint

#### `client.ts`

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = new URL("http://localhost:3000/mcp");
const client = new Client({ name: "example-client", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(baseUrl);

try {
  await client.connect(transport);
  console.log("Connected to MCP server using Streamable HTTP transport");

  const pingResult = await client.ping();
  console.log("Server ping result:", pingResult);
} catch (error) {
  console.error("Error occurred:", error);
} finally {
  await client.close();
  console.log("Disconnected from the MCP server");
}

```

#### `server.ts`

```typescript
import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json()); // Essential for mapping JSON-RPC bodies

app.post("/mcp", async (req: Request, res: Response) => {
  // Fresh initialization per individual HTTP transaction
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
    description: "Does nothing yet",
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Disables state tracking hooks
  });

  // Resource Leak Guard
  res.on("close", () => {
    console.log("Closing transport and server");
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    console.log(`\nMCP server ready to handle: ${req.body?.method || 'unknown method'}`);
    
    // Core Delegation: hand request parsing over to the SDK engine
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: req.body?.id || null,
      });
    }
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`MCP server running at http://localhost:${PORT}/mcp`));

```

### 🔍 Deep-Dive Engineering Analysis

* **Resource Leak Mitigation:** If a client drops offline during a long-running operational execution, the `res.on("close")` callback intercepts the event to call `.close()` on both structures, explicitly preventing memory bloat.
* **Scale Invariance:** Because the server holds zero in-memory context about previous requests, this endpoint can be immediately mirrored behind a layer-7 load balancer across an infinite number of computing instances.

---

## 🔐 Module 3: Managing Stateful MCP Sessions

### 🎯 Learning Goal

Implement persistent connection patterns over stateless protocols. You will build an in-memory session registry that maps incoming tracking tokens back to dedicated server connections.

### 🧠 Concept Overview

Complex tool chains require stateful sequences (e.g., initial handshakes followed by resource reads). To achieve continuity across multiple HTTP cycles, the system utilizes an interactive routing architecture:

1. **The Handshake Check:** The server intercepts incoming headers looking for a tracking token (`mcp-session-id`).
2. **Conditional Provisioning:** If no token is provided *and* the payload validates as an `initialize` request, the server issues a unique UUID token.
3. **Registry Ingestion:** A persistent `StreamableHTTPServerTransport` is created and mapped inside an in-memory cache registry.
4. **Contextual Routing:** All follow-up actions carry that token, routing the execution context directly to the cached transport instance.

### 🧪 Implementation Blueprint

#### `client.ts`

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/http.js";

async function runClient(){
  const serverUrl = "http://localhost:3000/mcp";
  let activeSessionId: string | null = null;

  const transport = new StreamableHTTPClientTransport({
    url: serverUrl,
    // Custom Interceptor: Inject active token into outbound request headers
    headers: () => activeSessionId ? { "mcp-session-id": activeSessionId } : {},
    // Capture Hook: Save token emitted by server on initialization
    onSessionInitialized: (sessionId) => { activeSessionId = sessionId; }
  });

  const client = new Client({ name: "example-stateful-client", version: "1.0.0" });

  try {
    await client.connect(transport);
    const pingResult = await client.ping();
    console.log("Server ping result:", JSON.stringify(pingResult));
    await client.close();
  } catch (error) {
    console.error("Client error:", error);
  }
}
runClient();

```

#### `server.ts`

```typescript
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

// Memory-backed registry for tracking sessions
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined = sid ? transports[sid] : undefined;

  // Provisioning Guard Clause
  if (!transport && isInitializeRequest(req.body)) {
    const server = new McpServer({
      name: "example-stateful-server",
      version: "1.0.0",
      description: "A stateful MCP server that maintains session continuity",
    });

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport as StreamableHTTPServerTransport;
      },
    });

    await server.connect(transport);
  }

  // Session Validation Failure Enforcement
  if (!transport) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: invalid or expired session" },
      id: null,
    });
  }

  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Processing exception:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Stateful Server running at http://localhost:${PORT}/mcp`));

```

---

## 🧱 Module 4: Exploring MCP Primitives (Tools, Resources, Prompts)

### 🎯 Learning Goal

Master the three foundational building blocks of MCP capabilities. This module covers how to declare primitives on the server and consume them on the client using a multi-phase discovery flow.

### 🧠 Primitive Matrix

| Primitive | Operation Mode | Primary Use Case | Architectural Analogy |
| --- | --- | --- | --- |
| **Tools** | Executable (`Read/Write`) | Side effects, calculations, mutating data arrays | Functions / Methods |
| **Resources** | Read-Only (`Read`) | Configuration files, database logs, live telemetry | REST GET Endpoints |
| **Prompts** | Declarative Templates | Guardrails, prompt styling, structural task assignments | Templating Engines |

### 🧪 Implementation Blueprint

#### `server.ts`

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "My Server",
  version: "1.0.0",
  description: "Demo MCP server with tools, resources, and prompts",
});

// 1. TOOL: Dynamic Calculation
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Returns the sum of two integers.",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);

// 2. RESOURCE: Static Application State
server.registerResource(
  "greeting",
  "resource://greeting",
  {
    title: "Greeting Resource",
    description: "A simple static greeting message.",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: "Hello from My Server!", mimeType: "text/plain" }],
  })
);

// 3. PROMPT: Interactive Formatting Structural Layout
server.registerPrompt(
  "ask_about_topic",
  {
    title: "Ask About Topic",
    description: "Generates a structured prompt asking for an explanation of a topic.",
    argsSchema: { topic: z.string() },
  },
  ({ topic }) => ({
    messages: [
      {
        role: "user",
        content: { type: "text", text: `Can you explain the concept of '${topic}' in simple terms?` },
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);

```

#### `client.ts`

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runClient() {
  const transport = new StdioClientTransport({ command: "npx", args: ["tsx", "server.ts"] });
  const client = new Client({ name: "example-client", version: "1.0.0" });

  try {
    await client.connect(transport);

    /* =========================================================
       1. DISCOVERY PHASE: Introspect Capabilities
    ========================================================= */
    const tools = await client.listTools();
    console.log("\n=== Discovered Tools ===");
    for (const t of tools.tools) console.log(`- ${t.name}: ${t.description}`);

    const resources = await client.listResources();
    console.log("\n=== Discovered Resources ===");
    for (const r of resources.resources) console.log(`- ${r.uri}: ${r.name}`);

    const prompts = await client.listPrompts();
    console.log("\n=== Discovered Prompts ===");
    for (const p of prompts.prompts) console.log(`- ${p.name}: ${p.description}`);

    /* =========================================================
       2. EXECUTION PHASE: Interacting with Primitives
    ========================================================= */
    // Execute Tool
    const toolResult = await client.callTool({ name: "add", arguments: { a: 5, b: 3 } });
    const toolText = (toolResult.content as any)[0].text;
    console.log(`\n[Tool Execution] add(5,3) Result: ${toolText}`);

    // Read Resource
    const resourceResult = await client.readResource({ uri: "resource://greeting" });
    console.log(`\n[Resource Read] Data: ${resourceResult.contents[0].text}`);

    // Compile Prompt Template
    const promptResult = await client.getPrompt({ name: "ask_about_topic", arguments: { topic: "Machine Learning" } });
    console.log(`\n[Prompt Generation] Compiled Template:\n${(promptResult.messages[0].content as any).text}`);

  } finally {
    await client.close();
  }
}
runClient();

```

---

## 🏗 Module 5: Architecture Lab: Building Service Tools

### 🎯 Learning Goal

Implement enterprise architectural patterns within an MCP ecosystem. You will apply a **Service-Engine Pattern** to split business logic away from transport interfaces, enforcing clean boundaries and strict schema execution.

### 🧠 Architecture Pattern

To keep things maintainable and decoupled, your codebase should be separated into three distinct layers:

```
  +--------------------------------------------------------+
  |                   1. Transport Layer                   |
  |                (server.ts / Express REST)              |
  +---------------------------+----------------------------+
                              |
                              v
  +--------------------------------------------------------+
  |              2. Protocol Adaptation Layer              |
  |            (mcp-server.ts / Zod Schemas)               |
  +---------------------------+----------------------------+
                              |
                              v
  +--------------------------------------------------------+
  |                 3. Application Service                 |
  |        (shopping-list-service.ts / State Memory)       |
  +--------------------------------------------------------+

```

1. **Transport Layer (`server.ts`):** Handles network configuration and keeps track of session lifecycles.
2. **Protocol Adaptation Layer (`mcp-server.ts`):** Registers tools, maps inputs to Zod schemas, and prepares responses for the protocol.
3. **Application Service (`shopping-list-service.ts`):** Contains the core business logic and state management. This layer remains entirely independent of MCP schemas.

### 🧪 Lab Codebase

#### Step 1: Core Service Domain Engine (`shopping-list-service.ts`)

```typescript
import { randomUUID } from 'crypto';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}

export class ShoppingListService {
  private items: ShoppingItem[];

  constructor() {
    this.items = [
      { id: randomUUID(), name: "Milk", quantity: 2, purchased: true },
      { id: randomUUID(), name: "Bread", quantity: 1, purchased: false },
      { id: randomUUID(), name: "Eggs", quantity: 12, purchased: true }
    ];
  }

  getItems(purchased?: boolean): ShoppingItem[] {
    if (purchased === undefined) return [...this.items];
    return this.items.filter(item => item.purchased === purchased);
  }

  addItem(name: string, quantity: number): ShoppingItem {
    const newItem: ShoppingItem = { id: randomUUID(), name, quantity, purchased: false };
    this.items.push(newItem);
    return newItem;
  }

  removeItem(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  setPurchased(itemId: string, purchased: boolean = true): boolean {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.purchased = purchased;
      return true;
    }
    return false;
  }
}

```

#### Step 2: Protocol Adaptation Adapter (`mcp-server.ts`)

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShoppingListService } from "./shopping-list-service.js";

export function createMcpServer(): { server: McpServer } {
  const server = new McpServer({ name: "shopping-list-server", version: "1.0.0" });
  const service = new ShoppingListService();

  registerShoppingListTools(server, service);
  return { server };
}

function registerShoppingListTools(server: McpServer, service: ShoppingListService) {
  // Read List Tool
  server.registerTool(
    "get_items",
    {
      description: "Get shopping list items with optional filtering by purchase status",
      inputSchema: { purchased: z.boolean().optional().describe("Filter by purchase status.") }
    },
    ({ purchased }) => {
      const items = service.getItems(purchased);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data: items }, null, 2) }] };
    }
  );

  // Write Target Item Tool
  server.registerTool(
    "add_item",
    {
      description: "Add a new item to the shopping list",
      inputSchema: {
        name: z.string().describe("Name of the item"),
        quantity: z.number().positive().describe("Quantity count")
      }
    },
    ({ name, quantity }) => {
      const newItem = service.addItem(name, quantity);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, data: newItem }, null, 2) }] };
    }
  );

  // Remove Item Tool
  server.registerTool(
    "remove_item",
    {
      description: "Remove an item from the shopping list",
      inputSchema: { itemId: z.string().describe("Target Item ID string") }
    },
    ({ itemId }) => {
      const success = service.removeItem(itemId);
      return { content: [{ type: "text", text: JSON.stringify({ success }, null, 2) }] };
    }
  );

  // Modify Status State Tool
  server.registerTool(
    "set_purchased",
    {
      description: "Mark an item purchase status state change",
      inputSchema: { itemId: z.string(), purchased: z.boolean().default(true) }
    },
    ({ itemId, purchased }) => {
      const success = service.setPurchased(itemId, purchased);
      return { content: [{ type: "text", text: JSON.stringify({ success }, null, 2) }] };
    }
  );
}

```

#### Step 3: Network Shell Wrapper Runtime (`server.ts`)

```typescript
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./mcp-server.js";

const app = express();
app.use(express.json());

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined = sid ? transports[sid] : undefined;

  if (!transport && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => { transports[id] = transport!; },
    });

    const { server } = createMcpServer();
    await server.connect(transport);
  }

  if (!transport) {
    return res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "Invalid session" }, id: null });
  }

  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => console.log("Architecture Lab Server running on port 3000"));

```

---

## ⚙️ Module 6: Lab Setup & Environment Reference

### 📦 Dependency Manifestation Installation

Execute this setup script inside an empty node project directory workspace to align runtime versions:

```bash
# Initialize Node.js environment layout configuration
npm init -y

# Core Model Context Protocol Engine SDK Library framework
npm install @modelcontextprotocol/sdk

# Production HTTP Server routing framework
npm install express

# Developer TypeScript Compilation typing headers
npm install --save-dev @types/express @types/node

# Native TypeScript instant execution engine
npm install -g tsx

```

### 🎮 Terminal Commands Execution

```bash
# Run Local Subprocess Engine Configuration (Module 1 / Module 4)
npx tsx client.ts

# Launch Multi-Layer Microservice Server Endpoint (Module 5)
npx tsx server.ts

```