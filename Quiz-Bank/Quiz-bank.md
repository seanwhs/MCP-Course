# **Model Context Protocol (MCP) —  Quiz Bank**

This quiz bank is based on the Model Context Protocol (MCP) course code snippets. It is organized into layered architectural tiers, ranging from foundational system design to transport mechanics, API primitives, session management, and multi-tenant execution behavior.

---

## Section 1: Core Architecture & Lifecycle Mechanics

### Q1. Core Concepts

In the Standard Input/Output (Stdio) architecture example, how does the client establish and run the server instance?

A. It sends a fetch request to a designated background system process port.
B. It spawns the server as a local child process using execution arguments (`npx tsx server.ts`) managed over standard input/output streams.
C. It registers a webhook URL that the server invokes upon completing its bootstrap phase.
D. It relies on a global Unix domain socket file managed dynamically by the OS kernel.

**Correct Answer:** B

**Explanation:** `StdioClientTransport` launches the server as a child process using a command such as `npx` and arguments like `["tsx", "server.ts"]`. Communication is handled via stdin/stdout streams using JSON-RPC, allowing tight local process coupling without networking overhead.

---

### Q2. Component Lifecycles

In the `finally` block of the `client.ts` implementation, what critical operational hazard is avoided by calling `await client.close()`?

A. It prevents local runtime compilation errors inside the TypeScript engine.
B. It clears persistent application caches inside the server filesystem layer.
C. It ensures that active process loops or transport channels are cleanly closed, preventing the parent process from hanging.
D. It forces an execution rollback to the initial `initialize` handshake.

**Correct Answer:** C

**Explanation:** Without explicitly closing the client, open transport streams and event listeners remain active, preventing Node.js from exiting. `client.close()` ensures proper cleanup of resources and allows the event loop to terminate cleanly.

---

### Q3. JSON-RPC Standards

In the stateless Express `/mcp` endpoint, what is returned in the catch block if an internal error occurs before headers are sent?

A. A plaintext stack trace message.
B. A 204 No Content response with a debug flag.
C. A JSON-RPC 2.0 error object with code `-32603` and the original request ID.
D. A redirect to a health-check endpoint.

**Correct Answer:** C

**Explanation:** MCP follows JSON-RPC 2.0 specifications. When an internal server error occurs, it returns a structured error response containing the standard error code `-32603`, ensuring clients can reliably interpret failure states without relying on raw exceptions.

---

## Section 2: Transport Layer Variations (Stdio vs HTTP)

### Q4. Architecture Modeling

What fundamental difference separates `StreamableHTTPServerTransport` from `StdioServerTransport` in terms of lifecycle behavior?

A. Stdio supports multiple concurrent TCP sockets.
B. Stdio persists for the session, while HTTP creates new instances per request.
C. HTTP bypasses JSON-RPC in favor of REST endpoints.
D. HTTP disables multi-parameter tool execution.

**Correct Answer:** B

**Explanation:** Stdio maintains a persistent process connection, while HTTP is stateless by nature. As a result, HTTP implementations typically create a new server and transport instance for each request unless session management is explicitly added.

---

### Q5. Memory Management

Why is `res.on("close")` used in stateless Express MCP routes?

A. To persist computation state to disk.
B. To log audit trails.
C. To clean up transport and server instances when the request ends.
D. To trigger a client reload.

**Correct Answer:** C

**Explanation:** HTTP requests are short-lived. Without cleanup on `res.close`, transport instances may persist in memory, leading to leaks. The event listener ensures proper teardown after request completion.

---

## Section 3: Stateful Session Tracking Over HTTP

### Q6. Client State Propagation

How does a stateful MCP HTTP client maintain session continuity?

A. By appending query parameters to the URL.
B. By injecting an `mcp-session-id` header via a transport callback.
C. By opening a WebSocket channel.
D. By relying on browser cookies.

**Correct Answer:** B

**Explanation:** The client injects a session identifier into request headers using a dynamic callback. This allows the server to associate requests with a previously initialized session.

---

### Q7. Server Multi-Tenancy Logic

What does this condition enforce?

```typescript
if (!transport && isInitializeRequest(req.body)) { ... }
```

A. Authentication enforcement for all requests.
B. Session creation only during valid initialization handshake.
C. Database reset on disconnect.
D. Schema migration via Zod.

**Correct Answer:** B

**Explanation:** This ensures that server resources (transport + MCP server instance) are only created when a valid initialization request is received, enforcing correct session lifecycle boundaries.

---

### Q8. Session Caching Hooks

Which property enables storage of initialized transports in the server registry?

A. `sessionIdGenerator`
B. `handleRequest`
C. `onsessioninitialized`
D. `isInitializeRequest`

**Correct Answer:** C

**Explanation:** The `onsessioninitialized` callback is triggered when a session is created. It allows the server to cache the transport instance in a global registry keyed by session ID for later request routing.

---

## Section 4: MCP Core Primitives (Tools, Resources, Prompts)

### Q9. Primitive Matching

Correct mapping:

1. Tool (`add`)
2. Resource (`greeting`)
3. Prompt (`ask_about_topic`)

Definitions:

* X: Prompt template
* Y: Executable function
* Z: Read-only URI resource

**Correct Answer:** B (1-Y, 2-Z, 3-X)

**Explanation:** Tools execute logic, resources provide read-only data via URI access, and prompts define reusable instruction templates for LLMs.

---

### Q10. Schema Validation

Which library enforces runtime validation in MCP tools?

A. Express Validation Engine
B. TypeScript Type Guards
C. Zod
D. JSON-RPC Spec

**Correct Answer:** C

**Explanation:** Zod performs runtime schema validation, ensuring input correctness beyond TypeScript’s compile-time guarantees.

---

## Section 5: Practical Implementation & Business Logic

### Q11. Tool Return Format

What format must MCP tool outputs follow?

A. Raw arrays
B. `{ content: [{ type: "text", text: string }] }`
C. HTTP Response objects
D. CSV strings

**Correct Answer:** B

**Explanation:** MCP enforces a structured response format using a `content` array, ensuring consistent rendering of tool outputs across clients.

---

### Q12. State Mutation Flow

What does the Shopping List client do after adding an item?

A. Drops database tables
B. Updates purchase status, verifies filtering, then cleans up
C. Repeatedly pings server
D. Opens a second stdio pipe

**Correct Answer:** B

**Explanation:** The client validates end-to-end behavior by updating item state, verifying query filtering, and cleaning up test data to maintain deterministic test conditions.

---

## Section 6: Advanced Transport & Protocol Behavior

### Q13. Initialization Handshake

Why is `initialize` treated specially?

A. Database migrations
B. Capability negotiation before session creation
C. Authentication bypass
D. WebSocket upgrade

**Correct Answer:** B

**Explanation:** Initialization establishes protocol compatibility and capability negotiation before any session or tool execution begins.

---

### Q14. Stdio Constraints

Why can Stdio not support multiple clients?

A. Single stdin/stdout stream per process
B. TypeScript limitation
C. JSON-RPC restriction
D. HTTP header dependency

**Correct Answer:** A

**Explanation:** Stdio is bound to a single process stream, preventing multiplexing across multiple independent clients.

---

### Q15. Stateless Execution

What defines stateless MCP HTTP execution?

A. WebSocket persistence
B. Node event loop lifetime
C. Single request-response cycle with no retained state
D. Express lifecycle

**Correct Answer:** C

**Explanation:** Each HTTP request is independent, with no shared memory between executions unless external state management is added.

---

### Q16. Transport Role

Purpose of `StreamableHTTPServerTransport`?

A. SQL conversion
B. JSON-RPC streaming over HTTP
C. Express replacement
D. AST serialization

**Correct Answer:** B

**Explanation:** It enables streaming JSON-RPC communication over HTTP while preserving MCP protocol semantics.

---

## Section 7: Error Handling & Reliability

### Q17. Error Code -32603

Represents:

A. Auth error
B. Missing method
C. Internal server error
D. Timeout

**Correct Answer:** C

**Explanation:** This is the standard JSON-RPC error code for unexpected server-side failures.

---

### Q18. Structured Errors

Why structured JSON errors?

A. HTML formatting
B. Protocol consistency
C. Performance optimization
D. TypeScript bypass

**Correct Answer:** B

**Explanation:** Structured errors ensure predictable client-side parsing and consistent protocol behavior.

---

### Q19. Transport Cleanup Risk

What happens if transport is not closed?

A. Schema corruption
B. Memory leaks and orphaned handlers
C. Route failure
D. Async validation

**Correct Answer:** B

**Explanation:** Unclosed transports remain in memory, leading to leaks and event loop congestion.

---

### Q20. Serialization Failure

If serialization fails after tool execution:

A. Cached replay
B. JSON-RPC error returned
C. Client retry
D. HTTP 200 fallback

**Correct Answer:** B

**Explanation:** MCP treats serialization failure as a full request failure and returns a structured error response.

---

## Section 8: Security & Scaling

### Q21. Session Isolation

Why is session isolation important?

A. Faster compilation
B. Prevent cross-client data leakage
C. CPU scaling
D. Compression

**Correct Answer:** B

**Explanation:** Isolation ensures each client operates within its own execution context without shared state interference.

---

### Q22. Session ID Header

Purpose of `mcp-session-id`?

A. Encryption
B. Session routing key
C. Authentication replacement
D. Validation bypass

**Correct Answer:** B

**Explanation:** It allows the server to route requests to the correct session-specific transport instance.

---

### Q23. DoS Mitigation

Key design advantage?

A. Persistent servers
B. Stateless teardown per request
C. No validation
D. Blocking I/O

**Correct Answer:** B

**Explanation:** Stateless teardown ensures resources are released immediately after request completion, reducing resource exhaustion risk.

---

### Q24. Registry Risk

Risk of global transport registry?

A. Type safety loss
B. Cross-session leakage
C. JSON slowdown
D. Routing failure

**Correct Answer:** B

**Explanation:** Improper registry management can allow one session to access another session’s transport context.

---

## Section 9: Tooling Internals

### Q25. Tool Contract

Required return type:

A. Any JSON
B. `{ result }`
C. `{ content: [...] }`
D. String

**Correct Answer:** C

**Explanation:** MCP requires structured content arrays to ensure consistent tool output formatting across clients.

---

### Q26. Zod Usage

Why Zod?

A. WASM compilation
B. Runtime validation
C. JSON replacement
D. Middleware removal

**Correct Answer:** B

**Explanation:** Zod provides runtime schema validation, complementing TypeScript’s compile-time checks.

---

### Q27. Resource URIs

Purpose:

A. Execution
B. Read-only data retrieval
C. Tool triggering
D. Session init

**Correct Answer:** B

**Explanation:** Resources expose safe, read-only data via URI-based addressing.

---

### Q28. Prompts

Prompts are:

A. State-mutating
B. Instruction templates
C. Compiled TS
D. Resource replacements

**Correct Answer:** B

**Explanation:** Prompts define reusable instruction structures for guiding LLM behavior.

---

## Section 10: Capstone Understanding

### Q29. MCP Lifecycle

Correct order:

A. Execution → init → transport → parse
B. Init → session → execution → response
C. Teardown → execution → init → response
D. Routing → deletion → init → cache

**Correct Answer:** B

**Explanation:** MCP follows a strict lifecycle: initialization → session creation → tool execution → response serialization.

---

### Q30. Architecture Unification

Why unify stdio and HTTP?

A. Express simplification
B. Consistent JSON-RPC semantics across transports
C. Remove transports
D. Browser-only execution

**Correct Answer:** B

**Explanation:** MCP abstracts transport differences so that tool execution behaves identically across local (stdio) and network (HTTP) environments.

