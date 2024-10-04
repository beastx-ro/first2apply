import { AzureOpenAI } from "npm:openai";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { AdvancedMatchingConfig, Job, JobStatus } from "./types.ts";
import { DbSchema } from "./types.ts";
import { Profile } from "./types.ts";
import { getExceptionMessage } from "./errorUtils.ts";
import { ILogger } from "./logger.ts";

/**
 * Apply all the advanced matching rules to the given job and
 * determine if it should be excluded from the user's feed.
 */
export async function applyAdvancedMatchingFilters({
  logger,
  supabaseClient,
  job,
  openAiApiKey,
}: {
  logger: ILogger;
  supabaseClient: SupabaseClient<DbSchema, "public">;
  job: Job;
  openAiApiKey: string;
}): Promise<JobStatus> {
  logger.info(`applying advanced matching filters to job ${job.id} ...`);
  // check if the user has advanced matching enabled
  const { hasAdvancedMatching } = await checkUserSubscription({
    supabaseClient,
    userId: job.user_id,
  });
  if (!hasAdvancedMatching) {
    logger.info("user does not have advanced matching enabled");
    return "new";
  }

  // load the advanced matching config for this user
  const { data: advancedMatchingArr, error: getAdvancedMatchingErr } =
    await supabaseClient
      .from("advanced_matching")
      .select("*")
      .eq("user_id", job.user_id);
  if (getAdvancedMatchingErr) {
    throw getAdvancedMatchingErr;
  }
  const advancedMatching: AdvancedMatchingConfig = advancedMatchingArr?.[0];
  if (!advancedMatching) {
    logger.info(`advanced matching config not found for user ${job.user_id}`);
    return "new";
  }

  // exclude jobs from specific companies if it fully matches the entire company name
  if (isExcludedCompany({ companyName: job.companyName, advancedMatching })) {
    logger.info(`job excluded due to company name: ${job.companyName}`);
    return "excluded_by_advanced_matching";
  }

  // prompt OpenAI to determine if the job should be excluded
  if (job.description && advancedMatching.chatgpt_prompt) {
    logger.info(
      "prompting OpenAI to determine if the job should be excluded ..."
    );

    // check if the user must be limited to a lower LLM tier
    const shouldBeThrottled = advancedMatching.ai_api_cost > 10;
    if (shouldBeThrottled) {
      logger.info("user has reached its LLM quota and will be throttled");
    }

    const {
      jobShouldBeExcluded,
      message,
      inputTokensUsed,
      outputTokensUsed,
      cost,
    } = await promptOpenAI({
      prompt: advancedMatching.chatgpt_prompt,
      job,
      openAiApiKey,
      shouldBeThrottled,
    });

    console.debug(message);
    console.debug(`Tokens used: ${inputTokensUsed} ${outputTokensUsed}`);
    console.debug(`Estimated cost: $${cost.toFixed(8)}`);

    // persist the cost of the OpenAI API call
    const { error: countUsageError } = await supabaseClient.rpc(
      "count_chatgpt_usage",
      {
        for_user_id: job.user_id,
        cost_increment: cost,
        input_tokens_increment: inputTokensUsed,
        output_tokens_increment: outputTokensUsed,
      }
    );
    if (countUsageError) {
      console.error(getExceptionMessage(countUsageError));
    }

    if (jobShouldBeExcluded) {
      logger.info("job excluded by OpenAI");
      return "excluded_by_advanced_matching";
    }
  }

  logger.info("job passed all advanced matching filters");
  return "new";
}

/**
 * Retrieve the user profile and check if his subscription allows advanced matching.
 */
export async function checkUserSubscription({
  supabaseClient,
  userId,
}: {
  supabaseClient: SupabaseClient<DbSchema, "public">;
  userId: string;
}): Promise<{
  profile: Profile;
  hasAdvancedMatching: boolean;
}> {
  const { data: profile, error } = await supabaseClient
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
  const hasRequiredTier = profile.subscription_tier === "pro";

  return {
    profile,
    hasAdvancedMatching: hasRequiredTier && !subscriptionHasExpired,
  };
}

/**
 * Check if the company name is excluded by the advanced matching filters.
 */
export function isExcludedCompany({
  companyName,
  advancedMatching,
}: {
  companyName: string;
  advancedMatching: AdvancedMatchingConfig;
}): boolean {
  const excludedCompanies = advancedMatching.blacklisted_companies.map((c) =>
    c.toLowerCase()
  );
  const lowerCaseCompanyName = companyName.toLowerCase();
  return excludedCompanies.some((c) => lowerCaseCompanyName === c);
}

/**
 * Prompt the OpenAI API to interogate if a job matches the user prompt.
 * Returns true if the job should be excluded, false otherwise.
 */
async function promptOpenAI({
  prompt,
  job,
  openAiApiKey,
  shouldBeThrottled,
}: {
  prompt: string;
  job: Job;
  openAiApiKey: string;
  shouldBeThrottled: boolean;
}) {
  const openai = new AzureOpenAI({
    apiKey: openAiApiKey,
    endpoint: "https://first2apply.openai.azure.com/",
    apiVersion: "2024-02-15-preview",
  });

  shouldBeThrottled = false; // bypass throttling for now
  const llmConfig = shouldBeThrottled
    ? {
        model: "gpt-3.5-turbo-0125",
        costPerMillionInputTokens: 0.5,
        costPerMillionOutputTokens: 1.5,
      }
    : {
        model: "gpt-4o",
        costPerMillionInputTokens: 5,
        costPerMillionOutputTokens: 15,
      };

  const response = await openai.chat.completions.create({
    model: "f2agpt4o", // custom azure deployment
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: generateUserPrompt({
          prompt,
          job,
        }),
      },
    ],
    temperature: 0,
    max_tokens: 1,
    top_p: 0,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const message = response.choices[0].message.content?.trim();

  const inputTokensUsed = response.usage?.prompt_tokens ?? 0;
  const outputTokensUsed = response.usage?.completion_tokens ?? 0;
  const cost =
    (llmConfig.costPerMillionInputTokens / 1_000_000) * inputTokensUsed +
    (llmConfig.costPerMillionOutputTokens / 1_000_000) * outputTokensUsed;

  return {
    jobShouldBeExcluded: message === "Yes",
    message,
    inputTokensUsed,
    outputTokensUsed,
    cost,
  };
}

/**
 * Generate the user prompt for the OpenAI API.
 */
function generateUserPrompt({ prompt, job }: { prompt: string; job: Job }) {
  // - Exclude jobs with the title "Senior" or "Lead".
  // - I'm from the UK, so only want jobs that allow working remotely from the UK.
  // - Do not include jobs that require working with Python or Java.
  // - Do not want to work with Style Components.
  // - Salary should be at least $80,000 per year.
  // - I'm from the UK, so only want jobs that allow working remotely from the UK.
  // - Exclude jobs with the title "Senior" or "Lead".
  return `Here are my requirements for job filtering:
${prompt}

Job Title: ${job.title}
Location: ${job.location ?? "Not specified"}
Tags: ${job?.tags?.join(", ") ?? "None"}
Job Description:
${job.description}

Based on my requirements, should this job be excluded from my feed?`;
}

const SYSTEM_PROMPT = `You are an assistant which helps users with their job search. You will have to analyze a job and decide if it should be discarded based on the user's requirements.
Following are the rules for filtering jobs: 
- regarding excluded keywords like tech stack or skills, if at least one of them is mentioned, the job should be excluded. If none of them are mentioned, the job should be included.
- if the user is requesting a minimum salary, it should be fine if the job just says: "Up to x amount" or "Depending on experience". Also the currency can be ignored.
- if the job does not mention a salary range, ignore salary requirements by the user (this rule can be overridden by the user if they want to exclude jobs without a salary range).
- only consider a job description unsuitable based on remoteness if the user explicitly restricts their interest to certain locations (e.g., "fully remote jobs in the UK") and the description specifies otherwise (e.g., "remote only in Belgium")
- treat the absence of specific details (such as PTO days or remote work specifics) neutrally unless the user specifies that such details are a deciding factor.
- job level/title: only disqualify based on job level if the description clearly conflicts with the user's specified job level.
- contract type: do not disqualify if contract type is unspecified, unless explicitly required by the user.
- location/relocation: treat location neutrally unless the user specifies no willingness to relocate or a specific geographic preference.
- benefits/company culture: absence of benefits or cultural descriptors should not disqualify a job unless specifically stated by the user as a requirement.
- technological tools: only jobs mandating undesired technologies should be disqualified, absence of mention should be neutral.
- working hours: absence of detailed working hours should not disqualify a job unless specific hours are a user requirement.
- for experience, interpret any specified maximum or minimum years of experience in relation to what is stated in the job description. If the job specifies an experience range, the job should be considered a match if the user's requirement fits within this range or if the user's requirement aligns with the maximum experience mentioned. Absence of experience details in the job description should not disqualify the job unless the user explicitly requires experience details to be mentioned.
Answer only with 'yes' or 'no' based on the user's requirements.`;
