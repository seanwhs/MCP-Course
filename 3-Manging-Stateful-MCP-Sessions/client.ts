//client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/http.js";

async function runClient(){
  const serverUrl = "http://localhost:3000/mcp";
  let activeSessionId: string | null = null;

  // Custom transport wrapper to extract and forward the session token via HTTP Headers
  const transport = new StreamableHTTPClientTransport({
    url: serverUrl,
    // Intercept outbound HTTP requests to append the stateful session tracking header
    headers: () => {
      return activeSessionId ? { "mcp-session-id": activeSessionId } : {};
    },
    // Hook into response events to capture the initial session metadata sent by the server
    onSessionInitialized: (sessionId) => {
      activeSessionId = sessionId;
    }
  });

  const client = new Client({
    name: "example-stateful-client",
    version: "1.0.0",
  });

  try {
    // Connect initiates the JSON-RPC 'initialize' + 'notifications/initialized' sequence
    await client.connect(transport);
    console.log("Connected to MCP server using Streamable HTTP transport");

    // Perform a standard JSON-RPC ping to verify the session remains active
    const pingResult = await client.ping();
    console.log("Server ping result:", JSON.stringify(pingResult));

    // Cleanup resources and sever connections
    await client.close();
    console.log("Disconnected from the MCP server");

  } catch (error) {
    console.error("Client encountered execution error:", error);
  }
}

runClient();