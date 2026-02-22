'use client';

import React from 'react';

import { Job, JobStatus, ListJobsResult, throwError } from '@first2apply/core';
import { JobsList, useError } from '@first2apply/ui';
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

  // const isMountedCount = React.useRef(0);
  // useEffect(() => {
  //   const loadAsync = async () => {
  //     try {
  //       setJobListing((listing) => ({ ...listing, isLoading: true }));

  //       const formData = new FormData();

  //       // load all the search params into the form data
  //       searchParams.keys().forEach((key) => {
  //         formData.set(key, searchParams.get(key) ?? throwError(`missing search param: ${key}`));
  //       });
  //       formData.set('limit', String(batchSize));

  //       const jobsResult = await listJobs(formData);

  //       setJobListing((listing) => ({
  //         ...listing,
  //         jobs: jobsResult.jobs,
  //         isLoading: false,
  //         hasMore: jobsResult.jobs.length === batchSize,
  //         nextPageToken: jobsResult.nextPageToken,
  //       }));
  //     } catch (error) {
  //       handleError({ error, title: 'Failed to load jobs' });
  //     }
  //   };

  //   const isMounted = isMountedCount.current > 1;
  //   if (isMounted && !jobListing.isLoading) {
  //     console.log('search params changed, reloading jobs');
  //     loadAsync();
  //   }

  //   isMountedCount.current += 1;
  // }, [searchParams]);

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

  return (
    <>
      <JobsList
        jobs={jobListing.jobs}
        selectedJobId={undefined}
        parentContainerId="jobs-feed"
        hasMore={jobListing.hasMore}
        onSelect={onSelectJob}
        onArchive={() => {}}
        onDelete={() => {}}
        onLoadMore={onLoadMore}
      />
    </>
  );

  // return (
  //   <JobTabs activeTab={currentStatus}>
  //     <JobsList
  //       jobs={jobs}
  //       selectedJobId={undefined}
  //       parentContainerId="jobs-feed"
  //       hasMore={!!listJobsResult.nextPageToken}
  //       onSelect={() => {}}
  //       onArchive={() => {}}
  //       onDelete={() => {}}
  //       onLoadMore={() => {}}
  //     />
  //   </JobTabs>
  // );
}
