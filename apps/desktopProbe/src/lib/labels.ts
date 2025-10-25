import { JOB_LABELS, JobLabel } from '../../../../supabase/functions/_shared/types';

export const LABEL_COLOR_CLASSES: Record<JobLabel, string> = {
  [JOB_LABELS.CONSIDERING]: 'bg-violet-500',
  [JOB_LABELS.SUBMITTED]: 'bg-green-500',
  [JOB_LABELS.INTERVIEWING]: 'bg-yellow-500',
  [JOB_LABELS.OFFER]: 'bg-blue-500',
  [JOB_LABELS.REJECTED]: 'bg-red-500',
  [JOB_LABELS.GHOSTED]: 'bg-gray-500',
};
