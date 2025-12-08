import { DOMParser, Element } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from '../parsers/parserTypes.ts';

/**
 * Method used to parse a dice job page.
 */
export function parseDiceJobs({ siteId, html }: { siteId: number; html: string }): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // check if the list is empty first
  const noResultsNode =
    document.querySelector('.no-jobs-message') ?? document.querySelector("div[data-testid='job-search-no-results']");
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector('[role="list"], [aria-label="Job search results"]');
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(jobsList.querySelectorAll('div[data-testid="job-card"]')) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const externalId = el?.getAttribute('data-id')?.trim();
    if (!externalId) return null;

    const jobGuid = el?.getAttribute('data-job-guid')?.trim();
    if (!jobGuid) return null;
    const externalUrl = `https://www.dice.com/job-detail/${jobGuid}`.trim();

    const title = el.querySelector('.content > div')?.textContent?.trim();
    if (!title) return null;

    const companyName = el.querySelector('.header > span > a:nth-child(2)')?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo = el.querySelector('.header > span > a')?.querySelector('img')?.getAttribute('src') || undefined;

    const location = el.querySelector('.content > span > div > div')?.textContent.trim();

    const tags: string[] = [];
    const postedAt = el
      .querySelector('.content > span > div > div:nth-child(2) > div:nth-child(2)')
      ?.textContent.trim();
    if (postedAt) {
      tags.push(postedAt);
    }

    const otherTags = Array.from(el.querySelectorAll('.content > div.box'))
      .map((el) => el.textContent?.trim() || '')
      .filter((t) => !!t);
    tags.push(...otherTags);

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      labels: [],
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}
