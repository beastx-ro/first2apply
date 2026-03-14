import { assert, assertEquals } from '@std/assert';

import { parseDiceJobs } from './parsers/dice.ts';
import { parseLinkedInJobs } from './parsers/linkedin.ts';

const linkedinUrl = new URL('./__fixtures__/jobBoards/linkedin.html', import.meta.url);
const diceUrl = new URL('./__fixtures__/jobBoards/dice.html', import.meta.url);

Deno.test('parseLinkedInJobs parses v1 list markup', async () => {
  const fileContent = await Deno.readTextFile(linkedinUrl);

  const result = parseLinkedInJobs({
    siteId: 99,
    html: fileContent,
  });

  assert(result.listFound, 'Expected LinkedIn list markup to be located');
  assertEquals(result.elementsCount, 2);
  assertEquals(result.jobs.length, 2);

  const [firstJob, secondJob] = result.jobs;

  assert(firstJob, 'First job should be parsed');
  assertEquals(firstJob.siteId, 99);
  assertEquals(firstJob.externalId, '1234567890');
  assertEquals(firstJob.title, 'Senior Automation Engineer');
  assertEquals(firstJob.companyName, 'Stealthy Systems');
  assertEquals(firstJob.location, 'Remote');
  assertEquals(firstJob.companyLogo, 'https://media.licdn.com/logo.png');

  assert(secondJob, 'Second job should be parsed');
  assertEquals(secondJob.externalId, '2345678901');
  assertEquals(secondJob.title, 'Browser Automation Specialist');
  assertEquals(secondJob.companyName, 'JobHack Labs');
  assertEquals(secondJob.location, 'Austin, TX');
});

Deno.test('Dice job parsing', async () => {
  const fileContent = await Deno.readTextFile(diceUrl);

  const result = parseDiceJobs({
    siteId: 100,
    html: fileContent,
  });

  console.log(result.jobs.length);
  // console.log(result.jobs.map((j) => j.title));
  assert(result.listFound, 'Expected Dice list markup to be located');
  assertEquals(result.elementsCount, 20);
  assertEquals(result.jobs.length, 20);

  const [firstJob] = result.jobs;

  assert(firstJob, 'First job should be parsed');
  assertEquals(firstJob.siteId, 100);
  assertEquals(firstJob.externalId, 'c5832c4d0a5c79c2d8a85ef576cf71fc');
  assertEquals(firstJob.externalUrl, 'https://www.dice.com/job-detail/1bfeeb74-b0a1-4597-a41d-1b00a2b0d8b9');
  assertEquals(firstJob.title, 'Lead Fullstack Engineer (React and Node)');
  assertEquals(firstJob.companyName, 'Simple Solutions');
  assertEquals(firstJob.location, 'Remote');

  const lastJob = result.jobs.at(-1);

  assert(lastJob, 'Last job should be parsed');
  assertEquals(lastJob.externalId, '1d68b1152388f1d0f6d6a988287ff5db');
  assertEquals(lastJob.externalUrl, 'https://www.dice.com/job-detail/f0c57849-ea4a-4ed3-a885-f42f87f6be5f');
  assertEquals(lastJob.title, 'Backend Engineer, AI');
  assertEquals(lastJob.companyName, 'Bjak Sdn Bhd');
  assertEquals(lastJob.location, 'New York, New York');
});
