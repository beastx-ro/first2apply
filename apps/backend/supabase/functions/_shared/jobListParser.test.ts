import { parseLinkedInJobs } from './parsers/linkedin.ts';

const filePath = '../../../../../test.html';
const fileContent = Deno.readTextFileSync(filePath);

const result = parseLinkedInJobs({
  siteId: 1,
  html: fileContent,
});

console.log('Parsed Jobs:', JSON.stringify(result, null, 2));
