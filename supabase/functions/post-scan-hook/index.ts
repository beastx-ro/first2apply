/**
 * This function is always triggered by the app after it finishes scanning all job links
 * and the descriptions for each processing jobs.
 */
import { CORS_HEADERS } from "../_shared/cors.ts";
import { JobSite } from "../_shared/types.ts";
import { getExceptionMessage, throwError } from "../_shared/errorUtils.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { MailersendMailer, IMailer } from "../_shared/emails/mailer.ts";
import { EmailTemplateType } from "../_shared/emails/emailTemplates.ts";
import {
  EdgeFunctionAuthorizedContext,
  getEdgeFunctionContext,
} from "../_shared/edgeFunctions.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "post-scan-hook",
  });
  try {
    const context = await getEdgeFunctionContext({
      logger,
      req,
      checkAuthorization: true,
    });
    const { env } = context;

    // load body payload
    const body: {
      newJobIds: number[];
      areEmailAlertsEnabled: boolean;
    } = await req.json();

    const mailer = new MailersendMailer(
      env.mailerSendApiKey ?? throwError("Mailersend API key is missing"),
      "contact@first2apply.com",
      "First 2 Apply"
    );

    logger.info(`running post scan hook ${JSON.stringify(body)}  ...`);

    // check for broken links and send out emails
    const { areEmailAlertsEnabled, newJobIds } = body;
    await checkBrokenLinks({ context, mailer });

    // send out email for new job links
    await sendNewJobLinksEmail({
      newJobIds,
      areEmailAlertsEnabled,
      context,
      mailer,
    });

    logger.info("finished running post scan hook");
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(`error running post scan hook: ${getExceptionMessage(error)}`);
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

/**
 * Method used to check if any links of the current user are in a warning state
 * and send out an email to the user if they are.
 */
async function checkBrokenLinks({
  context,
  mailer,
}: {
  context: EdgeFunctionAuthorizedContext;
  mailer: IMailer;
}) {
  const { logger, supabaseClient, user } = context;

  if (!user.email) {
    logger.info("user email not found");
    return;
  }

  // load all existing sites
  const { data: sitesData, error: sitesError } = await supabaseClient
    .from("sites")
    .select("*");
  const jobSites: JobSite[] = sitesData ?? [];
  if (sitesError) {
    throw new Error(sitesError.message);
  }

  const failureThreshold = 3;
  const { data: links, error: listLinksError } = await supabaseClient
    .from("links")
    .select("*")
    .gte("scrape_failure_count", failureThreshold)
    .eq("scrape_failure_email_sent", false);
  if (listLinksError) {
    logger.error(
      `failed to load links: ${getExceptionMessage(listLinksError)}`
    );
    return;
  }

  if (links.length === 0) {
    logger.info("no broken links to send emails for, yaay!");
    return;
  }

  // send out the email
  const affectedLinks = links.map((link) => {
    const site =
      jobSites.find((site) => site.id === link.site_id) ??
      throwError("Site not found");
    return { title: link.title, site_name: site.name };
  });
  logger.info(
    `sending email to ${user.email} for ${
      affectedLinks.length
    } links: ${JSON.stringify(affectedLinks)}`
  );
  await mailer.sendEmail({
    logger,
    to: user.email,
    template: {
      type: EmailTemplateType.searchParsingFailure,
      templateId: "3z0vklorkzpl7qrx",
      payload: {
        links: affectedLinks,
      },
    },
  });

  // update the links to mark the email as sent
  const linkIds = links.map((link) => link.id);
  await supabaseClient
    .from("links")
    .update({ scrape_failure_email_sent: true })
    .in("id", linkIds);
}

/**
 * Method used to send an email with new job links to the user.
 */
async function sendNewJobLinksEmail({
  newJobIds,
  areEmailAlertsEnabled,
  context,
  mailer,
}: {
  newJobIds: number[];
  areEmailAlertsEnabled: boolean;
  context: EdgeFunctionAuthorizedContext;
  mailer: IMailer;
}) {
  const { logger, supabaseClient, user } = context;
  logger.info(`sending email for new job links ...`);
  if (!areEmailAlertsEnabled) {
    logger.info(`email alerts are disabled`);
    return;
  }

  if (newJobIds.length === 0) {
    logger.info(`no new jobs to send email for`);
    return;
  }

  if (!user.email) {
    logger.info(`user email not set`);
    return;
  }

  // load the new job list
  const { data: newJobs, error: newJobsError } = await supabaseClient
    .from("jobs")
    .select("*")
    .in("id", newJobIds);
  if (newJobsError) {
    logger.error(
      `failed to load new jobs: ${getExceptionMessage(newJobsError)}`
    );
    return;
  }

  // send the email
  logger.info(
    `sending email to ${user.email} for ${newJobs.length} new jobs ...`
  );
  await mailer.sendEmail({
    logger,
    to: user.email,
    template: {
      type: EmailTemplateType.newJobAlert,
      templateId: "pr9084z32r8lw63d",
      payload: {
        new_jobs_count: newJobs.length,
        new_jobs: newJobs.map((job) => ({
          title: job.title,
          url: job.externalUrl,
          description: job.description?.slice(0, 200) ?? "",
          company: job.companyName,
          location: job.location,
        })),
      },
    },
  });

  logger.info(`finished sending email for new job links`);
}
