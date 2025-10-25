import { CORS_HEADERS } from "../_shared/cors.ts";

import { getExceptionMessage, throwError } from "../_shared/errorUtils.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { DbSchema, Profile } from "../_shared/types.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";
import { MailerLiteApi } from "../_shared/mailerLiteApi.ts";
import { getEdgeFunctionContext } from "../_shared/edgeFunctions.ts";

type InsertPayload = {
  type: "INSERT";
  table: string;
  schema: string;
  record: Profile;
  old_record: null;
};
type UpdatePayload = {
  type: "UPDATE";
  table: string;
  schema: string;
  record: Profile;
  old_record: Profile;
};
type DeletePayload = {
  type: "DELETE";
  table: string;
  schema: string;
  record: null;
  old_record: Profile;
};

type WebhookPayload = InsertPayload | UpdatePayload | DeletePayload;

const TRIAL_GROUP_ID = "129230534205245257";
const PAYING_CUSTOMERS_GROUP_ID = "148205894191024107";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "handle-profile-change-webhook",
  });
  try {
    const context = await getEdgeFunctionContext({
      logger,
      req,
      checkAuthorization: false,
    });
    const { supabaseClient, env } = context;

    logger.info("Processing user profile change webhook ...");

    // check webhook signature
    const webhookSecret = env.f2aWebhookSecret;
    const signature = req.headers.get("x-f2a-webhook-secret");
    if (signature !== webhookSecret) {
      throw new Error("Invalid webhook signature");
    }

    // init mailersend client
    const mailerLiteApi = new MailerLiteApi(
      env.mailerLiteApiKey ?? throwError("MailerLite API key is missing")
    );

    // load body payload
    const body: WebhookPayload = await req.json();
    if (body.type === "INSERT") {
      const { record } = body;
      const { user_id } = record;

      logger.info(`Processing new user with user_id: ${user_id} ...`);
      const email = await getUserEmailById(supabaseClient, user_id);
      await mailerLiteApi.addSubscriber({
        email,
        fields: {
          user_id: user_id.toString(),
          subscription_expire_date: record.subscription_end_date,
          subscription_trial: 1,
        },
        groups: [TRIAL_GROUP_ID],
      });
      logger.info(`User ${email} added to MailerLite`);
    } else if (body.type === "UPDATE") {
      const { record } = body;
      const { user_id } = record;

      logger.info(`Processing user update for user_id: ${user_id} ...`);
      const email = await getUserEmailById(supabaseClient, user_id);
      const subscriber = await mailerLiteApi.addSubscriber({
        email,
        fields: {
          user_id: user_id.toString(),
          subscription_expire_date: record.subscription_end_date,
          subscription_trial: record.is_trial ? 1 : 0,
        },
      });

      if (!record.is_trial) {
        // if the user is no longer on trial, remove from trial group and add to paying customers group
        await mailerLiteApi.removeSubscriberFromGroup({
          subscriberId: subscriber.id,
          groupId: TRIAL_GROUP_ID,
        });
        logger.info(`User ${email} removed from trial group in MailerLite`);

        await mailerLiteApi.addSubscriberToGroup({
          subscriberId: subscriber.id,
          groupId: PAYING_CUSTOMERS_GROUP_ID,
        });
        logger.info(
          `User ${email} added to paying customers group in MailerLite`
        );
      }

      logger.info(`User ${email} updated in MailerLite`);
    }

    logger.info("User profile change webhook processed successfully");
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 500,
      }
    );
  }
});

async function getUserEmailById(
  supabaseClient: SupabaseClient<DbSchema, "public", DbSchema["public"]>,
  userId: string
) {
  const { data: user, error: getUserError } =
    await supabaseClient.auth.admin.getUserById(userId);
  if (getUserError) {
    throw getUserError;
  }

  const email = user.user.email;
  if (!email) {
    throw new Error("User email is missing");
  }

  return email;
}
