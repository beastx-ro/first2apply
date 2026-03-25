import { assert, assertEquals } from '@std/assert';

import { TestLogger } from './logger.ts';
import { parseDiceJobs } from './parsers/dice.ts';
import { parseLinkedInJobs } from './parsers/linkedin.ts';
import { parseRemoteioJobs } from './parsers/remoteio.ts';

const linkedinUrl = new URL('./__fixtures__/jobBoards/linkedin.html', import.meta.url);
const diceUrl = new URL('./__fixtures__/jobBoards/dice.html', import.meta.url);

const logger = new TestLogger();

Deno.test('parseLinkedInJobs parses v1 list markup', async () => {
  const fileContent = await Deno.readTextFile(linkedinUrl);

  const result = parseLinkedInJobs({
    siteId: 99,
    html: fileContent,
    logger,
  });

  logger.info('Parsed LinkedIn jobs result:', result);
  assert(result.listFound, 'Expected LinkedIn list markup to be located');
  assertEquals(result.elementsCount, 25);
  assertEquals(result.jobs.length, 25);

  const [firstJob] = result.jobs;

  assert(firstJob, 'First job should be parsed');
  assertEquals(firstJob.externalId, '4358318235');
  assertEquals(firstJob.externalUrl, 'https://www.linkedin.com/jobs/view/4358318235');
  assertEquals(firstJob.title, 'Senior Technical Recruiter');
  assertEquals(firstJob.companyName, 'Jua');
  assert(firstJob.companyLogo, 'Company logo should be parsed');
  assertEquals(firstJob.location, 'Zurich');

  const lastJob = result.jobs.at(-1);

  assert(lastJob, 'Last job should be parsed');
  assertEquals(lastJob.externalId, '4370949635');
  assertEquals(lastJob.externalUrl, 'https://www.linkedin.com/jobs/view/4370949635');
  assertEquals(lastJob.title, 'Recruitment Consultant');
  assertEquals(lastJob.companyName, 'CJ Recruitment');
  assert(lastJob.companyLogo, 'Company logo should be parsed');
  assertEquals(lastJob.location, 'Zurich, Switzerland');
});

Deno.test('Dice job parsing', async () => {
  const fileContent = await Deno.readTextFile(diceUrl);

  const result = parseDiceJobs({
    siteId: 100,
    html: fileContent,
  });

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

Deno.test('Remote.io job parsing', async () => {
  const remoteioUrl = new URL('./__fixtures__/jobBoards/remoteio.html', import.meta.url);
  const fileContent = await Deno.readTextFile(remoteioUrl);

  const result = parseRemoteioJobs({
    siteId: 101,
    html: fileContent,
  });

  assert(result.listFound, 'Expected Remote.io list markup to be located');
  assertEquals(result.elementsCount, 50);
  assertEquals(result.jobs.length, 50);

  const [firstJob] = result.jobs;

  assert(firstJob, 'First job should be parsed');
  assertEquals(firstJob.externalId, 'card-job-48c809b2-cb1a-4d45-8d08-3b5d284fd10e');
  assertEquals(
    firstJob.externalUrl,
    'https://remote.io/remote-jobs/customer-service/senior-customer-support-associate-at-laurel-69727',
  );
  assertEquals(firstJob.title, 'Senior Customer Support Associate');
  assertEquals(firstJob.companyName, 'Laurel');
  assertEquals(firstJob.location, 'United States');
  assertEquals(firstJob.jobType, 'remote');
  assertEquals(firstJob.salary, '$85,000 - $95,000 / year');
  assertEquals(firstJob.tags, ['Customer Service', '1d']);
  assert(firstJob.companyLogo, 'Company logo should be parsed');

  const lastJob = result.jobs.at(-1);

  assert(lastJob, 'Last job should be parsed');
  assertEquals(lastJob.externalId, 'card-job-73306a96-a365-4bc6-ae31-b0e80d4a5fa6');
  assertEquals(
    lastJob.externalUrl,
    'https://remote.io/remote-jobs/customer-service/support-engineer-us-east-ic2-at-sourcegraph-69480',
  );
  assertEquals(lastJob.title, 'Support Engineer - US East [IC2]');
  assertEquals(lastJob.companyName, 'Sourcegraph');
  assertEquals(lastJob.location, 'United States');
  assertEquals(lastJob.jobType, 'remote');
  assertEquals(lastJob.salary, '$84,800 / year');
  assertEquals(lastJob.tags, ['Customer Service', '5d']);
  assert(lastJob.companyLogo, 'Company logo should be parsed');
});
