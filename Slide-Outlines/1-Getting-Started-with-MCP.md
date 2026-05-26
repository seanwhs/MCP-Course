# **Slide 1 — Title**

## Model Context Protocol (MCP)

**A Universal Standard for Connecting AI Agents to Tools**

---

# **Slide 2 — What is MCP?**

* MCP (Model Context Protocol) is an open standard introduced by Anthropic in late 2024
* Enables LLMs to interact with external tools, systems, and data sources
* Standardizes how context and commands are exchanged between AI systems and software

---

# **Slide 3 — The Problem Before MCP**

* Every AI-tool integration was custom-built
* No shared interoperability standard across systems
* High engineering overhead for each new connection
* Fragile, duplicated, and hard-to-maintain implementations

---

# **Slide 4 — What MCP Solves**

* Provides a universal protocol for AI ↔ tool integration
* Enables a plug-and-play ecosystem of tools
* Encourages reusable tool servers
* Dramatically reduces agent development time

---

# **Slide 5 — Core Idea**

* LLMs do not execute actions directly
* Instead, they **delegate execution to tools via MCP**
* MCP acts as the **standard communication bridge**
* Tools become modular, composable capabilities

---

# **Slide 6 — MCP Architecture Overview**

* **Host** → AI application (e.g., ChatGPT, Claude, agent runtime)
* **Client** → Connector layer (1 client ↔ 1 server)
* **Server** → Tool provider (APIs, databases, file systems, services)

---

# **Slide 7 — Key Relationship Model**

* One host can manage multiple clients
* Each client connects to exactly one server
* Servers can support multiple clients (HTTP transport)
* `stdio` transport enforces strict 1:1 process coupling

---

# **Slide 8 — How Tools Work in MCP**

* Tools represent executable capabilities exposed by servers
* Communication uses **JSON-RPC 2.0**
* Core methods:

  * `tools/list` → discover available tools
  * `tools/call` → execute a selected tool

---

# **Slide 9 — Tool Execution Flow**

1. Agent requests available tools
2. Server returns tool schemas
3. Agent selects an appropriate tool
4. Agent sends a tool execution request
5. Server executes and returns the result

---

# **Slide 10 — Transport Layer**

* **stdio transport**

  * Local process communication
  * One client ↔ one server
  * Fast, simple, ideal for development

* **HTTP transport**

  * Network-based communication
  * Supports multiple clients
  * Production-ready and scalable

---

# **Slide 11 — MCP TypeScript SDK**

* Official SDK maintained for MCP implementations

* Provides:

  * Server primitives (`McpServer`)
  * Client primitives (`Client`)
  * Transport implementations

* Installation:

```bash
npm install @modelcontextprotocol/sdk
```

---

# **Slide 12 — STEP 1: Build MCP Server (Overview)**

We will now build:

* `server.ts`
* A minimal MCP tool server
* Using `stdio` transport

**Goal:**
👉 Create a server that responds to a `ping` request

---

# **Slide 13 — STEP 2: Create server.ts (Setup)**

### 1. Import SDK modules

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

---

### 2. Initialize server instance

```ts
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0",
  description: "My first MCP server",
});
```

---

# **Slide 14 — STEP 3: Attach Transport**

### Create stdio transport

```ts
const transport = new StdioServerTransport();
```

### Connect server to transport

```ts
await server.connect(transport);
```

---

# **Slide 15 — STEP 4: Run Server**

```bash
npx tsx server.ts
```

### Behavior:

* Server starts silently
* Waits for an incoming client connection
* Produces no output unless invoked by a client

---

# **Slide 16 — STEP 5: Build MCP Client (Overview)**

We now implement:

* `client.ts`
* A process launcher + communication layer
* Uses `stdio` transport to spawn the server

**Goal:**
👉 Client automatically launches and connects to the server

---

# **Slide 17 — STEP 6: Create client.ts (Transport Setup)**

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
```

---

### Define transport (spawns server process)

```ts
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "server.ts"]
});
```

---

# **Slide 18 — STEP 7: Create Client Instance**

```ts
const client = new Client({
  name: "demo-client",
  version: "1.0.0"
});
```

---

# **Slide 19 — STEP 8: Connect + Communicate**

```ts
try {
  await client.connect(transport);

  console.log("Connected to MCP server");

  const result = await client.ping();

  console.log("Server ping result:", result);

} catch (error) {
  console.error("Error occurred:", error);
} finally {
  await client.close();
  console.log("Disconnected from MCP server");
}
```

---

# **Slide 20 — STEP 9: Run Client**

```bash
npx tsx client.ts
```

### Execution flow:

* Client spawns server process
* Establishes stdio-based communication
* Sends a `ping` request
* Receives and logs response

---

# **Slide 21 — Behind the Scenes**

* Two processes are created:

  * Client process
  * Server process (spawned by client)

* Communication occurs via:

  * `stdin` → server input stream
  * `stdout` → server output stream

* Messages are serialized using **JSON-RPC 2.0**

---

# **Slide 22 — Why stdio Matters**

* No networking setup required
* Ideal for local development and testing
* Deterministic lifecycle control
* Strict one-to-one process isolation

---

# **Slide 23 — Why MCP is Like USB-C**

* One universal integration standard
* Eliminates bespoke connectors between systems
* Enables plug-and-play tool interoperability
* Works across vendors and platforms
* Future-proof abstraction layer for AI tools

---

# **Slide 24 — Industry Adoption**

* Adopted across modern AI agent ecosystems
* Used in tool-augmented application frameworks
* Rapidly expanding into production-grade systems in 2025+
* Emerging as a default interface standard for AI-tool interaction

---

# **Slide 25 — Summary**

* MCP standardizes communication between AI systems and tools
* Built on a client–server architecture
* Uses JSON-RPC as the messaging protocol
* Supports modular tool servers
* Enables scalable agent ecosystems

---

# **Slide 26 — Final Hands-On Outcome**

After completing this build, you now have:

* A working MCP server (`server.ts`)
* A working MCP client (`client.ts`)
* A full local AI ↔ tool communication loop
* A foundation for building tool-augmented agents

