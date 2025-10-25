import { throwError } from "./errorUtils.ts";
import { AzureFoundryConfig } from "./openAI.ts";

export type First2ApplyBackendEnv = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  azureFoundryConfig: AzureFoundryConfig;
  mailerLiteApiKey?: string;
  mailerSendApiKey?: string;
  mezmoApiKey: string;
  f2aWebhookSecret: string;
  stripeSecretKey: string;
  stripeWebhookSigningSecret: string;
};

export function parseEnv(): First2ApplyBackendEnv {
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    azureFoundryConfig: {
      apiEndpoint: Deno.env.get("AZURE_AI_FOUNDRY_ENDPOINT") ?? "",
      apiKey: Deno.env.get("AZURE_AI_FOUNDRY_API_KEY") ?? "",
    },
    mailerLiteApiKey: Deno.env.get("MAILERLITE_API_KEY"),
    mailerSendApiKey: Deno.env.get("MAILERSEND_API_KEY"),
    mezmoApiKey: Deno.env.get("MEZMO_API_KEY") ?? "",
    f2aWebhookSecret:
      Deno.env.get("F2A_WEBHOOK_SECRET") ??
      throwError("F2A_WEBHOOK_SECRET is not set"),
    stripeSecretKey: Deno.env.get("STRIPE_SECRET_KEY") ?? "",
    stripeWebhookSigningSecret:
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") ?? "",
  };
}
