import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

import { z } from "npm:zod";
import turndown from "npm:turndown@7.1.2";

import { JobSiteParseResult, ParsedJob } from "./jobListParser.ts";
import { JobDescriptionUpdates } from "./jobDescriptionParser.ts";
import { buildOpenAiClient, logAiUsage } from "./openAI.ts";
import { zodResponseFormat } from "npm:openai@6.7.0/helpers/zod";

import { throwError } from "./errorUtils.ts";
import { ILogger } from "./logger.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1/dist/module/index.js";
import { DbSchema, User } from "./types.ts";
import { denoHashString } from "./deno.ts";

/**
 * Method used to parse jobs from custom pages.
 * Will use AI to extract the jobs from the HTML.
 */
export async function parseCustomJobs({
  siteId,
  html,
  url,
  user,
  ...context
}: {
  siteId: number;
  html: string;
  url: string;
  user: User;

  // dependencies
  logger: ILogger;
  supabaseAdminClient: SupabaseClient<DbSchema, "public">;
}): Promise<JobSiteParseResult> {
  const { logger } = context;

  const { openAi, llmConfig } = buildOpenAiClient({
    modelName: "o3-mini",
    ...context,
  });

  // helper methods
  const generateUserPrompt = () => {
    const document = new DOMParser().parseFromString(html, "text/html");
    if (!document || !document.documentElement)
      throw new Error("Could not parse html");

    // save some info before stripping
    const headerInfo = extractHeaderInfo(document.documentElement);
    logger.info(
      `page title: ${headerInfo.title}, description: ${headerInfo.metaDescription}, favicon: ${headerInfo.faviconUrl}`
    );

    // strip away nodes that are not relevant to the LLM
    const nodesToRemove = [
      "head",
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      "iframe",
    ];
    stripNodes(document.documentElement, nodesToRemove);
    stripAttributes(document.documentElement, /^(class|style|aria-.*|role)$/);
    const htmlContent = document.documentElement?.outerHTML ?? "";

    return `Extract the jobs listing from the HTML page below. Return the result as a JSON object matching the provided schema. If no jobs are found, return an empty array for the jobs field.
Here are some rules for the required output:
- The externalId field should be a unique identifier for the job, preferably from the job site.
  Try to extract it from the job URL or any data attributes. 
  If not available, create one based on the job title and company name.
- The externalUrl field should be the direct URL to the job listing. It should be a fully qualified URL. If only a relative URL is available, prepend the domain name from the page URL: ${url}. Should never be an email address.
- The title field should be the job title.
- The companyName field should be the name of the company offering the job.
- The companyLogo field should be a URL to the company's logo, if available. If not available, try to use the site favicon URL: ${
      headerInfo.faviconUrl
    }. If the logo URL is relative, prepend the domain name from the page URL: ${url}.
- The jobType field should indicate if the job is remote, hybrid, or onsite. If not specified, leave it empty.
- The location field should specify the job's location, if available. 
    Add the full location as provided including street, city, state, country if available. If only "remote" is mentioned, leave the location empty and set jobType to "remote".
- The salary field should specify the offered salary or salary range, if available. Always try to extract it if present. If there are other benefits mentioned (e.g. stock options, bonuses), do not include them in the salary field, but put them as tags.
- The tags field should include relevant tags or keywords associated with the job, if available. If you see "easy apply" on a job add it as a tag. Or if the job is sponsored.

Limit the number of jobs extracted to a maximum of 20. If more jobs are present, prioritize the most recent ones.
Try to extract all or as many jobs from the page as possible. And preserve the order of the jobs as they appear on the page.

Here is the page header info:
${JSON.stringify(headerInfo)}

Here is the HTML page:
"""
${htmlContent}
"""`;
  };

  const response = await openAi.chat.completions.create({
    model: llmConfig.model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: generateUserPrompt(),
      },
    ],
    max_completion_tokens: 50_000,
    response_format: zodResponseFormat(
      PARSE_JOBS_PAGE_SCHEMA,
      "ParseJobsPageResponse"
    ),
  });

  const choice = response.choices[0];
  if (choice.finish_reason !== "stop") {
    throw new Error(`OpenAI response did not finish: ${choice.finish_reason}`);
  }

  const parseResult = PARSE_JOBS_PAGE_SCHEMA.parse(
    JSON.parse(choice.message.content ?? throwError("missing content"))
  );

  await logAiUsage({
    forUserId: user.id,
    llmConfig,
    response,
    ...context,
  });

  const listFound = !parseResult.errorMessage && parseResult.jobs.length > 0;
  if (!listFound) {
    logger.error(
      `Site ${siteId} - OpenAI reported an error: ${parseResult.errorMessage}`
    );
  }

  const jobs = await Promise.all(
    parseResult.jobs.map(
      async (job): Promise<ParsedJob> => ({
        // hash the url to create a stable externalId if not provided
        externalId: await denoHashString(job.externalUrl),
        externalUrl: job.externalUrl,
        title: job.title,
        companyName: job.companyName,
        companyLogo: job.companyLogo || undefined,
        jobType: job.jobType || undefined,
        location: job.location || undefined,
        salary: job.salary || undefined,
        tags: job.tags || undefined,
        // associate with the site
        siteId,
        labels: [],
      })
    )
  ).then((jobs) => {
    // filter out invalid jobs
    return jobs.filter((job) => !!job.externalId && !!job.externalUrl);
  });

  return {
    jobs,
    listFound,
    elementsCount: jobs.length,
  };
}
const JOB_SCHEMA = z.object({
  externalUrl: z.string(),

  title: z.string().min(3).max(200),
  companyName: z.string().min(2).max(100),
  companyLogo: z.string().optional().nullable(),

  jobType: z.enum(["remote", "hybrid", "onsite"]).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().nullable(),

  // description: z.string().min(20).optional().nullable(),
});
const PARSE_JOBS_PAGE_SCHEMA = z.object({
  jobs: z.array(JOB_SCHEMA).min(0).max(50),
  errorMessage: z.string().max(500).optional().nullable(),
});
const SYSTEM_PROMPT = `You are an expert web scraper specialized in extracting job listings from HTML pages. 
Your task is to analyze the provided HTML content and identify job listings, extracting relevant details for each job.
If you cannot extract the information due to the HTML being a login page, CAPTCHA, or any other access restriction, respond with an empty result and an appropriate errorMessage.

The externalUrl ideally should point to a dedicated page, not the same listing page and should be unique per job. It's the most important field to extract.
If the job description mentions a another URL where to apply, use that as externalUrl.

When composing the externalUrl or companyLogo with relative URLs, ensure to make it relative to the URL of the scraped page, not just the domain.
Here are some common examples of externalUrls from different popular job sites:
- talent.com: https://www.talent.com/view?id=1234567890abcdef
- linkedin.com: https://www.linkedin.com/jobs/view/1234567890/
- indeed.com: https://www.indeed.com/viewjob?jk=abcdef1234567890
- glassdoor.com: https://www.glassdoor.com/job-listing/software-engineer-google-JV_IC1234567_KO0,17_KE18,24.htm?jl=1234567890
- monster.com: https://www.monster.com/jobs/search/?q=Software-Engineer&where=Remote&jobid=1234567890
- google.com: https://www.google.com/about/careers/applications/jobs/results/132525933222339270-software-engineer-iii-aiml
`;

/**
 * Parse jobs description from a custom job site.
 * Will use AI to extract the description from the HTML.
 */
export async function parseCustomJobDescription({
  html,
  user,
  ...context
}: {
  html: string;
  user: User;

  // dependencies
  logger: ILogger;
  supabaseAdminClient: SupabaseClient<DbSchema, "public">;
}): Promise<JobDescriptionUpdates> {
  const { logger } = context;

  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) throw new Error("Could not parse html");

  // helper methods
  const generateUserPrompt = () => {
    const document = new DOMParser().parseFromString(html, "text/html");
    if (!document || !document.documentElement)
      throw new Error("Could not parse html");

    // strip away nodes that are not relevant to the LLM
    const nodesToRemove = [
      "head",
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      "img",
      "form",
    ];
    stripNodes(document.documentElement, nodesToRemove);
    stripAttributes(document.documentElement, /^(class|style|aria-.*|role)$/);
    const htmlContent = turndownService.turndown(
      document.documentElement?.outerHTML ?? ""
    );

    return `Extract the job description from the HTML page below. Return the result as a JSON object matching the provided schema.
Here is the HTML page turned into markdown:
"""
${htmlContent}
"""`;
  };

  const { openAi, llmConfig } = buildOpenAiClient({
    modelName: "gpt-4o-mini",
    ...context,
  });

  const response = await openAi.chat.completions.create({
    model: llmConfig.model,
    messages: [
      {
        role: "system",
        content: JOB_DESCRIPTION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: generateUserPrompt(),
      },
    ],
    max_completion_tokens: 10_000,
    response_format: zodResponseFormat(
      PARSE_JOB_DESCRIPTION_SCHEMA,
      "ParseJobDescriptionResponse"
    ),
  });

  const choice = response.choices[0];
  if (choice.finish_reason !== "stop") {
    throw new Error(`OpenAI response did not finish: ${choice.finish_reason}`);
  }

  const parseResult = PARSE_JOB_DESCRIPTION_SCHEMA.parse(
    JSON.parse(choice.message.content ?? throwError("missing content"))
  );

  await logAiUsage({
    forUserId: user.id,
    llmConfig,
    response,
    ...context,
  });

  let updates: JobDescriptionUpdates = {};
  const parsingFailed = !!parseResult.errorMessage;
  if (parsingFailed) {
    const errorMessage = parseResult.errorMessage ?? "Unknown error";
    logger.error(`OpenAI reported an error: ${errorMessage}`);

    updates = {
      description: `Failed to parse job description: ${errorMessage}`,
    };
  } else {
    updates = {
      description: parseResult.description?.trim(),
      salary: parseResult.salary?.trim(),
      tags: parseResult.tags?.map((tag) => tag.trim()),
    };
  }

  return updates;
}
const PARSE_JOB_DESCRIPTION_SCHEMA = z.object({
  description: z.string().min(20).optional().nullable(),
  salary: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).optional().nullable(),
  errorMessage: z.string().max(500).optional().nullable(),
});
const JOB_DESCRIPTION_SYSTEM_PROMPT = `You are an expert web scraper specialized in extracting job description from HTML pages. 
Your task is to analyze the provided HTML content and extract the job description.
The output has to be markdown formatted text, suitable for display in a web application.
If you cannot extract the information due to the HTML being a login page, CAPTCHA, or any other access restriction, respond with an empty result and an appropriate errorMessage.

Here are some rules for the required output:
- The description field should contain the full job description, including responsibilities, requirements, benefits, and any other relevant information.
- If the job description cannot be found due to the HTML being a login page, CAPTCHA, or any other access restriction, return an empty result and provide an appropriate errorMessage.
- The tags field should include relevant tags or keywords associated with the job, if available. Limit to maximum 10 tags.
- If there are other benefits mentioned in the salary (e.g. stock options, bonuses), do not include them in the salary field, but put them as tags.
Don't include the location, salary or job type as tags.
Try to add seniority level as tag if available (e.g. junior, mid-level, senior, lead, principal).
`;
const turndownService = new turndown({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

function stripNodes(root: Element, selectors: string[]) {
  selectors.forEach((selector) => {
    const elements = root.querySelectorAll(selector);
    elements.forEach((el) => el.parentNode?.removeChild(el));
  });
}
function stripAttributes(root: Element, dropAttrs: RegExp) {
  const walker = root.querySelectorAll("*");
  const elements = Array.from(walker) as Element[];
  elements.forEach((el: Element) => {
    [...el.attributes].forEach((attr) => {
      if (dropAttrs.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
}

function extractHeaderInfo(document: Element) {
  const title = document.querySelector("title")?.textContent ?? "";
  const metaDescription =
    document
      .querySelector("meta[name='description']")
      ?.getAttribute("content") ?? "";

  // try to grab the favicon with the highest resolution
  const favicons = Array.from(
    document.querySelectorAll(
      "link[rel~='icon'], link[rel~='shortcut icon']"
    ) as unknown as Element[]
  )
    .map((el) => ({
      href: el.getAttribute("href") ?? "",
      sizes: el.getAttribute("sizes") ?? "",
    }))
    .filter((el) => el.href);
  let faviconUrl;
  if (favicons.length > 0) {
    favicons.sort((a, b) => {
      const sizeA = parseInt(a.sizes.split("x")[0]) || 0;
      const sizeB = parseInt(b.sizes.split("x")[0]) || 0;
      return sizeB - sizeA;
    });
    faviconUrl = favicons[0].href;
  }

  return { title, metaDescription, faviconUrl };
}
