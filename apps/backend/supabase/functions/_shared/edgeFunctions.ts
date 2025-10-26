import { First2ApplyBackendEnv, parseEnv } from './env.ts';

import { DbSchema, User } from '@first2apply/core';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

import { ILogger } from './logger.ts';

// Function overloads for type safety based on checkAuthorization
export type EdgeFunctionAnonymousContext = {
  logger: ILogger;
  user: null; // always null when checkAuthorization is false
  supabaseClient: ReturnType<typeof createClient<DbSchema>>;
  supabaseAdminClient: ReturnType<typeof createClient<DbSchema>>;
  env: First2ApplyBackendEnv;
};
export type EdgeFunctionAuthorizedContext = Omit<EdgeFunctionAnonymousContext, 'user'> & {
  user: User; // non-optional when checkAuthorization is true
};

/**
 * Infrastructure function to get the context for an edge function,
 * including logger, supabase clients, and user info if authorized.
 */
export async function getEdgeFunctionContext({
  logger,
  req,
  checkAuthorization,
}: {
  logger: ILogger;
  req: Request;
  checkAuthorization: false;
}): Promise<EdgeFunctionAnonymousContext>;
export async function getEdgeFunctionContext({
  logger,
  req,
  checkAuthorization,
}: {
  logger: ILogger;
  req: Request;
  checkAuthorization: true;
}): Promise<EdgeFunctionAuthorizedContext>;

// actual implementation
export async function getEdgeFunctionContext({
  logger,
  req,
  checkAuthorization,
}: {
  logger: ILogger;
  req: Request;
  checkAuthorization: boolean;
}) {
  const env = parseEnv();
  const requestId = crypto.randomUUID();
  logger.addMeta('request_id', requestId);

  const supabaseAdminClient = createClient<DbSchema>(env.supabaseUrl, env.supabaseServiceRoleKey);
  let supabaseClient = supabaseAdminClient;
  let user: User | null = null;
  if (checkAuthorization) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    supabaseClient = createClient<DbSchema>(env.supabaseUrl, env.supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: getUserError } = await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }

    user = {
      id: userData?.user?.id ?? '',
      email: userData?.user?.email ?? '',
    };
    logger.addMeta('user_id', user?.id ?? '');
    logger.addMeta('user_email', user?.email ?? '');
  }

  return {
    logger,
    user,
    supabaseClient,
    supabaseAdminClient,
    env,
  };
}
