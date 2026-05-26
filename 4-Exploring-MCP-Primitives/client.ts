// client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runClient() {
  // Create stdio transport to launch and communicate with MCP server process
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "server.ts"],
  });

  // Initialize MCP client with identity metadata
  const client = new Client({
    name: "example-client",
    version: "1.0.0",
  });

  try {
    // Establish connection to MCP server
    await client.connect(transport);

    /* =========================================================
       DISCOVERY PHASE: introspect server capabilities
    ========================================================= */

    // List available tools (executable functions)
    const tools = await client.listTools();
    console.log("\n=== Tools ===");
    for (const t of tools.tools) {
      console.log(`${t.name}: ${t.description}`);
    }

    // List available resources (read-only data endpoints)
    const resources = await client.listResources();
    console.log("\n=== Resources ===");
    for (const r of resources.resources) {
      console.log(`${r.uri}: ${r.name || r.description}`);
    }

    // List available prompts (reusable LLM templates)
    const prompts = await client.listPrompts();
    console.log("\n=== Prompts ===");
    for (const p of prompts.prompts) {
      console.log(`${p.name}: ${p.description}`);
    }

    /* =========================================================
       EXECUTION PHASE: interact with server primitives
    ========================================================= */

    // Execute tool: add(a, b)
    const toolResult = await client.callTool({
      name: "add",
      arguments: { a: 5, b: 3 },
    });

    const toolContent =
      toolResult.content as Array<{ type: string; text?: string }>;

    console.log(`\nadd(5,3) = ${toolContent[0].text}`);

    // Read resource via URI lookup
    const resourceResult = await client.readResource({
      uri: "resource://greeting",
    });

    const resourceContent = resourceResult.contents[0] as {
      uri: string;
      text: string;
      mimeType: string;
    };

    console.log(`\nResource: ${resourceContent.text}`);

    // Generate prompt template with arguments
    const promptResult = await client.getPrompt({
      name: "ask_about_topic",
      arguments: { topic: "machine learning" },
    });

    const promptContent = promptResult.messages[0].content as {
      type: "text";
      text: string;
    };

    console.log(`\nPrompt:\n${promptContent.text}`);
  } catch (err) {
    // Centralized error handling for transport + protocol failures
    console.error("Client error:", err);
  } finally {
    // Ensure clean shutdown of MCP session and transport
    await client.close();
  }
}

runClient();