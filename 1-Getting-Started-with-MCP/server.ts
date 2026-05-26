//server.ts
// run with 'npx tsx server.ts'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Initialize the MCP server with basic metadata
const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
  description: "Example description",
});

// Create a stdio transport instance
const transport = new StdioServerTransport();

// Connect the server to the transport
await server.connect(transport);
console.log('MCP Server Connected Successfully');
