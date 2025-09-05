import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "../_shared/cors.ts";

import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage, throwError } from "../_shared/errorUtils.ts";
import { parseJobDescriptionUpdates } from "../_shared/jobDescriptionParser.ts";
import { applyAdvancedMatchingFilters } from "../_shared/advancedMatching.ts";
import { Job } from "../_shared/types.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { countChatGptUsage } from "../_shared/openAI.ts";

const supabaseAdminClient = createClient<DbSchema>(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

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
          openAiApiKey,
          logger,
        });
        const isLastRetry = retryCount === maxRetries;
        updatedJob = {
          ...updatedJob,
          ...updates,
          description: updates.description ?? job.description, // keep old description if no new one
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

        if (updates.llmApiCallCost) {
          await countChatGptUsage({
            logger,
            supabaseClient: supabaseAdminClient,
            forUserId: user?.id ?? "",
            ...updates.llmApiCallCost,
          });
        }

        const { newStatus, excludeReason } = await applyAdvancedMatchingFilters(
          {
            logger,
            job: updatedJob,
            supabaseClient,
            supabaseAdminClient,
            openAiApiKey:
              Deno.env.get("OPENAI_API_KEY") ??
              throwError("missing OPENAI_API_KEY"),
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
          status: updatedJob.status,
          updated_at: new Date(),
          exclude_reason: updatedJob.exclude_reason,
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
      }, 20_000);
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
