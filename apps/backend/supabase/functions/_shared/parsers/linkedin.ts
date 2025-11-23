import { DOMParser, Element, NodeType } from 'deno-dom-wasm';

import { JobSiteParseResult, ParsedJob } from '../parsers/parserTypes.ts';

/**
 * Method used to parse a linkedin job page.
 */
export function parseLinkedInJobs({ siteId, html }: { siteId: number; html: string }): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // check if the list is empty first
  const noResultsNode =
    document.querySelector('.no-results') ||
    document.querySelector('.jobs-search-no-results-banner') ||
    document.querySelector('.jobs-semantic-search__no-results');
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  let parserVersion = 1;
  let jobsList = document.querySelector('.jobs-search__results-list');
  if (!jobsList) {
    // check if the user is logged into LinkedIn because then it has a totally different layout
    jobsList =
      document.querySelector('ul li[data-occludable-job-id]')?.closest('ul') ??
      document.querySelector('.scaffold-layout__list ul') ??
      null;
    if (jobsList) parserVersion = 2;
  }
  if (!jobsList) {
    // try to find the new layout
    jobsList =
      document.querySelector('div[data-view-name="jobs-home-infinite-jymbii-jobs-feed-module"]') ??
      document.querySelector('div[data-view-name="jobs-home-top-jymbii-jobs-feed-module"]') ??
      document.querySelector('div[data-view-name="feed-full-update"]') ??
      null;
    if (jobsList) parserVersion = 3;
  }
  if (!jobsList) {
    // new AI search results layout
    jobsList = document.querySelector('div[componentkey="SearchResultsMainContent"]') ?? null;
    if (jobsList) parserVersion = 4;
  }

  if (!jobsList) {
    return {
      jobs: [],
      listFound: false,
      elementsCount: 0,
    };
  }

  const parseElementV1 = (el: Element): ParsedJob | null => {
    const externalUrl = el.querySelector('.base-card__full-link')?.getAttribute('href');
    if (!externalUrl) return null;

    const externalId = externalUrl.split('?')[0].split('/').pop();
    if (!externalId) return null;

    const title = el.querySelector('.base-search-card__title')?.textContent?.trim();
    if (!title) return null;

    const companyName = el.querySelector('.base-search-card__subtitle')?.querySelector('a')?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el.querySelector('.search-entity-media')?.querySelector('img')?.getAttribute('data-delayed-url') || undefined;
    const rawLocation = el.querySelector('.job-search-card__location')?.textContent?.trim();

    const location = rawLocation
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '');

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      labels: [],
    };
  };
  const parseElementV2 = (el: Element): ParsedJob | null => {
    const jobCard = el.querySelector('div[data-job-id]'); // this is the new layout

    const externalId =
      el.getAttribute('data-occludable-job-id')?.trim() ?? jobCard?.getAttribute('data-job-id')?.trim();
    if (!externalId) return null;

    const externalUrlEl = el.querySelector('.job-card-list__title--link') ?? jobCard?.querySelector('a');
    if (!externalUrlEl) return null;
    const externalUrlPath = externalUrlEl.getAttribute('href')?.trim();
    const prefix = 'https://www.linkedin.com';
    let externalUrl = externalUrlPath?.startsWith(prefix)
      ? externalUrlPath
      : `https://www.linkedin.com${externalUrlPath}`;
    if (externalUrl.includes('jobs/search-results/?currentJobId')) {
      // this is a special case where the url contains the job id in the query params
      const urlParams = new URLSearchParams(externalUrl.split('?')[1]);
      externalUrl = `${prefix}/jobs/view/${urlParams.get('currentJobId')}`;
    }
    const title = (
      externalUrlEl.querySelector(':scope > strong') ??
      externalUrlEl.querySelector(':scope > span > strong') ??
      externalUrlEl.querySelector('.job-card-job-posting-card-wrapper__title > span > strong')
    )?.textContent?.trim();
    if (!title) return null;

    const companyName = (
      el.querySelector('.artdeco-entity-lockup__subtitle > span') ??
      el.querySelector('.artdeco-entity-lockup__subtitle')
    )?.textContent?.trim();
    if (!companyName) return null;

    const companyLogo =
      el.querySelector('.ivm-view-attr__img-wrapper')?.querySelector('img')?.getAttribute('src') || undefined;
    const rawLocation = el.querySelector('.artdeco-entity-lockup__caption')?.textContent?.trim();

    const location = rawLocation
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '');

    const jobType = rawLocation?.toLowerCase().includes('remote')
      ? 'remote'
      : rawLocation?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'onsite';

    const benefitTags: string[] =
      el
        .querySelector('.artdeco-entity-lockup__metadata')
        ?.textContent.trim()
        .split('·')
        .map((p) => p.trim()) ?? [];

    // bottom tags
    let footerTagEls = el.querySelectorAll('.job-card-list__footer-wrapper.job-card-container__footer-wrapper > li');
    if (!footerTagEls.length) {
      footerTagEls = el.querySelectorAll('.job-card-job-posting-card-wrapper__footer-items > li');
    }
    const footerTags = Array.from(footerTagEls)
      .map((el) => {
        // Remove children with class 'visually-hidden'
        const element = el as Element;
        element
          .querySelectorAll('.visually-hidden')
          .forEach((hiddenEl) => hiddenEl.parentElement?.removeChild(hiddenEl));

        return el.textContent?.trim().toLowerCase();
      })
      .filter((p) => !p.includes('viewed'));
    const tags = [...benefitTags, ...footerTags];

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      labels: [],
      jobType,
      tags,
    };
  };
  const parseElementV3 = (el: Element): ParsedJob | null => {
    const externalUrlEl = el.querySelector(':scope > a');
    if (!externalUrlEl) return null;
    const externalUrlRaw = externalUrlEl.getAttribute('href');
    // extract the currentJobId param if present
    if (!externalUrlRaw) return null;

    const externalId = new URL(externalUrlRaw).searchParams.get('currentJobId');
    if (!externalId) return null;

    const externalUrl = `https://www.linkedin.com/jobs/view/${externalId}`;

    const detailsEl = externalUrlEl.querySelector(':scope > div > div > div > div:first-child') as Element;
    const details = Array.from(detailsEl.querySelectorAll('p'))
      .map((p) => p.textContent?.trim() || '')
      .filter((p) => p.length > 1)
      // extract first line only
      .map((text) => text.split('\n')[0].trim());

    const title = details[0];
    if (!title) return null;

    const companyName = details[1];
    if (!companyName) return null;

    const location = details[2]
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '')
      .trim();
    const jobType = details[2]?.toLowerCase().includes('remote')
      ? 'remote'
      : details[2]?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'onsite';

    const tags = details.slice(3);

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location,
      jobType,
      labels: [],
      tags,
    };
  };
  const parseElementV4 = (el: Element): ParsedJob | null => {
    const card = el.querySelector(':scope > div > div > div > div');
    if (!card) return null;

    // Extract external URL and ID
    const getJobId = () => {
      const allEls = Array.from(el.querySelectorAll('div[data-view-tracking-scope]')) as Element[];
      const externalIds = allEls.map((element) => {
        const url = element.getAttribute('data-view-tracking-scope') ?? '';
        const json = JSON.parse(url);

        // Decode the buffer content
        if (json[0]?.breadcrumb?.content?.data) {
          const buffer = json[0].breadcrumb.content.data;
          const decodedString = new TextDecoder().decode(new Uint8Array(buffer));
          const decodedJson = JSON.parse(decodedString);

          // Extract the job ID from the objectUrn
          if (decodedJson.jobPosting?.objectUrn) {
            const urn = decodedJson.jobPosting.objectUrn;
            // URN format: "urn:li:fs_normalized_jobPosting:4323524962"
            const jobId = urn.split(':').pop();
            return jobId;
          }

          return decodedJson;
        }
      });

      return externalIds.filter((id): id is string => typeof id === 'string')[0];
    };

    const externalId = getJobId();
    if (!externalId) return null;

    // https://www.linkedin.com/jobs/view/4323524962/apply/?openSDUIApplyFlow=true&trackingId=nMwhn7gETJGszwQ55tFSGQ%3D%3D
    const externalUrl = `https://www.linkedin.com/jobs/view/${externalId}`;

    const detailsEl = card.querySelector(':scope > div:first-child > div:first-child');
    if (!detailsEl) {
      console.log('No detailsEl found');
      return null;
    }

    const titleEL = detailsEl.querySelector(':scope > div > p:first-child');
    let title = titleEL?.textContent?.trim() ?? null;
    if (titleEL?.querySelector(':scope > span[aria-hidden=true]')) {
      title = titleEL?.querySelector(':scope > span:not([aria-hidden])')?.textContent?.trim() ?? title;
    }
    const companyName = detailsEl.querySelector(':scope > div > div:nth-child(2)')?.textContent?.trim() ?? null;
    const location = detailsEl.querySelector(':scope > div > p:nth-child(3)')?.textContent?.trim() ?? null;

    if (!title || !companyName) {
      console.log('Missing title or companyName', { title, companyName });
      return null;
    }

    // check for remote/on-site/hybrid in location
    const jobType = location?.toLowerCase().includes('remote')
      ? 'remote'
      : location?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'onsite';

    // replace location strings
    const cleanedLocation = location
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '')
      .trim();

    let infoEl = card.querySelector(':scope > div:nth-child(2) > div:first-child');
    if (!infoEl) return null;
    let connectionsEl = card.querySelector(':scope > div:nth-child(2) > div:nth-child(2)');
    let metadataEl = card.querySelector(':scope > div:nth-child(2) > div:nth-child(3)');
    if (!metadataEl) {
      // this job is missing salary info so all elements are shifted up by one
      metadataEl = connectionsEl;
      connectionsEl = infoEl;
      infoEl = null;
    }

    const benefitTags = Array.from(infoEl?.querySelectorAll(':scope > div:first-child > p') ?? [])
      .map((el) => el.textContent?.trim() ?? '')
      .filter((text) => text.length > 1);

    const connectionTags = Array.from(connectionsEl?.querySelectorAll(':scope > p') ?? [])
      .map((el) => el.textContent?.trim() ?? '')
      .filter((text) => text.length > 1);

    const metadataTags = (Array.from(metadataEl?.querySelectorAll(':scope > p') ?? []) as Element[])
      .map((el) => {
        // Get only the text content directly inside the element, excluding inner children
        const textNodes = Array.from(el.childNodes)
          .filter((node) => node.nodeType === NodeType.TEXT_NODE)
          .map((node) => node.textContent?.trim() ?? '')
          .filter((text) => text.length > 0);

        return textNodes.join(' ').trim();
      })
      .filter((text) => text.length > 1);
    const metadataTags2 = (Array.from(metadataEl?.querySelectorAll(':scope > p') ?? []) as Element[])
      .flatMap((el) => Array.from(el.querySelectorAll(':scope > span:not([aria-hidden])')))
      .map((el) => el.textContent?.trim() ?? '')
      .filter((text) => text.length > 1);

    const tags = benefitTags.concat(connectionTags, metadataTags, metadataTags2);

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      location: cleanedLocation,
      jobType,
      labels: [],
      tags,
    };
  };

  let jobs: Array<ParsedJob | null> = [];
  let elementsCount = 0;
  if (parserVersion === 1) {
    const jobElements = Array.from(jobsList.querySelectorAll('li')) as Element[];
    elementsCount = jobElements.length;
    jobs = jobElements.map((el): ParsedJob | null => parseElementV1(el));
  } else if (parserVersion === 2) {
    const jobElements = Array.from(jobsList.querySelectorAll('li')) as Element[];
    elementsCount = jobElements.length;
    jobs = jobElements.map((el): ParsedJob | null => parseElementV2(el));
  } else if (parserVersion === 3) {
    const jobElements = Array.from(jobsList.querySelectorAll('div[data-view-name="job-card"]')) as Element[];
    elementsCount = jobElements.length;
    jobs = jobElements.map((el): ParsedJob | null => parseElementV3(el));
  } else if (parserVersion === 4) {
    const jobElements = Array.from(jobsList.querySelectorAll('div[data-view-name="job-search-job-card"]')) as Element[];
    elementsCount = jobElements.length;
    jobs = jobElements.map((el): ParsedJob | null => parseElementV4(el));
  }

  const validJobs = jobs
    .filter((job): job is ParsedJob => !!job)
    .map((job) => {
      // sanitize tags
      job.tags = job.tags?.map((tag) => tag.trim().replaceAll(/\n/g, '')).filter((tag) => !!tag);

      // try to parse the salary from the tags
      if (!job.salary && job.tags) {
        job.salary = job.tags.find(
          (tag) =>
            tag.toLowerCase().includes('/yr') ||
            tag.toLowerCase().includes('/year') ||
            tag.toLowerCase().includes('/yearly') ||
            tag.toLowerCase().includes('/hr') ||
            tag.toLowerCase().includes('/hour') ||
            tag.toLowerCase().includes('/hourly'),
        );

        // remove the salary from the tags
        if (job.salary) {
          job.tags = job.tags.filter((tag) => tag !== job.salary);
        }
      }

      return job;
    });

  console.log(JSON.stringify({ parserVersion, elementsCount, jobs }, null, 2));

  return {
    jobs: validJobs,
    listFound: jobsList !== null,
    elementsCount,
  };
}
