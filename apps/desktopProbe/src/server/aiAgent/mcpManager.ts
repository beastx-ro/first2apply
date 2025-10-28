import { getExceptionMessage } from '@first2apply/core/build/error';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';
import { MCPServerSSE } from '@openai/agents-core';
import { createConnection } from '@playwright/mcp';
import contentType from 'content-type';
import express from 'express';
import http from 'http';
import getRawBody from 'raw-body';

import { ILogger } from '../logger';
import { findFreePort } from '../netUtils';

/**
 * Create MCP servers for all tools needed by the First2Apply agent.
 */
export async function createFirst2ApplyMcpServers({
  webSocketDebuggerUrl,
  logger,
}: {
  webSocketDebuggerUrl: string;
  logger: ILogger;
}) {
  const port = await findFreePort();
  const sessions = new Map<string, SSEServerTransport>();
  const { router, knownMcpServers } = createHttpRouter({
    sessions,
    logger,
    webSocketDebuggerUrl,
  });
  const server = http.createServer(router);
  server.listen(port, () => {
    logger.info(`MCP HTTP server started on port ${port}`);
  });
  server.on('error', (err) => {
    logger.error(`MCP HTTP server error: ${err}`);
  });
  server.on('close', () => {
    logger.info(`MCP HTTP server closed`);
  });

  const mcpServers = knownMcpServers.map((mcpServerPath) => {
    const url = `http://localhost:${port}${mcpServerPath}`;
    const mcpServer = new MCPServerSSE({
      url,
      name: mcpServerPath,
    });
    logger.info(`Created MCP server for ${mcpServerPath}`);

    return mcpServer;
  });

  return { httpServer: server, mcpServers };
}

function createHttpRouter({
  webSocketDebuggerUrl,
  sessions,
  logger,
}: {
  webSocketDebuggerUrl: string;
  sessions: Map<string, SSEServerTransport>;
  logger: ILogger;
}) {
  const app = express();

  const playwrightSsePath = '/playwright';
  app.get(playwrightSsePath, async (req, res) => {
    try {
      const connection = await createConnection({
        browser: {
          cdpEndpoint: webSocketDebuggerUrl, // Connect to the hidden window
        },
      });
      logger.info(`new Playwright MCP connection requested`);

      const transport = new SSEServerTransport(playwrightSsePath, res);
      sessions.set(transport.sessionId, transport);
      await connection.connect(transport);

      // Handle the connection close event
      res.on('close', () => {
        sessions.delete(transport.sessionId);
        connection.close().catch((e) => {
          logger.error(`Error closing connection: ${getExceptionMessage(e)}`);
        });
      });
      return;
    } catch (error) {
      res.status(500).end(`Error creating Playwright MCP server: ${getExceptionMessage(error)}`);
    }
  });
  app.post(playwrightSsePath, async (req, res) => {
    try {
      const url = new URL(`http://localhost${req.url}`);
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        res.statusCode = 400;
        return res.end('Missing sessionId');
      }

      const transport = sessions.get(sessionId);
      if (!transport) {
        res.statusCode = 404;
        return res.end('Session not found');
      }

      const ct = contentType.parse(req.headers['content-type'] ?? '');
      const body = JSON.parse(
        await getRawBody(req, {
          limit: '4mb',
          encoding: ct.parameters.charset ?? 'utf-8',
        }),
      );
      // const requestId = body.id;

      return await transport.handlePostMessage(req, res, body);
    } catch (error) {
      res.status(500).end(`Error handling Playwright MCP POST: ${getExceptionMessage(error)}`);
    }
  });

  const knownMcpServers = [playwrightSsePath];

  return { router: app, knownMcpServers };
}

// export interface MCPServer {
//   cacheToolsList: boolean;
//   toolFilter?: MCPToolFilterCallable | MCPToolFilterStatic;
//   connect(): Promise<void>;
//   readonly name: string;
//   close(): Promise<void>;
//   listTools(): Promise<MCPTool[]>;
//   callTool(toolName: string, args: Record<string, unknown> | null): Promise<CallToolResultContent>;
//   invalidateToolsCache(): Promise<void>;
// }
