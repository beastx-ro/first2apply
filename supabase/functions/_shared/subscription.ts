import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { DbSchema, Profile } from "./types.ts";

/**
 * Retrieve the user profile and check if his subscription allows advanced matching.
 */
export async function checkUserSubscription({
  supabaseAdminClient,
  userId,
}: {
  supabaseAdminClient: SupabaseClient<DbSchema, "public">;
  userId: string;
}): Promise<{
  profile: Profile;
  subscriptionHasExpired: boolean;
  hasAdvancedMatching: boolean;
  hasCustomJobsParsing: boolean;
}> {
  const { data: profile, error } = await supabaseAdminClient
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  if (!profile) {
    throw new Error("Profile not found");
  }

  // check if the user's subscription has expired
  const subscriptionHasExpired =
    new Date(profile.subscription_end_date) < new Date();
  const hasProTier = profile.subscription_tier === "pro";

  return {
    profile,
    subscriptionHasExpired,
    hasAdvancedMatching: hasProTier && !subscriptionHasExpired,
    hasCustomJobsParsing: hasProTier && !subscriptionHasExpired,
  };
}
