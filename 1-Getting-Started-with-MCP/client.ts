// client.ts 
// run wih 'npx tsx client.ts'
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

try {
  // Establish connection with the MCP server
  await client.connect(transport);
  console.log("Connected to the MCP server");

  const pingResult = await client.ping();
  console.log("Server ping result:", pingResult);
} catch (error) {
  console.error("Error occurred:", error);
} finally {
  // Ensure connection closes so the process can exit cleanly
  await client.close();
  console.log("Disconnected from the MCP server");
}