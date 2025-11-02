import { Agent, run, tool } from '@openai/agents';
import { dialog, ipcMain, shell } from 'electron';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';

export const GET_USER_RESUME_TOOL = tool({
  name: 'get_user_resume',
  description: 'Ask the user to select a pdf file from their computer and return its text content.',
  parameters: z.object({}),
  execute: async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    const filePath = res.filePaths[0];
    if (res.canceled) return `The user did not select a file.`;

    const dataBuffer = fs.readFileSync(filePath);
    const pdfParser = new PDFParse({ data: dataBuffer });
    const data = await pdfParser.getText();

    return `The user selected the file at path: ${filePath}. The extracted text content is: ${data}`;
  },
});
