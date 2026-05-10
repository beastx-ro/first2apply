import { DOMParser, Element } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from './parserTypes.ts';

/**
 * Method used to parse a hiring.cafe job page.
 */
export function parseHiringCafeJobs({ siteId, html }: { siteId: number; html: string }): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // Find all job posting links - each card has exactly one "/viewjob/" link
  const allJobLinks = Array.from(document.querySelectorAll('a[href^="/viewjob/"]')) as Element[];

  if (allJobLinks.length === 0) {
    // Detect if the page structure was recognized at all (app shell loaded)
    const hasAppShell = !!document.querySelector('a[href*="/company/"]');
    return {
      jobs: [],
      listFound: hasAppShell,
      elementsCount: 0,
    };
  }

  // Deduplicate by href (same job can appear in multiple sections)
  const seenHrefs = new Set<string>();
  const jobLinks = allJobLinks.filter((link) => {
    const href = link.getAttribute('href') ?? '';
    if (seenHrefs.has(href)) return false;
    seenHrefs.add(href);
    return true;
  });

  const jobs = jobLinks.map((link): ParsedJob | null => {
    const href = link.getAttribute('href')?.trim();
    if (!href) return null;

    // href looks like "/viewjob/<id>"
    const externalId = href.replace('/viewjob/', '').trim();
    if (!externalId) return null;

    const externalUrl = `https://hiring.cafe${href}`;

    // The link is nested: a → div.flex.justify-between → div.flex.flex-col.items-center → div.relative.bg-white → div.relative (card)
    const card = link.parentElement?.parentElement?.parentElement?.parentElement;
    if (!card) return null;

    // Job title: span with text-start class (unique to the title element)
    const title = card.querySelector('span[class*="text-start"]')?.textContent?.trim();
    if (!title) return null;

    // Company name: img alt inside <picture> (most reliable source)
    const companyName = card.querySelector('picture > img')?.getAttribute('alt')?.trim();
    if (!companyName) return null;

    // Company logo: img src inside <picture>
    const companyLogo = card.querySelector('picture > img')?.getAttribute('src')?.trim() || undefined;

    // Location: the only span inside the element with bg-gray-50 class
    const location = card.querySelector('[class*="bg-gray-50"] span')?.textContent?.trim() || undefined;

    // Tags: all direct span children of the flex-wrap container (excluding salary and job type)
    const tagElements = Array.from(card.querySelectorAll('[class*="gap-1"] > span')) as Element[];

    // Salary: the green-bordered span (salary tag)
    const salary = tagElements.find((el) => (el.getAttribute('class') ?? '').includes('green'))?.textContent?.trim();

    // Job type: derived from the cyan-bordered span (workplace type tag)
    const workplaceTag = tagElements
      .find((el) => (el.getAttribute('class') ?? '').includes('cyan'))
      ?.textContent?.trim()
      ?.toLowerCase();

    // Filter out salary and job type from tags (only include skill/requirement tags)
    const tags: string[] = tagElements
      .filter((el) => {
        const classes = el.getAttribute('class') ?? '';
        return !classes.includes('green') && !classes.includes('cyan');
      })
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);

    let jobType: ParsedJob['jobType'];
    if (workplaceTag === 'remote') jobType = 'remote';
    else if (workplaceTag?.includes('hybrid')) jobType = 'hybrid';
    else if (workplaceTag) jobType = 'onsite';

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      salary,
      jobType,
      labels: [],
      tags,
    };
  });

  const validJobs = jobs.filter((job): job is ParsedJob => !!job);

  return {
    jobs: validJobs,
    listFound: true,
    elementsCount: jobLinks.length,
  };
}
