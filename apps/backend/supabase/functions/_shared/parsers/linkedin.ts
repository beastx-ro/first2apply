import { WebPageRuntimeData } from '@first2apply/core';
import { DOMParser, Element, NodeType } from 'deno-dom-wasm';

import { ILogger } from '../logger.ts';
import { JobSiteParseResult, ParsedJob } from '../parsers/parserTypes.ts';

/**
 * Method used to parse a linkedin job page.
 */
export function parseLinkedInJobs({
  siteId,
  html,
  webPageRuntimeData,
  logger,
}: {
  siteId: number;
  html: string;
  webPageRuntimeData?: WebPageRuntimeData;
  logger: ILogger;
}): JobSiteParseResult {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error('Could not parse html');

  // check if the list is empty first
  const noResultsNode =
    document.querySelector('.no-results') ||
    document.querySelector('.jobs-search-no-results-banner') ||
    document.querySelector('.jobs-semantic-search__no-results') ||
    document.querySelector('svg#empty-room-small');
  if (noResultsNode) {
    return {
      jobs: [],
      listFound: true,
      elementsCount: 0,
    };
  }

  let parserVersion = 1;
  let jobsList = document.querySelector('.jobs-search__results-list');
  let jobElements: Element[] = jobsList ? (Array.from(jobsList.querySelectorAll('li')) as Element[]) : [];
  let listFound = jobsList !== null && jobElements.length > 0;

  logger.info(`webPageRuntimeData data provided: ${webPageRuntimeData ? 'yes' : 'no'}`);

  if (!listFound) {
    // check if the user is logged into LinkedIn because then it has a totally different layout
    jobsList =
      document.querySelector('ul li[data-occludable-job-id]')?.closest('ul') ??
      document.querySelector('.scaffold-layout__list ul') ??
      null;

    if (jobsList) {
      parserVersion = 2;
      jobElements = Array.from(jobsList.querySelectorAll('li')) as Element[];
      listFound = jobElements.length > 0;
    }
  }
  if (!listFound) {
    // try to find the new layout
    jobsList =
      document.querySelector('div[data-view-name="jobs-home-infinite-jymbii-jobs-feed-module"]') ??
      document.querySelector('div[data-view-name="jobs-home-top-jymbii-jobs-feed-module"]') ??
      document.querySelector('div[data-view-name="feed-full-update"]') ??
      null;
    if (jobsList) {
      parserVersion = 3;
      jobElements = Array.from(jobsList.querySelectorAll('div[data-view-name="job-card"]')) as Element[];
      listFound = jobElements.length > 0;
    }
  }
  if (!listFound) {
    // new AI search results layout
    jobsList = document.querySelector('div[componentkey="SearchResultsMainContent"]') ?? null;

    if (jobsList) {
      parserVersion = 4;
      jobElements = Array.from(jobsList.querySelectorAll('div[data-view-tracking-scope]')) as Element[];
      listFound = jobElements.length > 0;
    }
  }
  if (!listFound) {
    // v2 of the new AI search results layout
    jobsList = document.querySelector('div[componentkey="SearchResultsMainContent"]') ?? null;

    if (jobsList) {
      parserVersion = 5;
      jobElements = Array.from(
        jobsList.querySelectorAll('div[componentkey^="job-card-component-ref"] > div[componentkey]'),
      ) as Element[];
      listFound = jobElements.length > 0;
    }
  }
  // Pre-built map of componentKey UUID -> job ID, populated from RSC hydration data for V6
  const jobIdMap = new Map<string, string>();
  if (!listFound) {
    // v3 of the new AI search results layout (UUID componentkeys instead of job-card-component-ref)
    jobsList = document.querySelector('div[componentkey="SearchResultsMainContent"]') ?? null;

    if (jobsList) {
      // Evaluate a JS string containing `window.__como_rehydration__ = [...]`
      // into the actual string array. The array uses single-quoted JS strings
      // so it can't be parsed as JSON — we use `new Function` instead.
      const evalRehydrationScript = (raw: string): string[] => {
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        if (start === -1 || end === -1) return [];

        return new Function(`return ${raw.substring(start, end + 1)};`)();
      };

      let rehydrationStrings: string[] = [];
      const rehydrateScript = document.querySelector('script#rehydrate-data');
      if (rehydrateScript) {
        logger.info('Parsing rehydration data from DOM');
        rehydrationStrings = evalRehydrationScript(rehydrateScript.textContent ?? '');
      } else if (webPageRuntimeData?.linkedin) {
        logger.info('Using rehydration data from webPageRuntimeData');
        rehydrationStrings = evalRehydrationScript(webPageRuntimeData.linkedin?.comoRehydration as string);
      }

      for (const chunk of rehydrationStrings) {
        // Each chunk contains multiple RSC rows separated by \n
        // A job card row has both componentKey UUID and JobCardFrameworkImplDismissedState_ID
        const rows = chunk.split('\n');
        for (const row of rows) {
          const keyMatch = row.match(/"componentKey":"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/);
          const idMatch = row.match(/JobCardFrameworkImplDismissedState_(\d+)/);
          if (keyMatch && idMatch) {
            jobIdMap.set(keyMatch[1], idMatch[1]);
          }
        }
      }

      parserVersion = 6;
      jobElements = Array.from(
        jobsList.querySelectorAll('div[role="button"][componentkey] > div[componentkey]'),
      ).filter((el) => {
        const uuid = (el as Element).getAttribute('componentkey');
        return uuid && jobIdMap.has(uuid);
      }) as Element[];

      listFound = jobElements.length > 0;
    }
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
      tags: [],
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
    if (!card) {
      return null;
    }

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
    if (!externalId) {
      logger.error('No externalId found');
      return null;
    }

    const externalUrl = `https://www.linkedin.com/jobs/view/${externalId}`;

    const detailsEl = card.querySelector(':scope > div:first-child > div:first-child');
    if (!detailsEl) {
      logger.error('No detailsEl found');
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
      logger.error('Missing title or companyName', { title, companyName });
      return null;
    }

    const companyLogo = card.querySelector(':scope figure img')?.getAttribute('src') || undefined;

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
      companyLogo,
      location: cleanedLocation,
      jobType,
      labels: [],
      tags,
    };
  };
  const parseElementV5 = (el: Element): ParsedJob | null => {
    const externalUrlId = el.getAttribute('componentkey')?.trim().replace('job-card-component-ref-', '');
    if (!externalUrlId) {
      logger.error('No externalUrlId found');
      return null;
    }
    const externalUrl = `https://www.linkedin.com/jobs/view/${externalUrlId}`;

    const mainInfoEl = el.querySelector(
      ':scope > div > div > div:first-child > div:first-child > div:first-child',
    ) as Element;
    if (!mainInfoEl) {
      logger.error('No mainInfoEl found');
      return null;
    }

    const titleEl = mainInfoEl.querySelector(':scope > p:first-child');
    if (!titleEl) {
      logger.error('No titleEl found');
      return null;
    }
    const rawTitle =
      titleEl.childElementCount > 1
        ? (titleEl.querySelector(':scope > span:not([aria-hidden])')?.textContent?.trim() ?? null)
        : (titleEl.textContent?.trim() ?? null);
    const title = rawTitle?.replace('(Verified job)', '').trim() ?? null;

    const companyName = mainInfoEl.querySelector(':scope > div:nth-child(2) > p')?.textContent?.trim();
    const locationAndType = mainInfoEl.querySelector(':scope > p:nth-child(3)')?.textContent?.trim();

    if (!title || !companyName) {
      logger.error('Missing title or companyName', { title, companyName });
      return null;
    }

    const location = locationAndType
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '')
      .trim();

    const jobType = locationAndType?.toLowerCase().includes('remote')
      ? 'remote'
      : locationAndType?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'onsite';

    const companyLogo =
      el.querySelector(':scope > div:first-child figure:first-child img')?.getAttribute('src') || undefined;

    // can have 1 or 2 divs here, need to check the second one for the tags if it exists or else check the first one
    const metadataEl = el.querySelector(':scope > div > div > div:nth-child(2)');
    const tagEls = Array.from(metadataEl?.querySelectorAll(':scope > div p') ?? []) as Element[];
    const tags = tagEls
      .map((tagEl) => {
        if (tagEl.childElementCount > 1) {
          // if there are multiple spans, get the text content of the one that is not visually hidden
          const visibleSpan = (Array.from(tagEl.querySelectorAll('span')) as Element[]).find(
            (span) => span.getAttribute('aria-hidden') !== 'true',
          );
          return visibleSpan?.textContent?.trim() || tagEl.textContent?.trim() || '';
        }

        return tagEl.textContent?.trim() ?? '';
      })
      .filter((text) => text.length > 1);

    return {
      siteId,
      externalId: externalUrlId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      jobType,
      labels: [],
      tags,
    };
  };
  const parseElementV6 = (el: Element): ParsedJob | null => {
    const uuid = el.getAttribute('componentkey')?.trim();
    if (!uuid) {
      logger.error('No componentkey found');
      return null;
    }

    const externalId = jobIdMap.get(uuid);
    if (!externalId) {
      logger.error('No job ID found in hydration data for component', { uuid });
      return null;
    }
    const externalUrl = `https://www.linkedin.com/jobs/view/${externalId}`;

    // Same DOM structure as V5
    const mainInfoEl = el.querySelector(
      ':scope > div > div > div:first-child > div:first-child > div:first-child',
    ) as Element;
    if (!mainInfoEl) {
      logger.error('No mainInfoEl found');
      return null;
    }

    const titleEl = mainInfoEl.querySelector(':scope > p:first-child');
    if (!titleEl) {
      logger.error('No titleEl found');
      return null;
    }
    const rawTitle =
      titleEl.childElementCount > 1
        ? (titleEl.querySelector(':scope > span:not([aria-hidden])')?.textContent?.trim() ?? null)
        : (titleEl.textContent?.trim() ?? null);
    const title = rawTitle?.replace('(Verified job)', '').trim() ?? null;

    const companyName = mainInfoEl.querySelector(':scope > div:nth-child(2) > p')?.textContent?.trim();
    const locationAndType = mainInfoEl.querySelector(':scope > p:nth-child(3)')?.textContent?.trim();

    if (!title || !companyName) {
      logger.error('Missing title or companyName', { title, companyName });
      return null;
    }

    const location = locationAndType
      ?.replace(/\(remote\)/i, '')
      .replace(/\(on-site\)/i, '')
      .replace(/\(hybrid\)/i, '')
      .trim();

    const jobType = locationAndType?.toLowerCase().includes('remote')
      ? 'remote'
      : locationAndType?.toLowerCase().includes('hybrid')
        ? 'hybrid'
        : 'onsite';

    const companyLogo =
      el.querySelector(':scope > div:first-child figure:first-child img')?.getAttribute('src') || undefined;

    const metadataEl = el.querySelector(':scope > div > div > div:nth-child(2)');
    const tagEls = Array.from(metadataEl?.querySelectorAll(':scope > div p') ?? []) as Element[];
    const tags = tagEls
      .map((tagEl) => {
        if (tagEl.childElementCount > 1) {
          const visibleSpan = (Array.from(tagEl.querySelectorAll('span')) as Element[]).find(
            (span) => span.getAttribute('aria-hidden') !== 'true',
          );
          return visibleSpan?.textContent?.trim() || tagEl.textContent?.trim() || '';
        }
        return tagEl.textContent?.trim() ?? '';
      })
      .filter((text) => text.length > 1);

    return {
      siteId,
      externalId,
      externalUrl,
      title,
      companyName,
      companyLogo,
      location,
      jobType,
      labels: [],
      tags,
    };
  };

  let jobs: Array<ParsedJob | null> = [];
  if (parserVersion === 1) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV1(el));
  } else if (parserVersion === 2) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV2(el));
  } else if (parserVersion === 3) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV3(el));
  } else if (parserVersion === 4) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV4(el));
  } else if (parserVersion === 5) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV5(el));
  } else if (parserVersion === 6) {
    jobs = jobElements.map((el): ParsedJob | null => parseElementV6(el));
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

  logger.info(
    `Parsed LinkedIn jobs with parser version ${parserVersion}. Found ${validJobs.length} valid jobs out of ${jobElements.length} elements.`,
  );

  return {
    jobs: validJobs,
    listFound,
    elementsCount: jobElements.length,
  };
}
