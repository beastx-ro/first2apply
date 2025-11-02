import { getExceptionMessage } from '@first2apply/core/build/error';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse';
import { MCPServerSSE } from '@openai/agents-core';
import { createConnection } from '@playwright/mcp';
import contentType from 'content-type';
import express from 'express';
import http from 'http';
import { chromium } from 'playwright';
import getRawBody from 'raw-body';
import urljoin from 'url-join';

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
  const baseUrl = `http://127.0.0.1:${port}`;
  const sessions = new Map<string, SSEServerTransport>();
  const { router, knownMcpServers } = createHttpRouter({
    baseUrl,
    webSocketDebuggerUrl,
    logger,
    sessions,
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
    const url = urljoin(baseUrl, mcpServerPath);
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
  baseUrl,
  webSocketDebuggerUrl,
  sessions,
  logger,
}: {
  baseUrl: string;
  webSocketDebuggerUrl: string;
  sessions: Map<string, SSEServerTransport>;
  logger: ILogger;
}) {
  const app = express();

  const playwrightSsePath = '/playwright';
  app.get(playwrightSsePath, async (req, res) => {
    try {
      const connection = await createConnection(
        {
          capabilities: ['core', 'vision', 'pdf'],
          timeouts: {
            action: 10000,
            navigation: 30000,
          },
        },
        () => {
          return createPlaywrightConnection({
            webSocketDebuggerUrl,
            logger,
          });
        },
      );
      logger.info(`new Playwright MCP connection requested`);

      const transportUrl = urljoin(baseUrl, playwrightSsePath);
      const transport = new SSEServerTransport(transportUrl, res);
      sessions.set(transport.sessionId, transport);
      await connection.connect(transport);

      // Handle the connection close event
      res.on('close', () => {
        sessions.delete(transport.sessionId);
        connection
          .close()
          .then(() => {
            logger.info(`Playwright MCP connection closed (transport.sessionId=${transport.sessionId})`);
          })
          .catch((e) => {
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
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`Playwright MCP POST request finished in ${duration}ms`);
      });

      // logger.info(`Playwright MCP POST request received`);
      const url = new URL(`http://localhost${req.url}`);
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        res.statusCode = 400;
        logger.error(`Missing sessionId`);
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
      // logger.info(body);

      await transport.handlePostMessage(req, res, body);
    } catch (error) {
      res.status(500).end(`Error handling Playwright MCP POST: ${getExceptionMessage(error)}`);
    }
  });

  const knownMcpServers = [playwrightSsePath];

  return { router: app, knownMcpServers };
}

async function createPlaywrightConnection({
  webSocketDebuggerUrl,
  logger,
}: {
  webSocketDebuggerUrl: string;
  logger: ILogger;
}) {
  const browser = await chromium.connectOverCDP(webSocketDebuggerUrl);
  const context = browser.contexts()[0];
  const pages = context.pages();

  // choose the non main window page
  let targetPage;
  for (const page of pages) {
    const url = await page.url();
    if (!url.includes('localhost') && !url.includes('main_window')) {
      targetPage = page;
      break;
    }
  }

  // Optionally store this for debugging
  logger.info(`🎯 Using MCP on page: ${await targetPage.title()} (${await targetPage.url()})`);

  // MCP expects a BrowserContext, not a Page
  // We just return the context; MCP will use context.pages()[0],
  // so make sure targetPage is first in the array.
  if (pages[0] !== targetPage) {
    // reorder array in place (ugly but safe)
    pages.splice(pages.indexOf(targetPage), 1);
    pages.unshift(targetPage);
  }

  return context;
}
