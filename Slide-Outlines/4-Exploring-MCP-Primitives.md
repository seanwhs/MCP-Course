# 📘 MCP Lesson: Tools, Resources & Prompts (Slide Outline)

---

## **Slide 1 — Title**

### Building MCP Server Capabilities

**Tools • Resources • Prompts**

* Extending MCP servers beyond “hello world”
* Making servers discoverable and interactive
* Enabling AI agents to use server capabilities dynamically

---

## **Slide 2 — Recap: What We Already Know**

We can now:

* Create an MCP server (TypeScript SDK)
* Run it via:

  * `stdio` (local)
  * HTTP (networked)
* Connect using an MCP client

👉 Next step:
**Expose meaningful capabilities to clients**

---

## **Slide 3 — MCP Server Primitives**

MCP exposes 3 core building blocks:

### 🧰 Tools

Executable functions (actions)

### 📦 Resources

Readable data (state / info)

### 💬 Prompts

Reusable AI interaction templates

---

## **Slide 4 — Mental Model**

| Primitive | Role         | Example            |
| --------- | ------------ | ------------------ |
| Tool      | Do something | add numbers        |
| Resource  | Provide data | greeting text      |
| Prompt    | Guide AI     | “Explain X simply” |

---

## **Slide 5 — Setup MCP Server (Base Code)**

```ts
// server.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "My Server",
  version: "1.0.0",
  description: "Tools, resources, prompts demo",
});
```

---

## **Slide 6 — Defining a Tool (Concept)**

A tool:

* Is a callable function
* Has:

  * name
  * schema (inputs)
  * handler (logic)

👉 Clients can discover and execute it dynamically

---

## **Slide 7 — Tool Example: Add Numbers**

```ts
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Return sum of a and b.",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [{ type: "text", text: String(a + b) }],
    };
  }
);
```

---

## **Slide 8 — Tool Execution Flow**

1. Client discovers tool
2. Client sends arguments
3. Server runs handler
4. Server returns structured result

👉 Tools = “remote functions”

---

## **Slide 9 — Defining a Resource (Concept)**

A resource:

* Is read-only data
* Identified by URI
* Can be static or dynamic

Examples:

* config
* greeting text
* database record

---

## **Slide 10 — Resource Example**

```ts
server.registerResource(
  "greeting",
  "resource://greeting",
  {
    title: "Greeting",
    description: "Simple greeting message",
    mimeType: "text/plain",
  },
  async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        text: "Hello from My Server!",
        mimeType: "text/plain",
      }],
    };
  }
);
```

---

## **Slide 11 — Resource Behavior**

* Accessed via URI
* Always returns `contents[]`
* Can be:

  * static (fixed text)
  * dynamic (DB/API-driven)

👉 Resources = “server-provided context”

---

## **Slide 12 — Defining a Prompt (Concept)**

A prompt:

* Generates structured AI messages
* Accepts arguments
* Returns conversation-ready format

👉 Prompts = “AI instruction templates”

---

## **Slide 13 — Prompt Example**

```ts
server.registerPrompt(
  "ask_about_topic",
  {
    title: "Ask About Topic",
    description: "Generate explanation request",
    argsSchema: {
      topic: z.string(),
    },
  },
  ({ topic }) => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Can you explain '${topic}' simply?`,
        },
      }],
    };
  }
);
```

---

## **Slide 14 — Prompt Output Structure**

Returns:

```ts
{
  messages: [
    {
      role: "user",
      content: { text: "..." }
    }
  ]
}
```

👉 Prompts = “prebuilt AI conversations”

---

## **Slide 15 — MCP Client Setup**

```ts
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

await client.connect(transport);
```

---

## **Slide 16 — Discovering Server Capabilities**

```ts
const tools = await client.listTools();
const resources = await client.listResources();
const prompts = await client.listPrompts();
```

👉 Enables runtime discovery

---

## **Slide 17 — Output Example**

```
Available tools:
- add

Available resources:
- resource://greeting

Available prompts:
- ask_about_topic
```

---

## **Slide 18 — Calling a Tool**

```ts
const result = await client.callTool({
  name: "add",
  arguments: { a: 5, b: 3 },
});

console.log(result.content[0].text);
```

👉 Output:

```
8
```

---

## **Slide 19 — Reading a Resource**

```ts
const res = await client.readResource({
  uri: "resource://greeting",
});

console.log(res.contents[0].text);
```

👉 Output:

```
Hello from My Server!
```

---

## **Slide 20 — Using a Prompt**

```ts
const prompt = await client.getPrompt({
  name: "ask_about_topic",
  arguments: { topic: "machine learning" },
});

console.log(prompt.messages[0].content.text);
```

---

## **Slide 21 — Why This Matters**

MCP enables:

* 🔍 Discovery (list tools/resources/prompts)
* ⚙️ Execution (tools)
* 📦 Context sharing (resources)
* 💬 AI guidance (prompts)

👉 This is how AI agents integrate with systems

---

## **Slide 22 — End-to-End Flow**

```
Client → Discover → Select → Execute → Receive Result
```

Tools → actions
Resources → data
Prompts → instructions

---

## **Slide 23 — Summary**

You learned how to:

* Define MCP tools
* Expose resources
* Create prompts
* Connect MCP client
* Discover and invoke capabilities

---

## **Slide 24 — Next Step**

👉 Build your own MCP system:

* Add multiple tools
* Make dynamic resources (DB/API)
* Create smart prompt templates
* Combine all three in real workflows
