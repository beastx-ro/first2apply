import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { DbSchema, Job, Link } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { cleanJobUrl, parseJobsListUrl } from "../_shared/jobListParser.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { checkUserSubscription } from "../_shared/subscription.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "create-link",
  });
  let inFlightLink: Link | null = null;
  try {
    const requestId = crypto.randomUUID();
    logger.addMeta("request_id", requestId);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const supabaseClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    const { data: userData, error: getUserError } =
      await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

    const { title, url, html } = (await req.json()) as {
      title: string;
      url: string;
      html?: string;
    };
    logger.info(`Creating link: ${title} - ${url}`);

    const { hasCustomJobsParsing } = await checkUserSubscription({
      supabaseClient,
      userId: user?.id ?? "",
    });

    // list all job sites from db
    const { data, error: selectError } = await supabaseClient
      .from("sites")
      .select("*");
    if (selectError) throw new Error(selectError.message);
    const allJobSites = data ?? [];

    // insert a new link in the db
    const { cleanUrl, site } = cleanJobUrl({
      url,
      allJobSites,
      hasCustomJobsParsing,
    });
    // check if the site is deprecated
    if (site.deprecated) {
      throw new Error(
        `Site ${site.name} is deprecated and no longer supported. Please contact our support team if you need help.`
      );
    }
    const { data: createdLinks, error } = await supabaseClient
      .from("links")
      .insert({
        url: cleanUrl,
        title,
        site_id: site.id,
      })
      .select("*");
    if (error) throw error;
    logger.info(`created link for site ${site.name} (${site.id})`);

    const [link] = createdLinks ?? [];
    inFlightLink = link;

    // legacy, we don't parse the jobs list when creating a new link anymore
    // but need to still return an empty array for compatibility
    let newJobs: Job[] = [];

    // if an html is provided, parse it and insert the jobs in the db
    if (html) {
      const { jobs, parseFailed } = await parseJobsListUrl({
        allJobSites,
        link,
        html,
        hasCustomJobsParsing,
        logger,
        openAiApiKey,
      });

      if (parseFailed) {
        // save the html dump for debugging
        const { error: htmlDumpError } = await supabaseClient
          .from("html_dumps")
          .insert([{ url: link.url, html }]);
        if (htmlDumpError) {
          logger.error(
            `failed to save html dump for link ${inFlightLink.id}: ${htmlDumpError.message}`
          );
        }

        throw new Error(
          `No jobs found on the ${site.name} page you are trying to save. Make sure the page you're on is a job list, not just the description of a single job. If you think this is a mistake, please contact our support team.`
        );
      }

      logger.info(`parsed ${jobs.length} jobs from ${link.url}`);

      // add the link id to the jobs
      jobs.forEach((job) => {
        job.link_id = link.id;
      });

      const { data: upsertedJobs, error: insertError } = await supabaseClient
        .from("jobs")
        .upsert(
          jobs.map((job) => ({ ...job, status: "processing" as const })),
          { onConflict: "user_id, externalId", ignoreDuplicates: true }
        )
        .select("*");
      if (insertError) throw new Error(insertError.message);

      logger.info(`upserted ${upsertedJobs?.length} jobs for link ${link.id}`);
      newJobs =
        upsertedJobs?.filter((job) => job.status === "processing") ?? [];
      logger.info(`found ${newJobs.length} new jobs`);
    }

    logger.info(`successfully created link: ${link.id}`);

    return new Response(JSON.stringify({ link, newJobs }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(getExceptionMessage(error));

    // if we have created a link but something else failed, delete the link
    // this will also cascade and delete all jobs associated with the link
    if (inFlightLink) {
      const supabaseClient = createClient<DbSchema>(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { error: deleteError } = await supabaseClient
        .from("links")
        .delete()
        .eq("id", inFlightLink.id);
      if (deleteError) {
        logger.error(
          `failed to delete link ${inFlightLink.id}: ${deleteError.message}`
        );
      }
    }

    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        // until this is fixed: https://github.com/supabase/functions-js/issues/45
        // we have to return 200 and handle the error on the client side
        // status: 400,
      }
    );
  }
});
