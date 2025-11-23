import { Job } from '@first2apply/core';

export type ParsedJob = Omit<Job, 'id' | 'user_id' | 'visible' | 'status' | 'created_at' | 'updated_at'>;

export type JobSiteParseResult = {
  jobs: ParsedJob[];
  listFound: boolean;
  elementsCount: number;
  llmApiCallCost?: {
    cost: number;
    inputTokensUsed: number;
    outputTokensUsed: number;
  };
};
