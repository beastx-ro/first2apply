import { getExceptionMessage } from '@first2apply/core/build';
import { tool } from '@openai/agents';
import { dialog } from 'electron';
import fs from 'fs';
import PDFParser from 'pdf2json';
import { z } from 'zod';

export const GET_USER_RESUME_TOOL = tool({
  name: 'get_user_resume',
  description: 'Ask the user to select a pdf file from their computer and return its text content.',
  parameters: z.object({}),
  execute: async () => {
    try {
      const res = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });
      const filePath = res.filePaths[0];
      if (res.canceled) return `The user did not select a file.`;

      const data = await readPdfTextContent(filePath);

      return `The user selected the file at path: ${filePath}. The extracted text content is: ${data}`;
    } catch (error) {
      return `An error occurred while getting the user's resume: ${getExceptionMessage(error, true)}`;
    }
  },
});

function readPdfTextContent(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, true);

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(errData);
    });

    pdfParser.on('pdfParser_dataReady', () => {
      const textContent = pdfParser.getRawTextContent();
      resolve(textContent);
    });

    pdfParser.loadPDF(filePath);
  });
}
