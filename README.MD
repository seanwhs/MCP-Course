# 📘 Model Context Protocol (MCP) TypeScript Developer Course

Welcome to the **Model Context Protocol (MCP)** Developer Course — a progressive, hands-on curriculum for building LLM-integrated systems using the official TypeScript SDK.

This course is designed to take you from **zero MCP experience → production-grade, stateful tool orchestration systems**, covering transports, sessions, primitives, and real-world service architecture.

---

## 🧠 What is MCP?

The Model Context Protocol is a standardized protocol for connecting LLM-driven clients to external capabilities such as:

* 🛠️ Tools (functions / actions)
* 📦 Resources (read-only data)
* 💬 Prompts (structured LLM inputs)

It enables a clean separation between:

* Client orchestration
* Server execution logic
* Transport layers (stdio / HTTP)

This course uses the official @modelcontextprotocol/sdk to build real systems from scratch.

---

## 📚 Course Roadmap

The repository is organized into 5 progressive modules:

```text
├── 1-Getting-Started-with-MCP     # Local STDIO-based MCP communication
├── 2-Remote-MCP-Connectivity      # Stateless HTTP + JSON-RPC transport
├── 3-Managing-Stateful-Sessions    # Session tracking over HTTP headers
├── 4-Exploring-MCP-Primitives      # Tools, Resources, Prompts (core MCP model)
└── 5-Developing-Service-Tools      # Real-world service architecture (CRUD tools)
```

---

## ⚙️ Prerequisites

Ensure you have the following installed:

* Node.js (LTS recommended)
* TypeScript runtime
* Global TS execution tool

### Install dependencies

```bash
# Core MCP SDK
npm install @modelcontextprotocol/sdk

# Web server for HTTP-based MCP transport
npm install express

# Optional: run TS files directly
npm install -g tsx
```

---

## 🚀 How to Run the Course

Each module is self-contained. Navigate into a module folder and run client/server as shown below.

---

# 🧩 Module 1 — Getting Started with MCP

### 🔍 Concept

This module introduces **local MCP execution via STDIO transport**, where:

* Client spawns server as a subprocess
* Communication happens via standard input/output streams
* Perfect for CLI tools and local agent workflows

### 🧪 Run

```bash
cd 1-Getting-Started-with-MCP

# Terminal (or single command execution)
npx tsx client.ts
```

### 🧠 Key Ideas

* StdioClientTransport / StdioServerTransport
* Process-based communication
* MCP handshake + ping lifecycle

---

# 🌐 Module 2 — Remote MCP Connectivity

### 🔍 Concept

Moves MCP to a web-native model using HTTP + JSON-RPC.

Introduces:

* Stateless request handling
* Express routing layer
* Streamable HTTP transport

### 🧪 Run

```bash
# Terminal 1 (server)
npx tsx server.ts

# Terminal 2 (client)
npx tsx client.ts
```

### 🧠 Key Ideas

* StreamableHTTPClientTransport
* StreamableHTTPServerTransport
* Request lifecycle over HTTP POST
* Transport teardown on response close

---

# 🧷 Module 3 — Managing Stateful MCP Sessions

### 🔍 Concept

HTTP is stateless — this module adds **session continuity** using:

* `mcp-session-id` headers
* In-memory transport registry
* UUID-based session tracking

### 🧪 Run

```bash
# Server
npx tsx server.ts

# Client
npx tsx client.ts
```

### 🧠 Key Ideas

* Session initialization handshake
* Transport persistence map
* Multi-tenant session handling
* Initialize request detection

---

# 🧱 Module 4 — Exploring MCP Primitives

### 🔍 Concept

This module explores the **core building blocks of MCP**:

### 🛠️ Tools

Executable server functions (validated via Zod)

### 📦 Resources

Read-only data exposed via URI

### 💬 Prompts

Reusable structured LLM message templates

### 🧪 Run

```bash
npx tsx client.ts
```

(Server is spawned automatically via stdio transport)

### 🧠 Key Ideas

* `registerTool`
* `registerResource`
* `registerPrompt`
* `listTools`, `listResources`, `listPrompts`
* Structured schema validation using Zod

---

# 🏗️ Module 5 — Developing MCP Service Tools

### 🔍 Concept

This module simulates a **real production backend system** using MCP tools.

You build a full CRUD system:

* Add items
* Query items
* Update state
* Remove items

All backed by an internal service layer.

### 🧪 Run

```bash
# Start server
npx tsx server.ts

# Run integration test client
npx tsx client.ts
```

---

## 🧠 Architecture Overview

This module introduces clean separation:

* `server.ts` → HTTP transport layer (Express)
* `mcp-server.ts` → MCP tool registration layer
* `shopping-list-service.ts` → Business logic layer

### Core flow:

```text
Client → HTTP Transport → MCP Server → Service Layer → Response
```

---

## 🧰 Tools Implemented

### 🛒 Shopping List System

| Tool            | Description                          |
| --------------- | ------------------------------------ |
| `get_items`     | Retrieve items (optionally filtered) |
| `add_item`      | Add a new item                       |
| `remove_item`   | Delete item by ID                    |
| `set_purchased` | Toggle purchased status              |

---

## 🧠 Key Learning Outcomes

By completing this course, you will understand:

### Transport Layering

* STDIO vs HTTP MCP communication
* Streamable transport lifecycle

### Session Management

* Stateless vs stateful MCP systems
* Session ID propagation strategies

### MCP Core Primitives

* Tools (execution)
* Resources (data access)
* Prompts (LLM templates)

### Production Architecture

* Service layer separation
* Tool-based API design
* Clean error handling in distributed systems

---

## 🧪 Example Mental Model

Think of MCP as:

```text
LLM Client
   ↓
MCP Protocol (JSON-RPC)
   ↓
Transport (STDIO / HTTP)
   ↓
MCP Server (Tools / Resources / Prompts)
   ↓
Business Logic Layer (your real app)
```

---

## 🚀 Final Takeaway

This course evolves MCP from a simple protocol into a **full application architecture pattern** for building LLM-powered systems.

You are not just learning an SDK — you are learning how to design:

* AI tool APIs
* Stateful LLM services
* Modular agent backends
* Production-ready protocol-driven systems

