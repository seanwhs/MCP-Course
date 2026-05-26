// server.ts
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./mcp-server.js";

const app = express();
app.use(express.json());

// Store each session's transport by its session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined = sid ? transports[sid] : undefined;

  // Multi-tenant session fallback optimization:
  if (!transport && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport as StreamableHTTPServerTransport;
      },
    });

    const { server } = createMcpServer();
    await server.connect(transport);
  }

  if (!transport) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: invalid session" },
      id: null,
    });
  }

  // Hand off the request handling sequence to the context transport protocol
  await transport.handleRequest(req, res, req.body);
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`MCP server running at http://localhost:${PORT}/mcp`)
);