// server.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Initialize MCP server instance
 * - Defines server identity and metadata
 * - Registers tools, resources, and prompts
 */
const server = new McpServer({
  name: "My Server",
  version: "1.0.0",
  description: "Demo MCP server with tools, resources, and prompts",
});

/* =========================================================
   TOOL: add
   - Stateless computation function exposed to MCP clients
========================================================= */
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Returns the sum of two integers.",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: "text",
          text: String(a + b),
        },
      ],
    };
  }
);

/* =========================================================
   RESOURCE: greeting
   - Read-only data exposed via URI
   - Useful for configuration, static or dynamic context
========================================================= */
server.registerResource(
  "greeting",
  "resource://greeting",
  {
    title: "Greeting Resource",
    description: "A simple static greeting message.",
    mimeType: "text/plain",
  },
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          text: "Hello from My Server!",
          mimeType: "text/plain",
        },
      ],
    };
  }
);

/* =========================================================
   PROMPT: ask_about_topic
   - Reusable template for LLM interaction
   - Generates structured user-facing instruction
========================================================= */
server.registerPrompt(
  "ask_about_topic",
  {
    title: "Ask About Topic",
    description: "Generates a user message requesting explanation of a topic.",
    argsSchema: {
      topic: z.string(),
    },
  },
  ({ topic }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Can you explain the concept of '${topic}' in simple terms?`,
          },
        },
      ],
    };
  }
);

/* =========================================================
   BOOTSTRAP SERVER (stdio transport)
   - Connects MCP server to stdio stream
   - Enables CLI-based client communication
========================================================= */
async function main() {
  const transport = new StdioServerTransport();

  // Attach transport layer (actual server runtime starts here)
  await server.connect(transport);
}

main().catch(console.error);