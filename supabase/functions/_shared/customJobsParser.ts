import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

import { z } from "npm:zod";
import turndown from "npm:turndown@7.1.2";

import { JobSiteParseResult } from "./jobListParser.ts";
import { JobDescriptionUpdates } from "./jobDescriptionParser.ts";
import { buildOpenAiClient, computeLlmApiCallCost } from "./openAI.ts";
import { zodResponseFormat } from "npm:openai@4.86.2/helpers/zod";

import { throwError } from "./errorUtils.ts";
import { ILogger } from "./logger.ts";

const OPEN_AI_MODEL_NAME = "gpt-5-nano";
// const OPEN_AI_MODEL_NAME = "gpt-4o-mini";

/**
 * Method used to parse jobs from custom pages.
 * Will use AI to extract the jobs from the HTML.
 */
export async function parseCustomJobs({
  siteId,
  html,
  url,
  openAiApiKey,
  logger,
}: {
  siteId: number;
  html: string;
  url: string;
  openAiApiKey: string;

  logger: ILogger;
}): Promise<JobSiteParseResult> {
  const { openAi, llmConfig } = buildOpenAiClient({
    apiKey: openAiApiKey,
    modelName: OPEN_AI_MODEL_NAME,
  });

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
    ];
    stripNodes(document.documentElement, nodesToRemove);
    stripAttributes(document.documentElement, /^(class|style|aria-.*|role)$/);
    const htmlContent = document.documentElement?.outerHTML ?? "";

    return `Extract the jobs listing from the HTML page below. Return the result as a JSON object matching the provided schema. If no jobs are found, return an empty array for the jobs field.
Here are some rules for the required output:
- The externalId field should be a unique identifier for the job, preferably from the job site. If not available, create one based on the job title and company name.
- The externalUrl field should be the direct URL to the job listing. It should be a fully qualified URL. If only a relative URL is available, prepend the domain name from the page URL: ${url}. Should never be an email address.
- The title field should be the job title.
- The companyName field should be the name of the company offering the job.
- The companyLogo field should be a URL to the company's logo, if available.
- The jobType field should indicate if the job is remote, hybrid, or onsite. If not specified, leave it empty.
- The location field should specify the job's location, if available.
- The salary field should specify the offered salary or salary range, if available. Always try to extract it if present.
- The tags field should include relevant tags or keywords associated with the job, if available. If you see "easy apply" on a job add it as a tab. Or if the job is sponsored.

Limit the number of jobs extracted to a maximum of 20. If more jobs are present, prioritize the most recent ones.
Try to extract all or as many jobs from the page as possible. And preserve the orther of the jobs as they appear on the page.

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

  const { cost, inputTokensUsed, outputTokensUsed } = computeLlmApiCallCost({
    llmConfig,
    response,
  });

  const listFound = !parseResult.errorMessage && parseResult.jobs.length > 0;
  if (!listFound) {
    logger.error(
      `Site ${siteId} - OpenAI reported an error: ${parseResult.errorMessage}`
    );
  }

  const jobs = parseResult.jobs.map((job) => ({
    ...job,
    // associate with the site
    siteId,
    labels: [],
  }));

  return {
    jobs,
    listFound,
    elementsCount: jobs.length,
    llmApiCallCost: {
      inputTokensUsed,
      outputTokensUsed,
      cost,
    },
  };
}
const JOB_SCHEMA = z.object({
  externalId: z.string(),
  externalUrl: z.string(),

  title: z.string().min(3).max(200),
  companyName: z.string().min(2).max(100),
  companyLogo: z.string().optional(),

  jobType: z.enum(["remote", "hybrid", "onsite"]).optional(),
  location: z.string().max(100).optional(),
  salary: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),

  // description: z.string().min(20).optional(),
});
const PARSE_JOBS_PAGE_SCHEMA = z.object({
  jobs: z.array(JOB_SCHEMA).min(0).max(50),
  errorMessage: z.string().max(500).optional(),
});
const SYSTEM_PROMPT = `You are an expert web scraper specialized in extracting job listings from HTML pages. 
Your task is to analyze the provided HTML content and identify job listings, extracting relevant details for each job.
If you cannot extract the information due to the HTML being a login page, CAPTCHA, or any other access restriction, respond with an empty result and an appropriate errorMessage.
`;

/**
 * Parse jobs description from a custom job site.
 * Will use AI to extract the description from the HTML.
 */
export async function parseCustomJobDescription({
  html,
  openAiApiKey,
  logger,
}: {
  html: string;
  openAiApiKey: string;
  logger: ILogger;
}): Promise<JobDescriptionUpdates> {
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
Here are some rules for the required output:
- The description field should contain the full job description, including responsibilities, requirements, benefits, and any other relevant information.
- If the job description cannot be found due to the HTML being a login page, CAPTCHA, or any other access restriction, return an empty result and provide an appropriate errorMessage.
- The tags field should include relevant tags or keywords associated with the job, if available. Limit to maximum 10 tags.
Don't include the location, salary or job type as tags.
Try to add seniority level as tag if available (e.g. junior, mid-level, senior, lead, principal).

Here is the HTML page turned into markdown:
"""
${htmlContent}
"""`;
  };

  const { openAi, llmConfig } = buildOpenAiClient({
    apiKey: openAiApiKey,
    modelName: OPEN_AI_MODEL_NAME,
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

  const { cost, inputTokensUsed, outputTokensUsed } = computeLlmApiCallCost({
    llmConfig,
    response,
  });

  const parsingFailed = !!parseResult.errorMessage;
  if (parsingFailed) {
    logger.error(`OpenAI reported an error: ${parseResult.errorMessage}`);
  }

  logger.info(
    `Job description parsed, LLM cost: $${cost.toFixed(
      6
    )} (input tokens: ${inputTokensUsed}, output tokens: ${outputTokensUsed})`
  );

  return {
    description: parsingFailed
      ? parseResult.errorMessage
      : parseResult.description,
    tags: parsingFailed ? undefined : parseResult.tags,
    llmApiCallCost: {
      cost,
      inputTokensUsed,
      outputTokensUsed,
    },
  };
}
const PARSE_JOB_DESCRIPTION_SCHEMA = z.object({
  description: z.string().min(20).optional(),
  tags: z.array(z.string().max(50)).optional(),
  errorMessage: z.string().max(500).optional(),
});
const JOB_DESCRIPTION_SYSTEM_PROMPT = `You are an expert web scraper specialized in extracting job description from HTML pages. 
Your task is to analyze the provided HTML content and extract the job description.
The output has to be markdown formatted text, suitable for display in a web application.
If you cannot extract the information due to the HTML being a login page, CAPTCHA, or any other access restriction, respond with an empty result and an appropriate errorMessage.
`;
const turndownService = new turndown({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

// function minifyHtml(html: string): string {
//   return html
//     .replace(/<!--[\s\S]*?-->/g, "") // comments
//     .replace(/\s+/g, " ") // collapse whitespace
//     .replace(/>\s+</g, "><") // trim between tags
//     .trim();
// }

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
