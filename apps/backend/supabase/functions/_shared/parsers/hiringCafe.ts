import { DOMParser, Element } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from './parserTypes.ts';

/**
 * Method used to parse a hiring.cafe job page.
 */
export function parseHiringCafeJobs({ siteId, html }: { siteId: number; html: string }): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // HiringCafe has used both "/viewjob/<id>" and "/job/<id>" for rendered job cards.
  const allJobLinks = Array.from(document.querySelectorAll('a[href^="/viewjob/"], a[href^="/job/"]')) as Element[];

  if (allJobLinks.length === 0) {
    // Detect if the page structure was recognized at all (app shell loaded)
    const hasAppShell = !!document.querySelector('a[href*="/company/"], a[href*="/org/"]');
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

    const externalId = extractExternalId(href);
    if (!externalId) return null;

    const externalUrl = `https://hiring.cafe${href}`;

    const card = findJobCard(link);
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

    const tagTexts = tagElements.map((el) => el.textContent?.trim() || '').filter(Boolean);

    // Salary: older cards used a green class; newer cards can render salary as plain text.
    const salary =
      tagElements.find((el) => (el.getAttribute('class') ?? '').includes('green'))?.textContent?.trim() ||
      tagTexts.find(isSalaryText);

    // Job type: older cards used a cyan class; newer cards render Remote/Hybrid/Onsite as plain tag text.
    const workplaceTag =
      tagElements
        .find((el) => (el.getAttribute('class') ?? '').includes('cyan'))
        ?.textContent?.trim()
        ?.toLowerCase() || tagTexts.find(isWorkplaceTag)?.toLowerCase();

    // Filter out salary and job type from tags (only include skill/requirement tags)
    let tags: string[] = tagElements
      .filter((el) => {
        const classes = el.getAttribute('class') ?? '';
        const text = el.textContent?.trim() || '';
        return !classes.includes('green') && !classes.includes('cyan') && !isSalaryText(text) && !isWorkplaceTag(text);
      })
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);

    if (tags.length === 0) tags = parseSkillTags(card);

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

function extractExternalId(href: string): string | null {
  const path = href.split('?')[0]?.replace(/\/$/, '') ?? '';
  const match = path.match(/^\/(?:viewjob|job)\/([^/]+)$/);
  return match?.[1]?.trim() || null;
}

function findJobCard(link: Element): Element | null {
  let current: Element | null | undefined = link;

  while (current) {
    const classes = current.getAttribute('class') ?? '';
    if (
      classes.includes('bg-white') &&
      !!current.querySelector('span[class*="text-start"]') &&
      !!current.querySelector('picture > img')
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function isSalaryText(text: string): boolean {
  return /(?:[$€£]|\b(?:usd|eur|gbp|salary)\b|\d+\s*k\b)/i.test(text);
}

function isWorkplaceTag(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized === 'remote' || normalized === 'onsite' || normalized.includes('hybrid');
}

function parseSkillTags(card: Element): string[] {
  const skillText = Array.from(card.querySelectorAll('span[class*="line-clamp-2"]'))
    .map((el) => el.textContent?.trim() || '')
    .find((text) => text.includes(','));

  return skillText
    ? skillText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}
