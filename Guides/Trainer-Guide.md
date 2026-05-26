# 🧭 Instructor & Trainer Guide: Mastering MCP Delivery

This operational guide provides technical trainers, boot-camp instructors, and staff engineers with the tactical context, troubleshooting runbooks, and grading rubrics required to deliver this course effectively.

---

## 🏛️ Module-by-Module Technical Briefings & Edge Cases

### Module 1: Local Foundations (`stdio`)

* **What Students Trip Over:** Students often use `console.log()` to debug their tools. This injects raw strings into the communications pipeline, immediately corrupting the JSON-RPC stream and crashing the client parser.
* **Instructor Blueprint:** Explicitly demonstrate the separation of output channels. Show how the underlying operating system manages streams by routing structural packets over file descriptor 1 (`stdout`) and diagnostic logs over file descriptor 2 (`stderr`).

### Module 2 & 3: HTTP Transports (Stateless vs. Stateful)

* **What Students Trip Over:** In Module 3, students frequently write session-matching middleware that allocates a new `McpServer` instance on *every single request*, completely breaking stateful context tracking.
* **Instructor Blueprint:** Emphasize that the server instance should only be created when an incoming payload satisfies the criteria of an `initialize` request. For all subsequent operations, the route must bypass initialization and delegate the payload directly to the transport instance cached within the global lookup registry.

### Module 4 & 5: Primitives & Service Architecture

* **What Students Trip Over:** Students often leak protocol types by importing Zod schemas or MCP context interfaces directly into their core business logic classes.
* **Instructor Blueprint:** Reinforce the **Adapter Pattern**. Teach students that the `ShoppingListService` should remain a pure, isolated TypeScript module that is completely unaware it is serving an LLM agent over MCP.

---

## 🛠️ Infrastructure Setup & System Check-Runbook

Before students arrive for the first session, run these validation commands inside your delivery environment to ensure the local runtime and dependencies are properly configured.

```bash
# 1. Verify Node.js version alignment (LTS 20.x or greater required)
node --version

# 2. Scaffold a clean test workspace
mkdir mcp-smoke-test && cd mcp-smoke-test
npm init -y

# 3. Perform a locked installation of core dependency frameworks
npm install @modelcontextprotocol/sdk express
npm install --save-dev @types/express @types/node tsx

# 4. Run a quick check to verify the TSX instant compilation engine works globally
npx tsx -e "console.log('Runtime verification successful');"

```

---

## 🚨 Live Troubleshooting Runbook: Common Student Pitfalls

When a student runs into a runtime error during hands-on labs, use this diagnostic key to quickly pinpoint and fix the root cause.

| Visible Error / Symptom | Likely Root Cause | Tactical Resolution Code / Fix |
| --- | --- | --- |
| `SyntaxError: Unexpected token [...] in JSON-RPC parse` | The student used a standard `console.log()` statement somewhere inside the server logic. | Replace the statement with `console.error()`. |
| `TypeError: Cannot read properties of undefined (reading 'handleRequest')` | The client omitted the `mcp-session-id` header on a follow-up call, or the session expired and was pruned from the registry. | Update the client's header interceptor configuration, or implement a fallback block to handle missing tokens with an HTTP 400 response. |
| `Error: Address already in use :::3000` | A previous Express server instance didn't shut down correctly and is still holding the network port open. | Kill the rogue node process using `killall node` or `kill -9 $(lsof -t -i:3000)`. |
| `ZodError: [Invalid input schema]` | The AI Client passed arguments that did not match the types or constraints defined in the tool's input schema. | Open the server code and broaden the inputs using laxer schemas like `z.coerce.number()` or `.optional()`. |

---

## 🎯 Grading Rubrics & Evaluation Playbooks

Use these grading criteria to evaluate student submissions for the Lab Assignments.

### Lab 1.1: Secure Filesystem Explorer Rubric

```
[ ] PASS (Exceeds Expectations)
    - Path resolution utilizes path.resolve() to absolute-form strings.
    - Path traversal attempts (e.g., matching '..') are explicitly blocked before executing any filesystem read operations.
    - File errors (like ENOENT) are caught and returned as clean text messages instead of crashing the process.

[ ] AMEND (Requires Revision)
    - The file reading logic works under ideal conditions, but the code lacks traversal checks, allowing unauthorized reads outside the workspace directory.
    - Unhandled runtime rejections crash the entire process.

```

### Lab 1.2: Stateful Metrics Dashboard Rubric

```
[ ] PASS (Exceeds Expectations)
    - Successfully checks for the presence of the tracking header.
    - Correctly generates unique session tokens using a crypto UUID generator.
    - Caches active transport entities in an in-memory registry map.
    - Implements cleanup handling using the res.on("close") event listener to prevent memory leaks.

[ ] AMEND (Requires Revision)
    - The application re-initializes servers on every request, creating duplicate server instances.
    - Missing close hooks cause dead connections to leak and accumulate in memory.

```

---

## 💬 Classroom Delivery Prompts & Discussion Starters

Use these interactive questions during lectures to gauge understanding and spark architectural discussions.

* **Discussion Starter 1:** *"Imagine you are building a tool for a large language model to delete database rows. Should you expose this capability through an MCP Tool or an MCP Resource? Why?"*
* **Expected Answer:** It must be an MCP Tool. Tools are designed for mutable, side-effect-heavy operations (`Read/Write`), whereas Resources are strictly read-only primitives.


* **Discussion Starter 2:** *"If your stateful HTTP server scales horizontally behind a round-robin load balancer, what happens to our in-memory session registry map when a client makes consecutive calls?"*
* **Expected Answer:** Subsequent requests will route to different servers that don't have that session in memory, causing connection failures. To fix this, you would need sticky sessions or a shared data store like Redis.