import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Agent, MCPServerStdio, run } from '@openai/agents';
import { createConnection } from '@playwright/mcp';
import { app } from 'electron';
import net from 'net';

import { ILogger } from './logger';

/**
 * Class managing an AI agent that can autoapply for jobs.
 * It runs an AI agent that has access to playwright MCP
 * connected to overlay browser window.
 */
export class AiAgent {
  private _debuggerPort: number = 0;
  private _agent: Agent | null = null;

  constructor() {}

  /**
   * Decorates the electron app with necessary settings to run the AI agent.
   */
  preBootSync({ logger }: { logger: ILogger }): void {
    this._debuggerPort = this._findFreePortSync();
    logger.info(`Using remote debugging port: ${this._debuggerPort}`);
    app.commandLine.appendSwitch('remote-debugging-port', `${this._debuggerPort}`);
  }
  /**
   * Generates a random port that is not in use.
   */
  private _findFreePortSync(): number {
    const server = net.createServer();
    server.listen(0);
    const port = (server.address() as net.AddressInfo).port;
    server.close();
    return port;
  }

  async destroy() {}

  async startAgent({ logger }: { logger: ILogger }) {
    const res = await fetch(`http://localhost:${this._debuggerPort}/json/version`);
    const json = await res.json();
    const cdpEndpoint = json.webSocketDebuggerUrl;
    console.log('Debugger URL:', cdpEndpoint);

    const transport = new StdioServerTransport();

    // const filesystemServer = new MCPServerStdio({
    //   name: 'Filesystem Server',
    //   fullCommand: `npx -y @modelcontextprotocol/server-filesystem ${samplesDir}`,
    // });

    const connection = await createConnection({
      browser: {
        cdpEndpoint,
      },
    });
    await connection.connect(transport);

    logger.info(`Playwright successfully connected to electron child process`);
  }
}
