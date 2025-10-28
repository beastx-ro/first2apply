import { Agent, OpenAIResponsesModel, run } from '@openai/agents';
import { app } from 'electron';
import http from 'http';
import { OpenAI } from 'openai';

import { ILogger } from '../logger';
import { findFreePortSync } from '../netUtils';
import { createFirst2ApplyMcpServers } from './mcpManager';

/**
 * Class managing an AI agent that can autoapply for jobs.
 * It runs an AI agent that has access to playwright MCP
 * connected to overlay browser window.
 */
export class AiAgent {
  private _debuggerPort: number = 0;
  private _httpServer?: http.Server;
  private _agent: Agent | null = null;

  constructor() {}

  /**
   * Decorates the electron app with necessary settings to run the AI agent.
   */
  preBootSync({ logger }: { logger: ILogger }): void {
    this._debuggerPort = findFreePortSync();
    logger.info(`Using remote debugging port: ${this._debuggerPort}`);
    app.commandLine.appendSwitch('remote-debugging-port', `${this._debuggerPort}`);
  }

  async destroy() {
    await this._httpServer.close();
    await this._httpServer.closeAllConnections();
  }

  async bringToLife({ logger }: { logger: ILogger }) {
    logger.info(`Bringing AI agent to life ...`);
    const res = await fetch(`http://localhost:${this._debuggerPort}/json/version`);
    const json = await res.json();
    const cdpEndpoint = json.webSocketDebuggerUrl;
    logger.info('Debugger URL:', cdpEndpoint);

    const { httpServer, mcpServers } = await createFirst2ApplyMcpServers({
      logger,
      webSocketDebuggerUrl: cdpEndpoint,
    });

    // dont forget to connect the mcp servers
    await Promise.all(mcpServers.map((server) => server.connect()));

    const model = new OpenAIResponsesModel(
      new OpenAI({
        apiKey:
          // temp - replace with your own key or use environment variable
          '',
      }),
      'gpt-5-mini',
    );
    this._agent = new Agent({
      name: 'First 2 Apply MCP Assistant',
      instructions: `You are an AI assistant that helps users apply for jobs automatically using a browser.`,
      mcpServers,
      model,
    });
    this._httpServer = httpServer;

    logger.info(`AI agent brought to life.`);
  }

  async use({ input }: { input: string }) {
    if (!this._agent) {
      throw new Error('AI agent is not initialized');
    }

    return run(this._agent, input, {});
  }
}
