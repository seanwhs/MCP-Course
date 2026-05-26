// client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Get the base URL of the MCP server
const baseUrl = new URL("http://localhost:3000/mcp");

// Create an MCP client
const client = new Client({
  name: "example-client",
  version: "1.0.0"
});

// Create a transport for the MCP server
const transport = new StreamableHTTPClientTransport(baseUrl);

try {
  // Connect to the MCP server
  await client.connect(transport);
  // Log confirmation message
  console.log("Connected to MCP server using Streamable HTTP transport");

  // Ping the server
  const pingResult = await client.ping();
  // Log the ping result
  console.log("Server ping result:", pingResult);
} catch (error) {
  // Handle any errors that occur during connection or communication
  console.error("Error occurred:", error);
} finally {
  // Always close the connection to allow the process to exit
  await client.close();
  // Log the disconnection
  console.log("Disconnected from the MCP server");
}