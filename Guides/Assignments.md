## 🏗️ Section 1: Hands-on Laboratory Assignments

### Lab 1.1: The Secure Local Filesystem Explorer (Stdio Transport)

**Objective:** Build an MCP server that communicates over `stdio` to safely read files from a designated workspace directory.

#### Architectural Requirements

* Implement a tool named `secure_read_file`.
* Accept a relative `filePath` parameter via Zod validation.
* **Security Constraint:** The tool must prevent path traversal attacks. If a client passes an argument containing `..` or attempts to escape the root directory, it must throw a descriptive error rather than exposing host files.

#### Implementation Stubs

Use these structures to complete the assignment:

```typescript
// lab1-server.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as path from "path";
import * as fs from "fs/promises";

const ALLOWED_ROOT = path.resolve("./workspace");

const server = new McpServer({
  name: "secure-file-explorer",
  version: "1.0.0"
});

server.registerTool(
  "secure_read_file",
  {
    description: "Reads the string contents of a file inside the allowed workspace directory safely.",
    inputSchema: {
      filePath: z.string().describe("Relative path to the file inside the workspace.")
    }
  },
  async ({ filePath }) => {
    // TODO: 1. Resolve absolute path combined with ALLOWED_ROOT
    // TODO: 2. Implement safety guard to block directory traversal ('..')
    // TODO: 3. Read the file content or catch errors gracefully
    return {
      content: [{ type: "text", text: "Not implemented yet" }]
    };
  }
);

// Bootstrap Server...

```

---

### Lab 1.2: The Distributed Metrics Dashboard (Stateful HTTP Tracking)

**Objective:** Implement a distributed monitoring microservice over HTTP that retains multi-step connection memory using an in-memory session store.

#### Architectural Requirements

* **Phase 1 (State Tracking):** The custom Express server must assign a unique UUID connection token to clients that provide a valid `initialize` request missing a `mcp-session-id` header.
* **Phase 2 (The Capability Primitive):** Register a dynamic resource endpoint at `metrics://live`.
* **Phase 3 (Operational Execution):** The resource query must return live application metrics (e.g., uptime, total memory use, and process PID).

---

## 🛠️ Section 2: Error-Correction Assignments (Debugging Labs)

Locate, diagnose, and fix the architectural bugs hidden inside the following broken implementation snippets.

### Debugging Case 2.1: The Silent Stream Crasher

**Scenario:** A developer attempts to add simple tracing logs inside a local `stdio` server script. However, whenever the client triggers an MCP action, the client crashes immediately with a parsing error.

#### Broken Server Implementation

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "buggy-logger", version: "1.0.0" });

server.registerTool(
  "calculate_bonus",
  { inputSchema: { base: z.number() } },
  async ({ base }) => {
    // Tracing Log to monitor input metrics
    console.log(`[DEBUG LOG]: Processing calculate_bonus with base value: ${base}`);
    
    const payout = base * 1.15;
    return {
      content: [{ type: "text", text: String(payout) }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

```

#### Diagnostic Prompt

1. Explain why `console.log()` breaks the underlying communications layer in a `stdio` environment.
2. Refactor the code block so it safely logs debugging data without disrupting the communication stream.

---

### Debugging Case 2.2: The HTTP Memory Bleed

**Scenario:** A stateless HTTP staging deployment is crashing due to memory exhaustion under heavy load. Profiling reveals that thousands of dead `McpServer` handles are remaining in memory after requests finish processing.

#### Broken Express Route

```typescript
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = new McpServer({ name: "stateless-leak", version: "1.0.0" });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  // Connection ends, but server references remain allocated in memory...
});

```

#### Diagnostic Prompt

1. Identify the missing lifecycle event listener that is causing the memory leak.
2. Provide the corrected Express request handler code block.

---

## 🧠 Section 3: Multiple-Choice Knowledge Quizzes

Select the best answer for each question.

### Question 1

When executing an MCP Server using the **StdioServerTransport** model, how should runtime internal logging info be outputted safely to avoid corrupting data packets?

* A) `console.log(JSON.stringify(message))`
* B) `process.stdout.write(message)`
* C) `console.error(message)`
* D) `process.send(message)`

### Question 2

In an architectural context utilizing stateless **StreamableHTTPServerTransport** (where `sessionIdGenerator` is set to `undefined`), what happens to the `McpServer` instance when a client sends a new request?

* A) The server recovers the connection context from an internal database using the client IP.
* B) A new `McpServer` instance must be instantiated, connected, and torn down for every individual request transaction.
* C) The framework saves a reference to the server instance inside the native thread pool.
* D) The connection automatically switches to an open WebSocket layer instead.

### Question 3

Which architectural primitive should you choose if you want to expose a read-only dataset (such as static system settings or dynamic temperature telemetry) via a URI lookup?

* A) Tool
* B) Prompt
* C) Resource
* D) Action

### Question 4

Look at the code pattern below:

```typescript
headers: () => activeSessionId ? { "mcp-session-id": activeSessionId } : {}

```

What is the primary engineering reason for adding this logic to an HTTP-based MCP Client Transport?

* A) It compresses large JSON payloads to reduce network latency.
* B) It injects a security token used for role-based access control.
* C) It passes a consistent session ID across separate HTTP requests, allowing the server to map requests back to a persistent connection handle.
* D) It triggers automated load-balancing routing rules across a cluster.

---

## 🔑 Workbook Answer Key & Diagnostic Guide

### Section 1: Lab Solutions (Reference Implementations)

#### Lab 1.1 Secure Implementation Snippet

```typescript
async ({ filePath }) => {
  // Resolve absolute path safely
  const targetPath = path.resolve(ALLOWED_ROOT, filePath);

  // Enforce boundary validation to block path traversal
  if (!targetPath.startsWith(ALLOWED_ROOT)) {
    throw new Error("Access Denied: Path traversal detected outside allowed directory.");
  }

  try {
    const contents = await fs.readFile(targetPath, "utf-8");
    return { content: [{ type: "text", text: contents }] };
  } catch (err: any) {
    return { content: [{ type: "text", text: `File read error: ${err.message}` }] };
  }
}

```

---

### Section 2: Debugging Code Corrections

#### Case 2.1 Resolution

* **The Root Bug:** `console.log()` outputs directly to `stdout`. In a `stdio` environment, `stdout` is reserved for structured JSON-RPC communication frames. Writing unstructured strings to it breaks the client's parser.
* **The Fix:** Redirect all logs to `stderr` by changing `console.log` to `console.error`.

```typescript
// Corrected Log Execution:
console.error(`[DEBUG LOG]: Processing calculate_bonus with base value: ${base}`);

```

#### Case 2.2 Resolution

* **The Root Bug:** The Express route does not clean up resources when an HTTP request finishes or drops unexpectedly. As a result, the server and transport instances stay allocated in the V8 heap engine.
* **The Fix:** Add an event listener to the response object (`res.on("close")`) to explicitly clean up resources when the request completes.

```typescript
// Corrected Leak Interceptor Implementation:
res.on("close", () => {
  transport.close();
  server.close();
});

```

---

### Section 3: Quiz Answers

1. **C** — `console.error` writes to `stderr`, keeping `stdout` completely clean for standard JSON-RPC data frames.
2. **B** — In a stateless setup, a new server instance must be built and initialized from scratch for every incoming request.
3. **C** — Resources are specifically designed to handle read-only data lookups via URIs.
4. **C** — This mapping header links independent HTTP operations back to a persistent, stateful connection handle in memory.