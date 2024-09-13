import {
  SupabaseClient,
  createClient,
} from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobsListUrl } from "../_shared/jobListParser.ts";
import { DbSchema, Link } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { checkUserSubscription } from "../_shared/subscription.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { ILogger } from "../_shared/logger.ts";

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

  const logger = createLoggerWithMeta({});
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const supabaseClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: getUserError } =
      await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

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

    const userId = links?.[0]?.user_id;
    const { subscriptionHasExpired } = await checkUserSubscription({
      supabaseClient,
      userId,
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
    let parseFailed = false;
    const isLastRetry = htmls.every(
      (html) => html.retryCount === html.maxRetries
    );
    const parsedJobs = await Promise.all(
      htmls.map(async (html) => {
        const link = links?.find((link) => link.id === html.linkId);
        // ignore links that are not in the db
        if (!link) {
          logger.error(`link not found: ${html.linkId}`);
          return [];
        }
        const {
          jobs,
          site,
          parseFailed: currentUrlParseFailed,
        } = await parseJobsListUrl({
          logger,
          allJobSites,
          url: link.url,
          html: html.content,
          isLastRetry,
        });

        logger.info(
          `[${site.provider}] found ${jobs.length} jobs from link ${link.id}`
        );

        // if the parsing failed, save the html dump for debugging
        parseFailed = currentUrlParseFailed;
        if (currentUrlParseFailed && isLastRetry) {
          await handleParsingFailureForLink({
            logger,
            supabaseClient,
            link,
            html,
          });
        }

        // if the parsing went ok, reset the failure count
        if (!currentUrlParseFailed) {
          await supabaseClient
            .from("links")
            .update({
              scrape_failure_count: 0,
              last_scraped_at: new Date(),
              scrape_failure_email_sent: false,
            })
            .eq("id", link.id);
        }

        // add the link id to the jobs
        jobs.forEach((job) => {
          job.link_id = link.id;
        });

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

async function handleParsingFailureForLink({
  logger,
  supabaseClient,
  link,
  html,
}: {
  logger: ILogger;
  supabaseClient: SupabaseClient<DbSchema, "public", DbSchema["public"]>;
  link: Link;
  html: HtmlParseRequest;
}) {
  // save the html dump for debugging
  await supabaseClient
    .from("html_dumps")
    .insert([{ url: link.url, html: html.content }]);

  // increment the failure count
  const { error: linkUpdateError } = await supabaseClient
    .from("links")
    .update({ scrape_failure_count: link.scrape_failure_count + 1 })
    .eq("id", link.id);
  if (linkUpdateError) {
    logger.error(linkUpdateError.message);
    return;
  }
}
