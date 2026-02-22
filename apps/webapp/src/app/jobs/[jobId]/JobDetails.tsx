'use client';

import { Job } from '@first2apply/core';
import { JobDescription, JobSummary } from '@first2apply/ui';

export type JobDetailsProps = {
  job: Job;
};
export function JobDetails({ job }: JobDetailsProps) {
  return (
    <div className="px-2 py-4">
      <JobSummary
        job={job}
        onOpenUrl={() => {}}
        onUpdateJobStatus={() => {}}
        onUpdateLabels={() => {}}
        onView={() => {}}
      />

      <div className="mt-6 px-2">
        <JobDescription job={job} />
      </div>
    </div>
  );
}
