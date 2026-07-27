import { DOMParser, Element } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from '../parsers/parserTypes.ts';
import { isSalaryText } from './parserHelpers.ts';

/**
 * Matches the relative date dice appends to the location line, ex: `Today`, `2d ago`, `3 days ago`.
 */
const POSTED_AT_REGEX = /^(today|yesterday|just posted|\d+\s*[a-z]{1,8}\.?(\s*ago)?)$/i;

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

  // dice renders two lists labelled `Job search results`: the actual results and a
  // `Similar Jobs` grid at the bottom of the page, so scope to the results container first
  const jobsList =
    document.querySelector('div[data-testid="job-search-split-view-card-list-scroll"] [role="list"]') ??
    document.querySelector('[role="list"][aria-label="Job search results"]') ??
    document.querySelector('[role="list"], [aria-label="Job search results"]');
  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const jobElements = Array.from(jobsList.querySelectorAll('div[data-testid="job-card"]')) as Element[];

  const parseJob = (el: Element): ParsedJob | null => {
    const externalId = el.getAttribute('data-id')?.trim();
    if (!externalId) return null;

    const jobGuid = el.getAttribute('data-job-guid')?.trim();
    if (!jobGuid) return null;
    const externalUrl = `https://www.dice.com/job-detail/${jobGuid}`.trim();

    const title = el.querySelector('a[data-testid="job-search-job-detail-link"]')?.textContent?.trim();
    if (!title) return null;

    const companyName = el.querySelector('p[data-testid="job-card-company-name"]')?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el.querySelector('a[aria-label="Company Logo"]')?.querySelector('img')?.getAttribute('src')?.trim() || undefined;

    // the meta line holds the location and the posting date, ex: `Boston, Massachusetts • 2d ago`.
    // it is the only paragraph left once the company name and the tag chips (which carry an id) are excluded
    const metaText = (Array.from(el.querySelectorAll('p')) as Element[])
      .filter((p) => !p.getAttribute('id') && p.getAttribute('data-testid') !== 'job-card-company-name')
      .map((p) => p.textContent?.trim() || '')
      .find((text) => !!text);

    const metaParts = (metaText?.split('•') ?? []).map((part) => part.trim()).filter((part) => !!part);
    const postedAt = POSTED_AT_REGEX.test(metaParts.at(-1) ?? '') ? metaParts.pop() : undefined;
    const location = metaParts.join(' • ') || undefined;

    let jobType: ParsedJob['jobType'] = 'onsite';
    if (location) {
      const locationLower = location.toLowerCase();
      if (locationLower.includes('remote')) {
        jobType = 'remote';
      } else if (locationLower.includes('hybrid')) {
        jobType = 'hybrid';
      }
    }

    const tags: string[] = [];
    if (postedAt) {
      tags.push(postedAt);
    }

    // tag chips, ex: `Sponsored`, `Easy Apply`, `Full-time`, `USD 80,000.00 - 190,000.00 per year`
    const otherTags = (Array.from(el.querySelectorAll('div[aria-labelledby] > p')) as Element[])
      .map((p) => p.textContent?.trim() || '')
      .filter((t) => !!t);
    tags.push(...otherTags);

    // dice explicitly labels the compensation chip, fall back to sniffing the tags for older markup
    const salaryTag =
      el.querySelector('div[aria-labelledby="salary-label"] > p')?.textContent?.trim() ||
      tags.find((t) => isSalaryText(t));
    const salary = salaryTag || undefined;
    if (salaryTag && tags.includes(salaryTag)) {
      tags.splice(tags.indexOf(salaryTag), 1);
    }

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      jobType,
      salary,
      labels: [],
      tags,
    };
  };

  const jobs = jobElements.map(parseJob);
  const validJobs = jobs.filter((job): job is ParsedJob => !!job);

  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobElements.length,
  };
}
