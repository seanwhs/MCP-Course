# **Slide 1 — Title**

## Building a Stateful MCP Server (HTTP)

### From Stateless Requests → Session-Aware Systems

We are upgrading an MCP server from a simple request handler into a system that can **remember clients across multiple interactions**.

---

# **Slide 2 — Where You Are Now**

You already built:

* MCP server using Express.js
* Streamable HTTP transport
* MCP client
* Working request/response flow

### But currently:

> Every request is treated as completely new

---

### Sequence Diagram (Stateless Requests)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Request
    S-->>C: Response (fresh execution)

    C->>S: Request
    S-->>C: Response (recreated context)
```

---

# **Slide 3 — Stateless System (Concept)**

A stateless server means:

* No memory between requests
* No user identity
* No session tracking

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Request A
    S-->>C: Response A

    C->>S: Request B (no memory of A)
    S-->>C: Response B
```

---

# **Slide 4 — Why Stateless is Limited**

Stateless systems cannot:

* Track users
* Resume workflows
* Maintain context
* Support multi-step interactions

---

# **Slide 5 — What We Want: Stateful MCP Server**

We introduce **state (memory)**.

We want the server to:

* Recognize returning clients
* Continue sessions
* Store session context
* Support multi-step workflows

---

### Sequence Diagram (Stateful Flow)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Initialize request
    S-->>C: Session ID

    C->>S: Request (with session ID)
    S-->>C: Response (session resumed)
```

---

# **Slide 6 — What is a Session?**

A **session** is:

> A memory container for one client lifecycle

It stores:

* Session ID
* Transport connection
* MCP context

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant T as Transport

    C->>S: Start session
    S->>T: Create transport
    T-->>S: Session ready
    S-->>C: Session ID
```

---

# **Slide 7 — Core Idea**

We store sessions like this:

```ts
sessionId → transport
```

---

### Diagram (Session Store)

```mermaid
classDiagram
    class SessionStore {
        string sessionId
        Transport transport
    }
```

---

# **Slide 8 — Step 1: Create Session Store**

```ts
const transports: Record<string, StreamableHTTPServerTransport> = {};
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant M as Memory Store

    C->>S: Request
    S->>M: Store session map
    M-->>S: Stored
```

---

# **Slide 9 — Step 2: Extract Session ID**

```ts
const sid = req.headers["mcp-session-id"];
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Request + session header
    S->>S: Extract mcp-session-id
```

---

# **Slide 10 — Step 3: Lookup Session**

```ts
let transport = sid ? transports[sid] : undefined;
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant S as Server
    participant M as Memory Store

    S->>M: lookup(sessionId)
    alt found
        M-->>S: transport
    else not found
        M-->>S: undefined
    end
```

---

# **Slide 11 — Decision Point**

We decide:

* Reuse session
* OR create new session

---

### Flow Diagram

```mermaid
flowchart TD
    A[Request] --> B{Transport exists?}
    B -->|Yes| C[Reuse session]
    B -->|No| D[Check initialize request]
```

---

# **Slide 12 — Initialize Request**

Initialize means:

> Start a new MCP session

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: initialize request
    S->>S: detect initialize
    S-->>C: session ID
```

---

# **Slide 13 — Step 4: Create MCP Server**

```ts
const server = new McpServer({
  name: "example-stateful-server",
  version: "1.0.0",
});
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant S as Server

    S->>S: Instantiate McpServer
```

---

# **Slide 14 — Step 5: Create Transport**

```ts
transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant S as Server

    S->>S: Create transport
    S->>S: Generate UUID session ID
```

---

# **Slide 15 — Step 6: Store Session**

```ts
onsessioninitialized: (id) => {
  transports[id] = transport;
}
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant T as Transport
    participant S as Server Memory

    T->>S: session initialized (id)
    S->>S: store id → transport
```

---

# **Slide 16 — Step 7: Connect Server**

```ts
await server.connect(transport);
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant S as MCP Server
    participant T as Transport

    S->>T: connect()
    T-->>S: session active
```

---

# **Slide 17 — Step 8: Handle Invalid Session**

```ts
if (!transport) {
  return res.status(400).json({ error: "invalid session" });
}
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: request (invalid session)
    S-->>C: 400 error
```

---

# **Slide 18 — Step 9: Process Request**

```ts
await transport.handleRequest(req, res, req.body);
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant T as Transport
    participant M as MCP Server

    C->>T: request
    T->>M: handleRequest()
    M-->>T: response
    T-->>C: response
```

---

# **Slide 19 — Full Server Flow**

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant M as Memory Store
    participant T as Transport

    C->>S: Request
    S->>M: lookup session
    alt new session
        S->>S: create MCP server
        S->>T: create transport
        S->>M: store session
    end
    S->>T: handleRequest
    T-->>C: response
```

---

# **Slide 20 — Client: Session State**

```ts
let activeSessionId: string | null = null;
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client

    C->>C: store sessionId
    C->>C: reuse later
```

---

# **Slide 21 — Client Sends Session ID**

```ts
headers: () => ({
  "mcp-session-id": activeSessionId
})
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: request + session ID
    S-->>C: use same session
```

---

# **Slide 22 — Client Receives Session ID**

```ts
onSessionInitialized: (id) => {
  activeSessionId = id;
}
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant S as Server
    participant C as Client

    S-->>C: session ID
    C->>C: store session ID
```

---

# **Slide 23 — Full Client Flow**

```ts
await client.connect(transport);
await client.ping();
await client.close();
```

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: connect
    S-->>C: session ID

    C->>S: ping (session)
    S-->>C: response

    C->>S: close
```

---

# **Slide 24 — Stateless vs Stateful**

### Stateless

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Request A
    S-->>C: Response A

    C->>S: Request B (reset)
    S-->>C: Response B
```

### Stateful

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Request A (session)
    S-->>C: Response A

    C->>S: Request B (same session)
    S-->>C: Response B (context preserved)
```

---

# **Slide 25 — Why Stateful MCP Matters**

Your system now supports:

* Context retention
* Multi-step workflows
* Session tracking
* Production-grade AI tool execution

---

# **Slide 26 — Mental Model**

```mermaid
flowchart LR
    A[Client] --> B[Session ID]
    B --> C[Transport]
    C --> D[MCP Server]
    D --> C
```

---

# **Slide 27 — Final Takeaway**

You now built:

* Session-aware MCP architecture
* Persistent transport mapping
* Stateful request handling
* Full client-server session lifecycle

