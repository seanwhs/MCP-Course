# 📋 Multi-Day Lesson Plan: Architecting with the Model Context Protocol (MCP)

**Course Title:** Advanced AI Systems Engineering: Building with MCP

**Target Audience:** Software Engineers, AI Orchestration Developers, and Systems Architects

**Duration:** 3 Days (2 Hours per Day)

**Prerequisites:** Proficiency in TypeScript/Node.js, familiarity with asynchronous programming, and basic knowledge of LLM application patterns.

---

## 📅 Day 1: Local Foundations & Core Primitives

### 🎯 Objective

Master the local process-based communication model and understand how to construct the three core architectural primitives (Tools, Resources, and Prompts) using standard I/O pipelines.

### ⏱️ Timeline & Breakdown

#### 1. Technical Lecture: The Stdio Transport Pipe (30 Mins)

* **The IPC Paradigm:** Deconstructing Inter-Process Communication (IPC). Why bypassing the network stack minimizes latency and enhances edge security for desktop AI environments (e.g., Claude Desktop).
* **Stream Allocation:** Mapping how `stdin` functions as the ingress queue for incoming JSON-RPC 2.0 frames, while `stdout` acts as the egress channel.
* **The Stream Pollution Hazard:** Deep dive into why raw `console.log()` usage triggers fatal parsing exceptions in the client, and why `console.error()` is required to safely route telemetry to `stderr`.

#### 2. Live Coding Demonstration: Building the Primitive Baseline (40 Mins)

* Initializing `McpServer` and binding it to `StdioServerTransport`.
* Implementing **Tools**: Writing stateless operations (e.g., dynamic calculators) with structural parameter enforcement using **Zod**.
* Implementing **Resources**: Creating dynamic, read-only data layers exposed via URI endpoints (`resource://...`).
* Implementing **Prompts**: Crafting reusable instruction templates that inject dynamic user variables into structured context blocks.

#### 3. Hands-On Lab: Lab 1.1 — Secure Filesystem Explorer (40 Mins)

* Students implement a local file-reading tool.
* **Core Challenge:** Incorporate defensive security validation to detect and block path traversal attacks (`..`) targeting directories outside of a designated workspace path.

#### 4. Interactive Review & Quiz (10 Mins)

* De-briefing common implementation hurdles.
* Administering Day 1 Multiple-Choice Knowledge Check (Focus: Stdio constraints, primitive selection).

---

## 📅 Day 2: Moving to the Network: Stateless vs. Stateful HTTP

### 🎯 Objective

Transition MCP implementations across network boundaries safely, understanding the trade-offs between horizontal scalability (stateless) and conversational continuity (stateful).

### ⏱️ Timeline & Breakdown

#### 1. Technical Lecture: Network-Bound Protocols & Express Shells (30 Mins)

* **The Stateless Cost:** Analyzing why spinning up a fresh server and transport instance *per incoming HTTP POST request* simplifies cloud deployment but breaks multi-step context tracks.
* **The Lifecycle Handshake:** Mapping the multi-step handshake sequence required for stateful connectivity over HTTP using an in-memory session registry.
* **Session Multiplexing:** How the client utilizes interceptors to inject an `mcp-session-id` tracking token into outbound HTTP headers.

#### 2. Live Coding Demonstration: The Stateful Registry Engine (40 Mins)

* Setting up an Express application configured with standard JSON parsing middleware.
* Writing the **Session Registry**: Implementing an in-memory lookup table (`Record<string, StreamableHTTPServerTransport>`) to store active session references.
* **Conditional Initialization:** Implementing code to intercept raw payloads, check for valid `initialize` schemas, generate UUID tokens using `crypto.randomUUID()`, and cache them dynamically.

#### 3. Hands-On Lab: Lab 1.2 — Distributed Metrics Dashboard (40 Mins)

* Students construct an Express-backed stateful server that tracks distinct sessions via custom headers.
* **Core Challenge:** Expose system hardware performance telemetry securely through a live resource endpoint (`metrics://live`), ensuring the connection state persists across consecutive client calls.

#### 4. Interactive Review & Quiz (10 Mins)

* Reviewing code blocks for common memory leaks.
* Administering Day 2 Multiple-Choice Knowledge Check (Focus: Session routing, transport configuration).

---

## 📅 Day 3: Enterprise Architecture & Production Guardrails

### 🎯 Objective

Structure MCP applications using enterprise-grade software patterns, implement resource cleanup safeguards, and manage error conditions in staging environments.

### ⏱️ Timeline & Breakdown

#### 1. Technical Lecture: Decoupling and the Service-Engine Pattern (30 Mins)

* **Separation of Concerns:** Why your operational domain logic must remain completely decoupled from protocol schemas. The dangers of leaking MCP SDK types directly into core application business layers.
* **Layered Design Breakdown:** 1.  *Transport Layer:* Express/Stdio infrastructure shell.
2.  *Protocol Adaptation Layer:* Translating incoming payloads and executing schema-level data validation.
3.  *Application Service Layer:* Pure domain rules, entity states, and system memory.

#### 2. Code Review & Debugging Workshop: Anatomy of a Crash (30 Mins)

* **The HTTP Memory Bleed:** Diagnosing why missing response close monitors (`res.on("close")`) cause unreferenced server frames to stick around in the V8 engine heap, leading to Out-Of-Memory (OOM) failures under heavy load.
* **Spec-Compliant Failures:** Structuring runtime fallback error payloads that strictly comply with JSON-RPC 2.0 specs (using error code `-32603`).

#### 3. Hands-On Lab: Module 5 — Architecture Lab Deployment (50 Mins)

* Students refactor an application into a multi-file architecture pattern containing a pure logic service module (`ShoppingListService`), a protocol adapter configuration (`McpServer`), and a transport routing wrapper.
* **Core Challenge:** Connect the fully decoupled server to a live test harness client, verify accurate state transitions over network calls, and ensure comprehensive resource cleanup upon unexpected client disconnects.

#### 4. Course Retrospective & Next Steps (10 Mins)

* Distributing the complete architectural interview preparation guide.
* Open Q&A on building production-grade agentic tooling frameworks.

---

## 🛠️ Pedagogical Approach & Instructor Guidelines

### 💡 Core Delivery Strategies

* **Code-First Explanations:** Introduce theoretical systems concepts (like memory management, streams, and sessions) using concrete, working TypeScript blocks. Avoid abstract over-generalizations.
* **Test-Driven Validation:** Encourage students to verify their server modifications immediately using dedicated test scripts or terminal commands rather than manual testing loops.
* **Emphasis on Edge Conditions:** Continually push students to design around failures—such as malformed parameter inputs, unhandled exceptions, and sudden client disconnections.

---

## 📋 Recommended Course Materials & Handouts

* **The MCP Student Handbook:** The primary reference manual containing full implementations for all modules.
* **The Code Lab Workbook:** Detailed specs, boilerplate files, security requirements, and solution code blocks for all lab assignments.
* **The Architecture Interview Prep Bank:** An advanced compilation of system design scenarios focused on testing edge-case protocol knowledge and performance scaling rules.