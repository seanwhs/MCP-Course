// server.ts
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/http.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

// In-memory registry to store each session's transport by its unique session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Handle POST requests to the main /mcp entrypoint
app.post("/mcp", async (req: Request, res: Response) => {
  // 1. Request Reception: Extract session ID from headers
  const sid = req.headers["mcp-session-id"] as string | undefined;

  // 2. Session Lookup: Try to get the existing transport instance
  let transport: StreamableHTTPServerTransport | undefined = sid ? transports[sid] : undefined;

  // 3. Conditional Initialization
  // Only create new resources if NO existing session is found AND it's an initialize request
  if (!transport && isInitializeRequest(req.body)) {
    // Instantiate a dedicated MCP Server instance for this unique session
    const server = new McpServer({
      name: "example-stateful-server",
      version: "1.0.0",
      description: "A stateful MCP server that maintains session continuity",
    });

    // Configure the streamable HTTP transport layer
    transport = new StreamableHTTPServerTransport({
      // Generate a brand new UUID for tracking this session
      sessionIdGenerator: () => randomUUID(),
      // 4. Session Storage: Cache transport in memory once fully initialized by the SDK
      onsessioninitialized: (id) => {
        transports[id] = transport as StreamableHTTPServerTransport;
      },
    });

    // Bind the MCP server orchestration layer to the HTTP transport abstraction
    await server.connect(transport);
  }

  // 5. Transport Validation & Error Handling
  // If no transport exists (bad session ID, or non-initialize request sent to an uninitialized route)
  if (!transport) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: invalid session" },
      id: null,
    });
  }

  try {
    // Log the incoming method context for terminal verification
    console.log(`\nHandling MCP request: ${req.body?.method || 'unknown method'} (session: ${sid || 'new'})`);

    // 6. Request Processing: Let the transport execute the request lifecycle
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error encountered during processing:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP server running at http://localhost:${PORT}/mcp`);
});