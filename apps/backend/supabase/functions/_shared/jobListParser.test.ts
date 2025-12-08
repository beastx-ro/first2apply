import { assert, assertEquals } from 'std/testing/asserts';

import { parseDiceJobs } from './parsers/dice.ts';
import { parseLinkedInJobs } from './parsers/linkedin.ts';

const linkedinUrl = new URL('./__fixtures__/jobBoards/linkedin.html', import.meta.url);
const diceUrl = new URL('./__fixtures__/jobBoards/dice.html', import.meta.url);

// Deno.test('parseLinkedInJobs parses v1 list markup', async () => {
//   const fileContent = await Deno.readTextFile(fixtureUrl);

//   const result = parseLinkedInJobs({
//     siteId: 99,
//     html: fileContent,
//   });

//   assert(result.listFound, 'Expected LinkedIn list markup to be located');
//   assertEquals(result.elementsCount, 2);
//   assertEquals(result.jobs.length, 2);

//   const [firstJob, secondJob] = result.jobs;

//   assert(firstJob, 'First job should be parsed');
//   assertEquals(firstJob.siteId, 99);
//   assertEquals(firstJob.externalId, '1234567890');
//   assertEquals(firstJob.title, 'Senior Automation Engineer');
//   assertEquals(firstJob.companyName, 'Stealthy Systems');
//   assertEquals(firstJob.location, 'Remote');
//   assertEquals(firstJob.companyLogo, 'https://media.licdn.com/logo.png');

//   assert(secondJob, 'Second job should be parsed');
//   assertEquals(secondJob.externalId, '2345678901');
//   assertEquals(secondJob.title, 'Browser Automation Specialist');
//   assertEquals(secondJob.companyName, 'JobHack Labs');
//   assertEquals(secondJob.location, 'Austin, TX');
// });

Deno.test('Dice job parsing', async () => {
  const fileContent = await Deno.readTextFile(diceUrl);

  const result = parseDiceJobs({
    siteId: 100,
    html: fileContent,
  });

  assert(result.listFound, 'Expected Dice list markup to be located');
  assertEquals(result.elementsCount, 2);
  assertEquals(result.jobs.length, 2);

  const [firstJob, secondJob] = result.jobs;

  assert(firstJob, 'First job should be parsed');
  assertEquals(firstJob.siteId, 100);
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
