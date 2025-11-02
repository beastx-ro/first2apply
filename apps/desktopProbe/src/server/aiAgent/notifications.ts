import { getExceptionMessage } from '@first2apply/core/build';
import { tool } from '@openai/agents';
import { z } from 'zod';

export function buildNotificationTools({ mainWindow }: { mainWindow: Electron.BrowserWindow }) {
  const notifyUiProgress = tool({
    name: 'notify_ui_progress',
    description: 'Notify the UI about the progress of a long-running operation.',
    parameters: z.object({
      action: z.string(),
    }),
    execute: async ({ action }: { action: string }) => {
      try {
        mainWindow.webContents.send('ai-agent-notify-ui-progress', { action });
      } catch (error) {
        return `An error occurred while notifying UI progress: ${getExceptionMessage(error, true)}`;
      }
    },
  });

  const tools = [notifyUiProgress];

  return tools;
}
