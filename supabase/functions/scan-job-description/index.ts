import { CORS_HEADERS } from "../_shared/cors.ts";

import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { parseJobDescriptionUpdates } from "../_shared/jobDescriptionParser.ts";
import { applyAdvancedMatchingFilters } from "../_shared/advancedMatching.ts";
import { Job } from "../_shared/types.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { getEdgeFunctionContext } from "../_shared/edgeFunctions.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "scan-job-description",
  });
  try {
    const context = await getEdgeFunctionContext({
      logger,
      req,
      checkAuthorization: true,
    });
    const { supabaseClient, supabaseAdminClient } = context;

    const body: {
      jobId: number;
      html: string;
      maxRetries?: number;
      retryCount?: number;
    } = await req.json();
    const { jobId, html, maxRetries, retryCount } = body;
    logger.info(`processing job description for ${jobId}  ...`);

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

    const parseDescriptionAndSaveUpdates = async () => {
      let updatedJob: Job = { ...job, status: "new" };
      if (!job.description) {
        // parse the job description
        logger.info(
          `[${site.provider}] parsing job description for ${jobId} ...`
        );

        // update the job with the description
        const updates = await parseJobDescriptionUpdates({
          site,
          job,
          html,
          ...context,
        });
        const isLastRetry = retryCount === maxRetries;
        updatedJob = {
          ...updatedJob,
          description: updates.description ?? job.description,
          salary: !job.salary ? updates.salary : job.salary,
          tags: Array.from(
            new Set((job.tags ?? []).concat(updates.tags ?? []))
          ),
        };
        if (!updates.description && isLastRetry) {
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

        if (updates.description) {
          logger.info(
            `[${site.provider}] finished parsing job description for ${job.title}`,
            {
              site: site.provider,
            }
          );
        }

        const { newStatus, excludeReason } = await applyAdvancedMatchingFilters(
          {
            logger,
            job: updatedJob,
            supabaseClient,
            supabaseAdminClient,
          }
        );

        updatedJob = {
          ...updatedJob,
          status: newStatus,
          exclude_reason: excludeReason,
        };
      }

      logger.info(`[${site.provider}] ${updatedJob.status} ${job.title}`);

      const { error: updateJobErr } = await supabaseClient
        .from("jobs")
        .update({
          description: updatedJob.description,
          salary: updatedJob.salary,
          tags: updatedJob.tags,
          status: updatedJob.status,
          updated_at: new Date(),
          exclude_reason: updatedJob.exclude_reason,
        })
        .eq("id", jobId)

        // I think this is causing jobs to be put back on new from deleted
        // if the app fails to process an entire batch in one cron interval
        // then the same job will be processed twice (since it's status is processing still)
        .in("status", ["processing", "new"]);
      if (updateJobErr) {
        throw updateJobErr;
      }

      const parseFailed = !updatedJob.description;

      return { updatedJob, parseFailed };
    };

    // Let's add a timeout of 20 seconds on the parsing operation, but without failing it
    // This means it will still work in the background, but the client will not wait for it.
    const timeoutPromise = new Promise<{
      updatedJob: Job;
      parseFailed: boolean;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          updatedJob: job,
          parseFailed: false,
        });
      }, 30_000);
    });

    const { updatedJob, parseFailed } = await Promise.race([
      parseDescriptionAndSaveUpdates(),
      timeoutPromise,
    ]);

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
