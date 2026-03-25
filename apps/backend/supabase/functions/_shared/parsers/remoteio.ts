import { DOMParser, Element } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from './parserTypes.ts';

/**
 * Method used to parse a remoteio job page.
 */
export function parseRemoteioJobs({ siteId, html }: { siteId: number; html: string }): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // check if the list is empty first
  const noResultsNode = document.querySelector('.shadow-singlePost');
  if (noResultsNode && noResultsNode.textContent.trim().toLowerCase().startsWith('no results found')) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  const jobsList = document.querySelector('div[id="root"] > div:nth-child(4) > div > section > div:nth-child(3)');
  if (!jobsList)
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };

  const jobElements = Array.from(jobsList.querySelectorAll(':scope > div')) as Element[];

  const jobs = jobElements.map((el): ParsedJob | null => {
    const jobInfo = el.querySelector('a');
    if (!jobInfo) return null;

    const href = jobInfo.getAttribute('href');
    const externalUrl = href?.startsWith('http') ? href.trim() : href ? `https://remote.io${href.trim()}` : null;
    if (!externalUrl) return null;

    const externalId = jobInfo.getAttribute('data-testid')?.trim();
    if (!externalId) return null;

    const title = jobInfo.querySelector(':scope > div > div:first-child > div:nth-child(2) > h3')?.textContent?.trim();
    if (!title) return null;

    const companyName = jobInfo
      .querySelector(':scope > div > div:first-child > div:nth-child(2) > p')
      ?.textContent?.trim();
    if (!companyName) return null;

    const location = jobInfo
      .querySelector(':scope > div > div:first-child > div:nth-child(2) > div > button')
      ?.textContent?.trim();

    const companyLogoRelativeUrl = jobInfo
      .querySelector(':scope > div > div:first-child > div:first-child > img')
      ?.getAttribute('src')
      ?.trim();
    const companyLogo = companyLogoRelativeUrl ? `https://remote.io${companyLogoRelativeUrl}` : undefined;

    let tags: string[] = [];
    const tagsList = Array.from(el.querySelectorAll(':scope > a > div > div:nth-child(4) > button')) as Element[];
    if (tagsList.length > 0) {
      tags = tagsList.map((tag) => tag.textContent.trim()).filter((t): t is string => !!t);
    }

    const timeAgoEl = el.querySelector(':scope > a > div > span[data-testid^="text-time-"]');
    if (timeAgoEl) {
      tags.push(timeAgoEl.textContent.trim());
    }

    const salary = el.querySelector(':scope > a > div span[data-testid^="text-salary-"]')?.textContent?.trim();

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      salary,
      companyLogo,
      jobType: 'remote',
      location,
      tags,
      labels: [],
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);
  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}
