'use client';

import React from 'react';

import { Job, JobStatus, ListJobsResult, throwError } from '@first2apply/core';
import { JobsList, useError, useSdk, useToast } from '@first2apply/ui';
import { useRouter, useSearchParams } from 'next/navigation';

import { listJobs } from '../../../actions';

export type JobListing = {
  isLoading: boolean;
  hasMore: boolean;
  jobs: Job[];
  nextPageToken?: string;
};

export type ListJobsFeedProps = {
  listJobsResult: ListJobsResult;
  status: JobStatus;
  batchSize: number;
};
export function ListJobsFeed({ listJobsResult, status, batchSize }: ListJobsFeedProps) {
  const [jobListing, setJobListing] = React.useState<JobListing>({
    isLoading: false,
    hasMore: listJobsResult.jobs.length >= batchSize,
    jobs: listJobsResult.jobs,
    nextPageToken: listJobsResult.nextPageToken,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleError } = useError();
  const sdk = useSdk();
  const { toast } = useToast();

  const onLoadMore = async () => {
    try {
      const formData = new FormData();

      // load all the search params into the form data
      formData.set('status', status);
      searchParams.keys().forEach((key) => {
        formData.set(key, searchParams.get(key) ?? throwError(`missing search param: ${key}`));
      });
      formData.set('limit', String(batchSize));

      // add the next page token to the form data
      if (jobListing.nextPageToken) {
        formData.set('after', jobListing.nextPageToken);
      }

      const jobsResult = await listJobs(formData);

      setJobListing({
        ...jobListing,
        isLoading: false,
        jobs: [...jobListing.jobs, ...jobsResult.jobs],
        hasMore: jobsResult.jobs.length === batchSize,
        nextPageToken: jobsResult.nextPageToken,
      });
    } catch (error) {
      handleError({ error, title: 'Failed to load more jobs' });
    }
  };

  const onSelectJob = (job: Job) => {
    router.push(`/jobs/${job.id}`);
  };

  // Update the status of a job and remove it from the list if necessary
  const updateListedJobStatus = async (jobId: number, newStatus: JobStatus) => {
    await sdk.updateJobStatus({
      jobId,
      status: newStatus,
    });

    setJobListing((listing) => {
      const jobs = listing.jobs.filter((job) => job.id !== jobId);

      return {
        ...listing,
        jobs,
      };
    });
  };

  const onArchive = async (job: Job) => {
    try {
      await updateListedJobStatus(job.id, 'archived');
      toast({ title: 'Job archived', description: `Job ${job.title} has been archived.`, variant: 'success' });
    } catch (error) {
      handleError({ error, title: 'Failed to archive job' });
    }
  };

  const onDelete = async (job: Job) => {
    try {
      await updateListedJobStatus(job.id, 'deleted');
      toast({ title: 'Job deleted', description: `Job ${job.title} has been deleted.`, variant: 'success' });
    } catch (error) {
      handleError({ error, title: 'Failed to delete job' });
    }
  };

  return (
    <div>
      <h1 className="m-4 text-2xl">{PageHeaderNameMap[status]}</h1>
      <JobsList
        jobs={jobListing.jobs}
        selectedJobId={undefined}
        parentContainerId="jobs-feed"
        hasMore={jobListing.hasMore}
        onSelect={onSelectJob}
        onArchive={onArchive}
        onDelete={onDelete}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}

const PageHeaderNameMap: Record<JobStatus, string> = {
  new: 'New Jobs',
  applied: 'Applied Jobs',
  archived: 'Archived Jobs',
  excluded_by_advanced_matching: 'Excluded by Advanced Matching',
  deleted: 'Deleted Jobs',
  processing: 'Processing Jobs',
};
