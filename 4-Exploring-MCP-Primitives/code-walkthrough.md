# MCP Protocol: End-to-End Code Walkthrough

This walkthrough explains how the **MCP client (`client.ts`) and server (`server.ts`) work together**.

At a high level, MCP follows a simple lifecycle:

> **Connect → Discover → Execute → Close**

---

# 1. System Overview

You have two processes:

* **client.ts** → starts and controls the MCP session
* **server.ts** → exposes capabilities (tools, resources, prompts)

They communicate over:

> **stdio (standard input/output pipes)**

---

# 2. High-Level Protocol Flow

This diagram shows the full interaction lifecycle between client and server.

```mermaid
sequenceDiagram
    participant C as client.ts
    participant S as server.ts

    C->>S: Spawns process (npx tsx server.ts)

    Note over C,S: Server runs as child process via stdio pipes

    S-->>C: MCP handshake (capability negotiation)

    Note over C,S: DISCOVERY PHASE

    C->>S: listTools() / listResources() / listPrompts()
    S-->>C: Capability registry + schemas

    Note over C,S: EXECUTION PHASE

    C->>S: callTool("add", {a: 5, b: 3})
    S-->>C: { content: [{ text: "8" }] }

    C->>S: readResource("resource://greeting")
    S-->>C: { contents: [{ text: "Hello..." }] }

    C->>S: getPrompt("ask_about_topic")
    S-->>C: formatted prompt message

    Note over C,S: CLEANUP

    C->>S: close()
    S-->>C: terminate process
```

---

# 3. Startup Phase (Process Boot)

This is where everything begins.

```mermaid
flowchart TD
    A[Client starts] --> B[Spawns server process using npx tsx server.ts]
    B --> C[stdio pipe is created between client and server]
    C --> D[MCP handshake begins automatically]
```

##What’s happening:

* Client launches the server as a subprocess
* stdio pipes connect both processes
* MCP handshake initializes communication

---

# 4. Discovery Phase (Capability Introspection)

This is where the client asks:

> “What can this server actually do?”

```mermaid
flowchart TD
    A["listTools()"] --> D["Server capability registry"]
    B["listResources()"] --> D
    C["listPrompts()"] --> D
```

## Explanation:

* Server registers tools, resources, prompts
* Client queries available capabilities
* Nothing is executed yet — only inspection

---

# 5. Execution Phase (Runtime Interaction)

This is where real work happens.

```mermaid
flowchart TD
    A[callTool add] --> B[Server executes logic: a + b]
    B --> C[Client receives result]

    D[readResource greeting] --> E[Server returns stored data]
    E --> F[Client consumes resource]

    G[getPrompt ask_about_topic] --> H[Server builds prompt template]
    H --> I[Client receives formatted message]
```

## Meaning:

* **Tools** → execute logic
* **Resources** → fetch data
* **Prompts** → generate structured LLM input

---

# 6. Simplified End-to-End Flow

A beginner-friendly version of the same lifecycle:

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: Start server process (stdio transport)

    S-->>C: MCP handshake

    Note over C,S: DISCOVERY PHASE

    C->>S: Request tools/resources/prompts list
    S-->>C: Capability registry

    Note over C,S: EXECUTION PHASE

    C->>S: callTool(add)
    S-->>C: return "8"

    C->>S: readResource(greeting)
    S-->>C: return "Hello from My Server"

    C->>S: getPrompt(ask_about_topic)
    S-->>C: return formatted prompt

    Note over C,S: CLEANUP

    C->>S: close connection
    S-->>C: terminate process
```

---

# 7. Production Architecture (HTTP + SSE)

In production, MCP becomes network-based instead of process-based.

```mermaid
flowchart LR
    C[Client] <-- Persistent SSE Stream --> S[SSE Endpoint /sse]

    C -- HTTP POST requests --> M[/messages endpoint/]

    M --> S
    S --> C
```

## Explanation:

* **SSE** → server pushes updates continuously
* **HTTP POST** → client sends requests
* Together they simulate full duplex communication

---

# 8. Production System Internals

How the server is structured internally:

```mermaid
flowchart TD
    A[Client Application] --> B[SSE Connection Channel]
    A --> C[HTTP Request Channel]

    B --> D[Server Event Stream]
    C --> E[Message Handler]

    D --> F[MCP Core Server Engine]
    E --> F

    F --> G[Tools]
    F --> H[Resources]
    F --> I[Prompts]
```

## Explanation:

* Everything flows into the MCP core engine
* The engine routes requests to:

  * tools → computation
  * resources → data access
  * prompts → template generation

---

# 9. Core Server Primitives (Recap from Code)

## Tool: `add`

```ts
server.registerTool("add", {...}, async ({ a, b }) => {
  return {
    content: [{ type: "text", text: String(a + b) }],
  };
});
```

---

## Resource: `greeting`

```ts
server.registerResource("greeting", "resource://greeting", {...}, async (uri) => {
  return {
    contents: [{
      uri: uri.href,
      text: "Hello from My Server!",
      mimeType: "text/plain",
    }],
  };
});
```

---

## Prompt: `ask_about_topic`

```ts
server.registerPrompt("ask_about_topic", {...}, ({ topic }) => {
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Can you explain the concept of '${topic}' in simple terms?`,
      },
    }],
  };
});
```

---

# 10. Final Mental Model

MCP is best understood as:

```mermaid
flowchart TD
    A[Client] --> B[Capability Requests]
    B --> C[Server MCP Engine]

    C --> D[Tools]
    C --> E[Resources]
    C --> F[Prompts]

    D --> G[Execution Result]
    E --> G
    F --> G

    G --> A
```

---

# Key Insight

MCP separates two concerns:

* **What the system can do**

  * tools
  * resources
  * prompts

* **How it communicates**

  * stdio (local)
  * HTTP + SSE (production)

---

# Final Takeaway

> MCP is a **transport-agnostic capability runtime** that standardizes how clients interact with server-defined tools, data, and prompt templates.

