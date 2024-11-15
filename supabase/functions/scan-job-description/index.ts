import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";

import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage, throwError } from "../_shared/errorUtils.ts";
import { parseJobDescription } from "../_shared/jobDescriptionParser.ts";
import { applyAdvancedMatchingFilters } from "../_shared/advancedMatching.ts";
import { Job } from "../_shared/types.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "scan-job-description",
  });
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

    const { data: userData, error: getUserError } =
      await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

    const body: {
      jobId: number;
      html: string;
      maxRetries?: number;
      retryCount?: number;
    } = await req.json();
    const { jobId, html, maxRetries, retryCount } = body;

    // find the job and its site
    const { data: job, error: findJobErr } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (findJobErr) {
      throw findJobErr;
    }
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const { data: site, error: findSiteErr } = await supabaseClient
      .from("sites")
      .select("*")
      .eq("id", job.siteId)
      .single();
    if (findSiteErr) {
      throw findSiteErr;
    }

    let updatedJob: Job = { ...job, status: "new" };
    if (!job.description) {
      // parse the job description
      logger.info(
        `[${site.provider}] parsing job description for ${jobId} ...`
      );

      // update the job with the description
      const jd = parseJobDescription({ site, job, html });
      const isLastRetry = retryCount === maxRetries;
      updatedJob = {
        ...updatedJob,
        description: jd.content ?? updatedJob.description,
      };
      if (!jd.content && isLastRetry) {
        logger.error(
          `[${site.provider}] no JD details extracted from the html of job ${jobId}, this could be a problem with the parser`,
          {
            url: job.externalUrl,
            site: site.provider,
          }
        );

        await supabaseClient
          .from("html_dumps")
          .insert([{ url: job.externalUrl, html }]);
      }

      if (jd.content) {
        logger.info(
          `[${site.provider}] finished parsing job description for ${job.title}`,
          {
            site: site.provider,
          }
        );
      }

      const filteredJobStatus = await applyAdvancedMatchingFilters({
        logger,
        job: updatedJob,
        supabaseClient,
        openAiApiKey:
          Deno.env.get("OPENAI_API_KEY") ??
          throwError("missing OPENAI_API_KEY"),
      });

      updatedJob = { ...updatedJob, status: filteredJobStatus };
    }

    logger.info(`[${site.provider}] ${updatedJob.status} ${job.title}`);

    const { error: updateJobErr } = await supabaseClient
      .from("jobs")
      .update({
        description: updatedJob.description,
        status: updatedJob.status,
        updated_at: new Date(),
      })
      .eq("id", jobId)

      // I think this is causing jobs to be put back on new from deleted
      // if the app fails to process an entire batch in one cron interval
      // then the same job will be processed twice (since it's status is processing still)
      .eq("status", "processing");
    if (updateJobErr) {
      throw updateJobErr;
    }

    const parseFailed = !updatedJob.description;

    return new Response(JSON.stringify({ job: updatedJob, parseFailed }), {
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
