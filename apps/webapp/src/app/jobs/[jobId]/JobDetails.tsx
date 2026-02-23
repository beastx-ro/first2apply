'use client';

import { useState } from 'react';

import { Job, JobStatus } from '@first2apply/core';
import { JobDescription, JobSummary, useError, useSdk } from '@first2apply/ui';

export type JobDetailsProps = {
  job: Job;
};
export function JobDetails({ job: initialJob }: JobDetailsProps) {
  const { handleError } = useError();
  const sdk = useSdk();

  const [job, setJob] = useState<Job>(initialJob);

  const onOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onUpdateJobStatus = async (jobId: number, status: JobStatus) => {
    try {
      await sdk.updateJobStatus({ jobId, status });
      setJob((prevJob) => ({ ...prevJob, status }));
    } catch (error) {
      handleError({ error, title: 'Failed to update job status' });
    }
  };

  return (
    <div className="px-2 py-4">
      <JobSummary
        job={job}
        onOpenUrl={onOpenUrl}
        onUpdateJobStatus={onUpdateJobStatus}
        onUpdateLabels={() => {}}
        onView={(job: Job) => onOpenUrl(job.externalUrl)}
      />

      <div className="mt-6 px-2">
        <JobDescription job={job} />
      </div>
    </div>
  );
}
