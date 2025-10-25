import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1/dist/module/index.js";
import { AzureOpenAI } from "npm:openai@4.86.2";
import { ILogger } from "./logger.ts";
import { getExceptionMessage } from "./errorUtils.ts";
import { parseEnv } from "./env.ts";

const env = parseEnv();

const COST_PER_MODEL: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-5-chat": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "o3-mini": { input: 0.4, output: 0.4 },
};

export type AzureFoundryConfig = {
  apiEndpoint: string;
  apiKey: string;
};

/**
 * Build a new Azure OpenAI client.
 */
export function buildOpenAiClient({ modelName }: { modelName?: string }) {
  const openAi = new AzureOpenAI({
    apiKey: env.azureFoundryConfig.apiKey,
    endpoint: env.azureFoundryConfig.apiEndpoint,
    apiVersion: "2024-10-21",
  });

  const model = modelName ?? "gpt-4o";
  if (!(model in COST_PER_MODEL)) {
    throw new Error(`Unsupported model: ${model}`);
  }
  const { input, output } = COST_PER_MODEL[model];
  const llmConfig = {
    model: modelName ?? "gpt-4o",
    costPerMillionInputTokens: input,
    costPerMillionOutputTokens: output,
  };

  return { openAi, llmConfig };
}

export type LLMConfig = {
  model: string;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
};

function computeLlmApiCallCost({
  llmConfig,
  response,
}: {
  llmConfig: LLMConfig;
  response: any;
}) {
  const inputTokensUsed = response.usage?.prompt_tokens ?? 0;
  const outputTokensUsed = response.usage?.completion_tokens ?? 0;
  const cost =
    (llmConfig.costPerMillionInputTokens / 1_000_000) * inputTokensUsed +
    (llmConfig.costPerMillionOutputTokens / 1_000_000) * outputTokensUsed;

  return { cost, inputTokensUsed, outputTokensUsed };
}

export async function logAiUsage({
  logger,
  supabaseAdminClient,
  forUserId,
  llmConfig,
  response,
}: {
  logger: ILogger;
  supabaseAdminClient: SupabaseClient;
  forUserId: string;
  llmConfig: LLMConfig;
  response: any;
}) {
  const { cost, inputTokensUsed, outputTokensUsed } = computeLlmApiCallCost({
    llmConfig,
    response,
  });

  // persist the cost of the OpenAI API call
  const { error: countUsageError } = await supabaseAdminClient.rpc(
    "log_ai_usage",
    {
      for_user_id: forUserId,
      cost_increment: cost,
      input_tokens_increment: inputTokensUsed,
      output_tokens_increment: outputTokensUsed,
    }
  );
  if (countUsageError) {
    logger.error(getExceptionMessage(countUsageError));
  }
}
