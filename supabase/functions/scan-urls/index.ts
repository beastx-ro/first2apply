import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobsListUrl } from "../_shared/jobListParser.ts";
import { JobSite, Link, SiteProvider } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { checkUserSubscription } from "../_shared/subscription.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";

import {
  EdgeFunctionAuthorizedContext,
  getEdgeFunctionContext,
} from "../_shared/edgeFunctions.ts";

type HtmlParseRequest = {
  linkId: number;
  content: string;
  maxRetries?: number;
  retryCount?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "scan-urls",
  });
  try {
    const context = await getEdgeFunctionContext({
      logger,
      req,
      checkAuthorization: true,
    });
    const { supabaseClient, user } = context;

    const body = await req.json();
    const htmls: Array<HtmlParseRequest> = body.htmls;
    if (htmls.length === 0) {
      return new Response(JSON.stringify({ newJobs: [] }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // fetch links from db
    const linkIds = htmls.map((html) => html.linkId);
    const { data: linksData, error: linksError } = await supabaseClient
      .from("links")
      .select("*")
      .in("id", linkIds);
    if (linksError) throw new Error(linksError.message);
    const links = linksData as Link[];
    logger.info(`found ${links.length} links`);

    const userId = user.id;
    const { subscriptionHasExpired } = await checkUserSubscription({
      userId,
      ...context,
    });
    if (subscriptionHasExpired) {
      logger.info(`subscription has expired for user ${userId}`);
      return new Response(JSON.stringify({ newJobs: [], parseFailed: false }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // list all job sites from db
    const { data: jobSitesData, error: jobSitesError } = await supabaseClient
      .from("sites")
      .select("*");
    if (jobSitesError) throw new Error(jobSitesError.message);
    const allJobSites = jobSitesData ?? [];

    // parse htmls and match them with links
    const parseAndSaveJobs = async () => {
      let parseFailed = false;
      const isLastRetry = htmls.every(
        (html) => html.retryCount === html.maxRetries
      );
      const parsedJobs = await Promise.all(
        htmls.map(async (html) => {
          const { jobs, currentUrlParseFailed } = await parseHtmlToJobsList({
            html,
            allJobSites,
            isLastRetry,
            links,
            context,
          });
          if (currentUrlParseFailed) {
            parseFailed = true;
          }

          return jobs;
        })
      ).then((r) => r.flat());

      const { data: upsertedJobs, error: insertError } = await supabaseClient
        .from("jobs")
        .upsert(
          parsedJobs.map((job) => ({ ...job, status: "processing" as const })),
          { onConflict: "user_id, externalId", ignoreDuplicates: true }
        )
        .select("*");
      if (insertError) throw new Error(insertError.message);

      const newJobs =
        upsertedJobs?.filter((job) => job.status === "processing") ?? [];
      logger.info(`found ${newJobs.length} new jobs`);

      return { newJobs, parseFailed };
    };

    const { newJobs, parseFailed } = await parseAndSaveJobs();

    return new Response(JSON.stringify({ newJobs, parseFailed }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        // until this is fixed: https://github.com/supabase/functions-js/issues/45
        // we have to return 200 and handle the error on the client side
        // status: 500,
      }
    );
  }
});

async function parseHtmlToJobsList({
  html,
  allJobSites,
  isLastRetry,
  links,
  context,
}: {
  html: HtmlParseRequest;
  allJobSites: JobSite[];
  isLastRetry: boolean;
  links: Link[];
  // dependencies
  context: EdgeFunctionAuthorizedContext;
}) {
  const { logger, supabaseClient } = context;
  const link = links.find((link) => link.id === html.linkId);
  // ignore links that are not in the db
  if (!link) {
    logger.error(`link not found: ${html.linkId}`);
    return { jobs: [], currentUrlParseFailed: false };
  }
  // ignore links for sites that are deprecated
  const targetSite = allJobSites.find((site) => site.id === link.site_id);
  if (targetSite?.deprecated) {
    logger.info(`skip parsing for deprecated site ${targetSite.name}`);
    return { jobs: [], currentUrlParseFailed: false };
  }

  const {
    jobs,
    site,
    parseFailed: currentUrlParseFailed,
  } = await parseJobsListUrl({
    allJobSites,
    link,
    html: html.content,
    context,
  });

  logger.info(
    `[${site.provider}] found ${jobs.length} jobs from link ${link.id}`
  );

  // if the parsing failed, save the html dump for debugging
  if (currentUrlParseFailed) {
    await handleParsingFailureForLink({
      link,
      html,
      site,
      isLastRetry,
      context,
    });
  } else {
    await handleParsingSuccessForLink({
      link,
      site,
      context,
    });
  }

  // add the link id to the jobs
  jobs.forEach((job) => {
    job.link_id = link.id;
  });

  return { jobs, currentUrlParseFailed };
}

async function handleParsingFailureForLink({
  link,
  html,
  site,
  isLastRetry,
  context,
}: {
  link: Link;
  html: HtmlParseRequest;
  site: JobSite;
  isLastRetry: boolean;
  context: EdgeFunctionAuthorizedContext;
}) {
  const { logger, supabaseClient } = context;

  // increment the failure count
  const { error: linkUpdateError } = await supabaseClient
    .from("links")
    .update({ scrape_failure_count: link.scrape_failure_count + 1 })
    .eq("id", link.id);
  if (linkUpdateError) {
    logger.error(linkUpdateError.message);
    return;
  }

  const isLinkInErrorMode = link.scrape_failure_count >= 5;
  if (
    isLastRetry &&
    site.provider !== SiteProvider.echojobs &&
    !isLinkInErrorMode
  ) {
    logger.error(
      `[${site.provider}] no jobs found for ${link.id}, this might indicate a problem with the parser`,
      {
        url: link.url,
        site: site.provider,
      }
    );

    // save the html dump for debugging
    await supabaseClient
      .from("html_dumps")
      .insert([{ url: link.url, html: html.content }]);
  }
}

async function handleParsingSuccessForLink({
  link,
  site,
  context,
}: {
  link: Link;
  site: JobSite;
  context: EdgeFunctionAuthorizedContext;
}) {
  const { logger, supabaseClient } = context;
  // when the parsing went ok, reset the failure count
  await supabaseClient
    .from("links")
    .update({
      scrape_failure_count: 0,
      last_scraped_at: new Date(),
      scrape_failure_email_sent: false,
    })
    .eq("id", link.id);

  logger.info(
    `[${site.provider}] successfully parsed jobs list for link ${link.id}`,
    {
      site: site.provider,
    }
  );
}
