import { DbSchema, SubscriptionTier } from '@first2apply/core';
import { getExceptionMessage } from '@first2apply/core';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'npm:stripe';

import { CORS_HEADERS } from '../_shared/cors.ts';
import { createLoggerWithMeta } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: 'handle-stripe-webhook',
  });
  try {
    const requestId = crypto.randomUUID();
    logger.addMeta('request_id', requestId);

    // init supabase client
    const supabaseClient = createClient<DbSchema>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // init stripe client
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    const stripe = new Stripe(stripeSecretKey);

    // handle stripe webhook event
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      throw new Error('Missing Stripe-Signature header');
    }
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') ?? '',
      undefined,
    );

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;

      // fetch the customer
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer.deleted) {
        throw new Error('Customer is deleted??');
      }

      // get the matching user by email
      const { data, error: getUserIdError } = await supabaseClient.rpc('get_user_id_by_email', {
        email: customer.email?.toLowerCase(),
      });
      if (getUserIdError) {
        throw getUserIdError;
      }
      // deno-lint-ignore no-explicit-any
      const userId = (data as unknown as any)?.[0]?.id;
      if (!userId) {
        throw new Error(`No user found for email ${customer.email}`);
      }

      const { data: getUserByIdData, error: getUserByIdError } = await supabaseClient.auth.admin.getUserById(userId);
      if (getUserByIdError) {
        throw getUserByIdError;
      }
      const user = getUserByIdData.user;
      logger.info(`found user for customer ${customer.email}`);

      // update the user profile
      const tier = (subscription.items.data[0].plan.metadata?.tier ?? 'pro') as SubscriptionTier;
      const { error: updateProfileError } = await supabaseClient
        .from('profiles')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          // @ts-expect-error: type is actually Date, but the front end get's it as a string
          subscription_end_date: new Date(subscription.current_period_end * 1000),
          subscription_tier: tier,
          is_trial: false,
        })
        .eq('user_id', user.id);
      if (updateProfileError) {
        throw updateProfileError;
      }
      logger.info(`succesfully updated profile for user ${user.email}`);
    }

    return new Response(JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
    // http://dragos.beastx.ro:54321/functions/v1/handle-stripe-webhook
  } catch (error) {
    logger.error(`error running handle stripe webhook: ${getExceptionMessage(error)}`);
    return new Response(JSON.stringify({ errorMessage: getExceptionMessage(error, true) }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      status: 500,
    });
  }
});
