import { parseEnv } from './env.ts';

import { getExceptionMessage } from '@first2apply/core';
import { SupabaseClient } from '@supabase/supabasefork';
import OpenAI from 'openai';

import { ILogger } from './logger.ts';

// Type for an OpenAI-compatible API response with usage information.
// OpenRouter additionally returns `cost` (in USD) when the request opts in via
// `usage: { include: true }` (see OPENROUTER_ROUTING below).
type OpenAIResponse = {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
  };
};

const env = parseEnv();

const SUPPORTED_MODELS = ['deepseek/deepseek-v4-flash', 'deepseek/deepseek-v4-pro'] as const;
type SupportedModel = (typeof SUPPORTED_MODELS)[number];

// Fallback list-price estimate ($ per 1M tokens). Only used when OpenRouter does
// not report an actual cost in the usage payload.
const COST_PER_MODEL: Record<SupportedModel, { input: number; output: number }> = {
  'deepseek/deepseek-v4-flash': { input: 0.09, output: 0.18 },
  'deepseek/deepseek-v4-pro': { input: 0.435, output: 0.87 },
};

// Extra request fields understood by OpenRouter (not part of the OpenAI type).
// Spread into every chat completion call.
export const OPENROUTER_ROUTING = {
  // Only route to providers that actually honor response_format / json_schema,
  // so our structured (zod) outputs never silently degrade to free text.
  provider: { require_parameters: true },
  // DeepSeek V4 has a thinking mode; keep it off so we don't pay for reasoning
  // tokens and the response `content` stays a clean JSON string to parse.
  reasoning: { enabled: false },
  // Ask OpenRouter to include the real dollar cost of the call in `usage`.
  usage: { include: true },
} as const;

export type OpenRouterConfig = {
  apiKey: string;
};

/**
 * Build a new OpenRouter (OpenAI-compatible) client.
 */
export function buildOpenAiClient({ modelName }: { modelName?: SupportedModel }) {
  const openAi = new OpenAI({
    apiKey: env.openRouterConfig.apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      // Optional attribution headers used by OpenRouter for dashboards/rankings.
      'HTTP-Referer': env.webappUrl,
      'X-Title': 'First 2 Apply',
    },
  });

  const model = modelName ?? 'deepseek/deepseek-v4-flash';
  if (!(model in COST_PER_MODEL)) {
    throw new Error(`Unsupported model: ${model}`);
  }
  console.log(`Using model ${model} via OpenRouter.`);
  const { input, output } = COST_PER_MODEL[model];
  const llmConfig = {
    model,
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

function computeLlmApiCallCost({ llmConfig, response }: { llmConfig: LLMConfig; response: OpenAIResponse }) {
  const inputTokensUsed = response.usage?.prompt_tokens ?? 0;
  const outputTokensUsed = response.usage?.completion_tokens ?? 0;
  // Prefer the actual cost reported by OpenRouter; fall back to our estimate.
  const cost =
    response.usage?.cost ??
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
  response: OpenAIResponse;
}) {
  const { cost, inputTokensUsed, outputTokensUsed } = computeLlmApiCallCost({
    llmConfig,
    response,
  });

  // persist the cost of the LLM API call
  const { error: countUsageError } = await supabaseAdminClient.rpc('log_ai_usage', {
    for_user_id: forUserId,
    cost_increment: cost,
    input_tokens_increment: inputTokensUsed,
    output_tokens_increment: outputTokensUsed,
  });
  if (countUsageError) {
    logger.error(getExceptionMessage(countUsageError));
  }
}
