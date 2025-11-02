import { Job } from '@first2apply/core/';
import { getExceptionMessage } from '@first2apply/core/build/error';
import { Agent, OpenAIResponsesModel, run, withTrace } from '@openai/agents';
import { app } from 'electron';
import http from 'http';
import { OpenAI } from 'openai';
import { chromium } from 'playwright';

import { ILogger } from '../logger';
import { findFreePortSync } from '../netUtils';
import { createFirst2ApplyMcpServers } from './mcpManager';
import { MEMOR_TOOLS } from './memory';
import { buildNotificationTools } from './notifications';
import { GET_USER_RESUME_TOOL } from './tools';

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

  async bringToLife({ logger, mainWindow }: { logger: ILogger; mainWindow: Electron.BrowserWindow }) {
    // Wait a bit for the debug server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    logger.info(`Bringing AI agent to life ...`);

    // connect to the browser endpoint instead of a specific page
    const versionRes = await fetch(`http://localhost:${this._debuggerPort}/json/version`);
    const version = await versionRes.json();

    logger.info('Browser version info:', version);
    const webSocketDebuggerUrl = version.webSocketDebuggerUrl;
    logger.info(`Using browser-level CDP endpoint: ${webSocketDebuggerUrl}`);

    // 🧪 TEST: Direct Playwright CDP connection
    const testResult = await testPlaywrightCDPConnection({
      webSocketDebuggerUrl,
      logger,
    });

    if (testResult.success) {
      logger.info(`🎉 Playwright CDP test successful! Page title: "${testResult.title}"`);
    } else {
      // throw new Error(`Playwright CDP test failed: ${testResult.error}`);
    }

    const { httpServer, mcpServers } = await createFirst2ApplyMcpServers({
      logger,
      webSocketDebuggerUrl,
    });
    this._httpServer = httpServer;

    // dont forget to connect the mcp servers
    await Promise.all(mcpServers.map((server) => server.connect()));

    const model = new OpenAIResponsesModel(new OpenAI({}), 'gpt-5-mini');
    this._agent = Agent.create({
      name: 'First 2 Apply MCP Assistant',
      instructions: this._getSystemPromptForJobApplication(),
      mcpServers,
      model,
      tools: [...MEMOR_TOOLS, GET_USER_RESUME_TOOL, ...buildNotificationTools({ mainWindow })],
    });

    logger.info(`AI agent brought to life.`);
  }

  async use({ input }: { input: string }) {
    if (!this._agent) {
      throw new Error('AI agent is not initialized');
    }

    return withTrace('AiAgent.use', () =>
      run(this._agent, input, {
        // stream: true,
        maxTurns: 30,
      }),
    );
  }

  async applyToJob({ job }: { job: Job }) {
    try {
      // noop for now
    } catch (error) {
      return {
        success: false,
        error: `An error occurred while applying to job ${job.id}: ${getExceptionMessage(error, true)}`,
      };
    }
  }

  private _getSystemPromptForJobApplication() {
    return `
You are an AI assistant that helps users apply for jobs automatically using a browser.
You have access to a browser via MCP (Playwright) and can navigate the web, fill forms, and click buttons.
You can also use it to extract information from web pages.
Your goal is to help the user apply for jobs on their behalf.
The conversation with the user starts after he clicks the "Apply" button in the overlay browser window.
So first thing to do is to ask the user for his resume using the "get_user_resume" tool in order to extract relevant information to fill the application form. Try to load it from memory first using the memory tools.
After that, use MCP to read the currently opened page in the browser and understand what job application form needs to be filled.
Use the MCP servers to read the page content and extract necessary information about the job application form.
After that, use MCP to fill in the application form fields, but never press the FINAL "apply" button without asking the user for confirmation first.
Before filling out the first form field, always make sure to scroll to the field so that it is visible in the browser viewport (smoooth scrolling is preferred).

Always assume that the user wants to use the selected resume to fill out the application form, no need to ask for confirmation about that.
Automatically accept any checkboxes for terms and conditions, privacy policy, etc.
When dealing with email fields, always use the email address found in the resume.
If you need to create an account, use the email from the resume and generate a secure password. Never try to log in, but rather create a new account.
If the account creation requires email verification, ask the user for the email verification code and continue the process.

Don't output back things like you read the page, or the job details because the user can see them too.
Just keep it short and helful to the job application. Only ask for things that you cannot already figure out from the resume.
But do not answer fields where you cannot find the relevant information either in the resume or in the memory.

When dealing with this infamous question: "How did you hear about us?", just answer with "Through First 2 Apply".

You also have access to memory tools to save and retrieve information about the user's resume or other preferences.
Here are the things you can save and retrieve from memory:
- {"user_resume": "The user's resume text content"}
- {"user_resume_file_path": "The file path on disk that contains the user's resume. Can be used to attach to job forms."}
- {"job_title": "The job title the user is applying for"}
- {"job_description": "The job description the user is applying for"}
- {"additional_information": "Any additional information the user wants to provide"}

Use these memory tools to store and retrieve information as needed to assist the user in applying for jobs.

Make sure all links that you click open in the same tab, never a new window or tab.
Keep the user informed about what you are going to do using the notify_ui_progress tool;
- reading resume
- analyzing job application form
- filling out form fields
- waiting for user input
- ready to submit application
`;
  }
}

/**
 * Test if Playwright can directly connect to the CDP endpoint and control the page
 */
export async function testPlaywrightCDPConnection({
  webSocketDebuggerUrl,
  logger,
  targetUrl,
}: {
  webSocketDebuggerUrl: string;
  logger: ILogger;
  targetUrl?: string; // Optional: specific URL to look for
}): Promise<{ success: boolean; title?: string; error?: string; targetPage?: unknown }> {
  let browser;

  try {
    logger.info(`🧪 Testing direct Playwright CDP connection to: ${webSocketDebuggerUrl}`);

    // Connect to the existing browser via CDP
    browser = await chromium.connectOverCDP(webSocketDebuggerUrl);
    logger.info('✅ Successfully connected to browser via CDP');

    // Get all contexts and pages
    const contexts = browser.contexts();
    logger.info(`Found ${contexts.length} browser contexts`);

    if (contexts.length === 0) {
      throw new Error('No browser contexts found');
    }

    const pages = contexts[0].pages();
    logger.info(`Found ${pages.length} pages in first context`);

    if (pages.length === 0) {
      throw new Error('No pages found in browser context');
    }

    // List all available pages
    logger.info('Available pages:');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const title = await page.title();
      const url = await page.url();
      logger.info(`  Page ${i}: "${title}" - ${url}`);
    }

    // Find the target page
    let targetPage;

    if (targetUrl) {
      // Look for specific URL
      targetPage = pages.find(async (page) => {
        const url = await page.url();
        return url.includes(targetUrl);
      });
    } else {
      // Look for the job site page (not the main window)
      for (const page of pages) {
        const url = await page.url();
        if (!url.includes('localhost:3049') && !url.includes('main_window')) {
          targetPage = page;
          break;
        }
      }
    }

    // If no specific target found, use the last page (might be the overlay browser)
    if (!targetPage) {
      targetPage = pages[pages.length - 1];
      logger.info('No specific target found, using last page');
    }

    // Test basic operations on the target page
    const title = await targetPage.title();
    const url = await targetPage.url();

    logger.info(`🎯 Target page title: "${title}"`);
    logger.info(`🌐 Target page URL: ${url}`);

    // Test if we can execute JavaScript
    const result = await targetPage.evaluate(() => {
      return {
        userAgent: navigator.userAgent,
        windowSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        docTitle: document.title,
        bodyText: document.body?.innerText?.substring(0, 200) || 'No body text',
      };
    });

    logger.info('📊 Target page evaluation result:', result);

    // Test if we can take a screenshot
    // try {
    //   const screenshot = await targetPage.screenshot({
    //     type: 'png',
    //     fullPage: false,
    //     clip: { x: 0, y: 0, width: 400, height: 300 },
    //   });
    //   logger.info(`📸 Screenshot captured: ${screenshot.length} bytes`);
    // } catch (screenshotError) {
    //   logger.info('Screenshot failed (this is okay):', screenshotError);
    // }

    return {
      success: true,
      title,
      targetPage, // Return the page reference for later use
    };
  } catch (error) {
    const errorMessage = getExceptionMessage(error);
    logger.error(`❌ Playwright CDP connection test failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    // Clean up - but DON'T close the browser since it's the Electron app
    try {
      if (browser) {
        // Just disconnect, don't close the browser
        await browser.close();
        logger.info('🔌 Disconnected from browser (browser remains running)');
      }
    } catch (cleanupError) {
      logger.info('Cleanup warning:', cleanupError);
    }
  }
}
