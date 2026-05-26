// server.ts

// Import the Express framework and its TypeScript type definitions for handling HTTP requests and responses
import express, { Request, Response } from "express";

// Import the core McpServer class from the Model Context Protocol SDK to build the MCP logic
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import the stateless HTTP transport layer designed to handle MCP JSON-RPC messages over standard HTTP requests
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// Initialize the Express application instance to act as our underlying web server
const app = express();

// Apply middleware so Express automatically parses incoming JSON request bodies and makes them available on `req.body`
app.use(express.json());

// Define a POST endpoint at `/mcp` which serves as the central entry point for all incoming MCP communication.
// Because standard HTTP is stateless, a brand new MCP server instance and transport session are created for *every* individual request.
app.post("/mcp", async (req: Request, res: Response) => {
  
  // Instantiate a fresh MCP server instance, providing the metadata (name, version) that the client expects during initialization
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
    description: "Does nothing yet",
  });

  // Instantiate a new transport mechanism for this specific HTTP request/response cycle.
  // Passing `sessionIdGenerator: undefined` indicates we aren't tracking long-lived, stateful sessions across multiple HTTP requests.
  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  // Set up an event listener on the HTTP response object. If the client disconnects or the request finishes, 
  // explicitly close both the transport and the server to prevent memory leaks and free up system resources.
  res.on("close", () => {
    console.log("Closing transport and server");
    transport.close();
    server.close();
  });

  try {
    // Bind the MCP server instance to the transport instance so they can begin processing protocol messages
    await server.connect(transport);

    // Print a helpful console log showing which MCP JSON-RPC method (e.g., 'tools/list', 'tools/call') the client is trying to execute
    console.log(`\nMCP server ready to handle: ${req.body?.method || 'unknown method'}`);

    // Pass the Express request, response, and the parsed JSON body over to the transport layer.
    // The SDK will validate the JSON-RPC payload, execute the corresponding server logic, and stream the response back to the client.
    await transport.handleRequest(req, res, req.body);
    
  } catch (err) {
    // Catch any unexpected runtime errors that occur during connection or request processing
    console.error("MCP error:", err);
    
    // If the error occurred before headers were sent to the client, return a properly formatted JSON-RPC 2.0 error payload
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { 
          code: -32603, // Standard JSON-RPC code for an Internal Error
          message: "Internal server error" 
        },
        id: req.body?.id || null, // Echo back the request ID if available, otherwise return null
      });
    }
  }
});

// Specify the network port the Express application will listen on
const PORT = 3000;

// Start the HTTP server, making it ready to accept incoming connections on port 3000
app.listen(PORT, () =>
  console.log(`MCP server running at http://localhost:${PORT}/mcp`)
);