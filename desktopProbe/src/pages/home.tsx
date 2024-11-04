import { JobDetails } from '@/components/jobDetails';
import { JobFilters } from '@/components/jobFilters';
import { JobFiltersType } from '@/components/jobFilters/jobFiltersMenu';
import { JobNotes } from '@/components/jobNotes';
import { JobSummary } from '@/components/jobSummary';
import { JobsList } from '@/components/jobsList';
import { JobDetailsSkeleton, JobSummarySkeleton, JobsListSkeleton } from '@/components/skeletons/jobsSkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { useLinks } from '@/hooks/links';
import { useSession } from '@/hooks/session';
import {
  changeAllJobsStatus,
  exportJobsToCsv,
  getJobById,
  listJobs,
  openExternalUrl,
  scanJob,
  updateJobLabels,
  updateJobStatus,
} from '@/lib/electronMainSdk';
import { ArchiveIcon, DotsVerticalIcon, DownloadIcon, TrashIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Job, JobLabel, JobStatus } from '../../../supabase/functions/_shared/types';
import { DefaultLayout } from './defaultLayout';

const JOB_BATCH_SIZE = 30;
const ALL_JOB_STATUSES: JobStatus[] = ['new', 'applied', 'archived', 'excluded_by_advanced_matching'];

type JobListing = {
  isLoading: boolean;
  hasMore: boolean;
  jobs: Array<
    Job & {
      isLoadingJD?: boolean;
    }
  >;
  new: number;
  applied: number;
  archived: number;
  filtered: number;
  nextPageToken?: string;
};

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const navigate = useNavigate();
  const location = useLocation();
  const { isSubscriptionExpired } = useSession();

  const { links, isLoading: isLoadingLinks } = useLinks();

  const jobDescriptionRef = useRef<HTMLDivElement>(null);

  // Parse the query parameters to determine the active tab
  const searchParams = new URLSearchParams(location.search);
  const status = (searchParams.get('status') || 'new') as JobStatus;
  const search = searchParams.get('search') || undefined; // search query
  const siteIds = searchParams.get('site_ids') ? searchParams.get('site_ids').split(',').map(Number) : undefined;
  const linkIds = searchParams.get('link_ids') ? searchParams.get('link_ids').split(',').map(Number) : undefined;

  const [listing, setListing] = useState<JobListing>({
    isLoading: true,
    hasMore: true,
    jobs: [],
    new: 0,
    applied: 0,
    archived: 0,
    filtered: 0,
  });
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const selectedJob = listing.jobs.find((job) => job.id === selectedJobId);

  const statusIndex = ALL_JOB_STATUSES.indexOf(status);

  useHotkeys('left', () => {
    const nextIndex = (statusIndex - 1 + ALL_JOB_STATUSES.length) % ALL_JOB_STATUSES.length;
    navigate(`?status=${ALL_JOB_STATUSES[nextIndex]}&r=${Math.random()}`);
  });

  useHotkeys('right', () => {
    const nextIndex = (statusIndex + 1) % ALL_JOB_STATUSES.length;
    navigate(`?status=${ALL_JOB_STATUSES[nextIndex]}&r=${Math.random()}`);
  });

  // reload jobs when location changes
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // check subscription status
        if (isSubscriptionExpired) {
          navigate('/subscription');
          return;
        }

        console.log(location.search);
        setListing((listing) => ({ ...listing, isLoading: true }));

        const result = await listJobs({ status, search, siteIds, linkIds, limit: JOB_BATCH_SIZE });
        console.log('found jobs', result.jobs.length);

        setListing({
          ...result,
          isLoading: false,
          hasMore: result.jobs.length === JOB_BATCH_SIZE,
        });

        const firstJob = result.jobs[0];
        if (firstJob) {
          scanJobAndSelect(firstJob);
        } else {
          setSelectedJobId(null);
        }
      } catch (error) {
        handleError({ error, title: 'Failed to load jobs' });
      }
    };
    asyncLoad();
  }, [location.search]); // using location.search to trigger the effect when the query parameter changes

  // effect used to load a new batch of jobs after updating the status of a job
  // and there are still jobs to load
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        if (
          !listing.isLoading &&
          listing.jobs.length < JOB_BATCH_SIZE / 2 &&
          listing.hasMore &&
          listing.nextPageToken
        ) {
          setListing((l) => ({ ...l, isLoading: true }));
          const result = await listJobs({
            status,
            limit: JOB_BATCH_SIZE,
            after: listing.nextPageToken,
          });
          setListing((l) => ({
            ...result,
            jobs: l.jobs.concat(result.jobs),
            isLoading: false,
            hasMore: !!result.nextPageToken,
          }));
        }
      } catch (error) {
        handleError({ error });
      }
    };

    asyncLoad();
  }, [listing]);

  // Handle tab change
  const onTabChange = (tabValue: string) => {
    navigate(
      `?status=${tabValue}&search=${search}&site_ids=${siteIds?.join(',')}&link_ids=${linkIds?.join(',')}&r=${Math.random()}`,
    );
  };

  // archive all jobs from the current tab
  const onArchiveAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: status, to: 'archived' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs archived',
        description: `All your ${status} jobs have been archived, you can find them in the archived tab.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to archive all jobs' });
    }
  };

  // delete all jobs from the current tab
  const onDeleteAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: tab, to: 'deleted' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs deleted',
        description: `All your ${status} jobs have been deleted.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to delete all jobs' });
    }
  };

  // update the status of a job and remove it from the list if necessary
  const updateListedJobStatus = async (jobId: number, newStatus: JobStatus) => {
    await updateJobStatus({ jobId, status: newStatus });

    setListing((listing) => {
      const oldJob = listing.jobs.find((job) => job.id === jobId);
      const jobs = listing.jobs.filter((job) => job.id !== jobId);

      const tabToDecrement = oldJob?.status as JobStatus;
      const tabToIncrement = newStatus;

      const newCount =
        tabToIncrement === 'new' ? listing.new + 1 : tabToDecrement === 'new' ? listing.new - 1 : listing.new;
      const appliedCount =
        tabToIncrement === 'applied'
          ? listing.applied + 1
          : tabToDecrement === 'applied'
            ? listing.applied - 1
            : listing.applied;
      const archivedCount =
        tabToIncrement === 'archived'
          ? listing.archived + 1
          : tabToDecrement === 'archived'
            ? listing.archived - 1
            : listing.archived;
      const filteredCount =
        tabToDecrement === 'excluded_by_advanced_matching' ? listing.filtered - 1 : listing.filtered;

      return {
        ...listing,
        jobs,
        new: newCount,
        applied: appliedCount,
        archived: archivedCount,
        filtered: filteredCount,
      };
    });
  };

  // select the next job in the list
  const selectNextJob = (jobId: number) => {
    const currentJobIndex = listing.jobs.findIndex((job) => job.id === jobId);
    const nextJob = listing.jobs[currentJobIndex + 1] ?? listing.jobs[currentJobIndex - 1];
    if (nextJob) {
      scanJobAndSelect(nextJob);
    } else {
      setSelectedJobId(null);
    }
  };

  const onUpdateJobStatus = async (jobId: number, newStatus: JobStatus) => {
    try {
      await updateListedJobStatus(jobId, newStatus);
      selectNextJob(jobId);
    } catch (error) {
      handleError({ error, title: 'Failed to update job status' });
    }
  };

  const onApplyToJob = async (job: Job) => {
    try {
      await openExternalUrl(job.externalUrl);
      await updateJobLabels({ jobId: job.id, labels: ['Submitted'] });
      await updateListedJobStatus(job.id, 'applied');
      selectNextJob(job.id);
      toast({
        title: 'Job applied',
        description: 'The job has been automatically marked as applied.',
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to apply to job' });
    }
  };

  const onUpdateJobLabels = async (jobId: number, labels: JobLabel[]) => {
    try {
      const updatedJob = await updateJobLabels({ jobId, labels });
      setListing((listing) => ({
        ...listing,
        jobs: listing.jobs.map((job) => (job.id === jobId ? updatedJob : job)),
      }));
    } catch (error) {
      handleError({ error, title: 'Failed to update job label' });
    }
  };

  const onLoadMore = async () => {
    try {
      const result = await listJobs({
        status,
        limit: JOB_BATCH_SIZE,
        after: listing.nextPageToken,
      });

      setListing((listing) => ({
        ...result,
        jobs: [...listing.jobs, ...result.jobs],
        isLoading: false,
        hasMore: result.jobs.length === JOB_BATCH_SIZE,
      }));
    } catch (error) {
      handleError({ error, title: 'Failed to load more jobs' });
    }
  };

  /**
   * Select a job and open the job details panel.
   * If the jd is empty, scan the job to get the job description.
   */
  const scanJobAndSelect = async (job: Job) => {
    setSelectedJobId(job.id);

    if (!job.description) {
      try {
        // Set the job as loading
        setListing((listing) => {
          const jobs = listing.jobs.map((j) => (j.id === job.id ? { ...job, isLoadingJD: true } : j));
          return { ...listing, jobs };
        });

        // fetch job again, just in case the JD was scrapped in the background
        let updatedJob = await getJobById(job.id);

        // if the JD is still empty, scan the job to get the job description
        if (!updatedJob.description) {
          updatedJob = await scanJob(updatedJob);
        }

        // Update the job in the list
        setListing((listing) => {
          const jobs = listing.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
          return { ...listing, jobs };
        });
      } catch (error) {
        handleError({ error, title: 'Failed to scan job' });
      }
    }
  };

  /**
   * Open a job in the default browser.
   */
  const onViewJob = (job: Job) => {
    openExternalUrl(job.externalUrl);
  };

  /**
   * Download all jobs from the current tab as a CSV file.
   */
  const onCsvExport = async (tab: JobStatus) => {
    try {
      await exportJobsToCsv(tab);
      toast({
        title: 'Jobs exported',
        description: `All your ${tab} jobs have been exported to a CSV file.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to export jobs' });
    }
  };

  /**
   * Scroll to the top of the job description panel when the selected job changes.
   */
  useEffect(() => {
    if (jobDescriptionRef.current) {
      jobDescriptionRef.current.scrollTop = 0;
    }
  }, [selectedJobId]);

  /**
   * Update the query params when the search input changes.
   */
  const onSearchJobs = ({ search, filters }: { search: string; filters: JobFiltersType }) => {
    navigate(
      `?status=${status}&search=${search}&site_ids=${filters.sites.join(',')}&link_ids=${filters.links.join(',')}`,
    );
  };

  if (isLoadingLinks) {
    return <Loading />;
  }

  if (links.length === 0) {
    return <NoLinks />;
  }

  return (
    <DefaultLayout className="px-6 pt-6 md:px-10">
      <Tabs value={status} onValueChange={(value) => onTabChange(value)}>
        <TabsList className="h-fit w-full p-2">
          <TabsTrigger
            value="new"
            className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              status === 'new' ? 'justify-between' : 'justify-center'
            }`}
          >
            {status === 'new' && <span className="w-6" />}
            {search
              ? `Search results ${`(${listing.jobs.length}${listing.hasMore ? '+' : ''})`}`
              : `New jobs ${`(${listing.new})`}`}
            {status === 'new' && (
              <TabActions
                tab="new"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="applied"
            className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              status === 'applied' ? 'justify-between' : 'justify-center'
            }`}
          >
            {status === 'applied' && <span className="w-6" />}
            Applied {`(${listing.applied})`}
            {status === 'applied' && (
              <TabActions
                tab="applied"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              status === 'archived' ? 'justify-between' : 'justify-center'
            }`}
          >
            {status === 'archived' && <span className="w-6" />}
            Archived {`(${listing.archived})`}
            {status === 'archived' && (
              <TabActions
                tab="archived"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="excluded_by_advanced_matching"
            className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              status === 'excluded_by_advanced_matching' ? 'justify-between' : 'justify-center'
            }`}
          >
            {status === 'excluded_by_advanced_matching' && <span className="w-6" />}
            Filtered out {`(${listing.filtered})`}
            {status === 'excluded_by_advanced_matching' && (
              <TabActions
                tab="excluded_by_advanced_matching"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            )}
          </TabsTrigger>
        </TabsList>

        {ALL_JOB_STATUSES.map((statusItem) => {
          return (
            <TabsContent key={statusItem} value={statusItem} className="focus-visible:ring-0">
              <section className="flex">
                {/* jobs list */}
                <div
                  id="jobsList"
                  className="no-scrollbar h-[calc(100vh-100px)] w-1/2 space-y-3 overflow-scroll lg:w-2/5"
                >
                  <JobFilters search={search} siteIds={siteIds} linkIds={linkIds} onSearchJobs={onSearchJobs} />

                  {listing.isLoading || statusItem !== status ? (
                    <JobsListSkeleton />
                  ) : listing.jobs.length > 0 ? (
                    <JobsList
                      jobs={listing.jobs}
                      selectedJobId={selectedJobId}
                      hasMore={listing.hasMore}
                      parentContainerId="jobsList"
                      onLoadMore={onLoadMore}
                      onSelect={(job) => scanJobAndSelect(job)}
                      onArchive={(j) => {
                        onUpdateJobStatus(j.id, 'archived');
                      }}
                      onDelete={(j) => {
                        onUpdateJobStatus(j.id, 'deleted');
                      }}
                    />
                  ) : (
                    <p className="pt-20 text-center">
                      {search || (siteIds && siteIds.length > 0) || (linkIds && linkIds.length > 0)
                        ? "There aren't any jobs that match your search."
                        : "No new job listings right now, but don't worry! We're on the lookout and will update you as soon as we find anything."}
                    </p>
                  )}
                </div>

                {/* JD side panel */}
                {listing.isLoading || statusItem !== status ? (
                  <div className="h-[calc(100vh-100px)] w-1/2 animate-pulse space-y-4 overflow-scroll border-l-[1px] border-muted pl-2 lg:w-3/5 lg:space-y-5 lg:pl-4">
                    <JobSummarySkeleton />
                    <JobDetailsSkeleton />
                  </div>
                ) : listing.jobs.length > 0 ? (
                  <div
                    ref={jobDescriptionRef}
                    className="h-[calc(100vh-100px)] w-1/2 space-y-4 overflow-scroll border-l-[1px] border-muted pl-2 lg:w-3/5 lg:space-y-5 lg:pl-4"
                  >
                    {selectedJob && (
                      <>
                        <JobSummary
                          job={selectedJob}
                          onApply={(j) => {
                            onApplyToJob(j);
                          }}
                          onArchive={(j) => {
                            onUpdateJobStatus(j.id, 'archived');
                          }}
                          onDelete={(j) => {
                            onUpdateJobStatus(j.id, 'deleted');
                          }}
                          onUpdateLabels={onUpdateJobLabels}
                          onView={onViewJob}
                        />
                        <JobDetails job={selectedJob} isScrapingDescription={!!selectedJob.isLoadingJD}></JobDetails>
                        <hr className="border-t border-muted" />
                        <JobNotes jobId={selectedJobId} />
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    ref={jobDescriptionRef}
                    className="flex h-[calc(100vh-100px)] w-1/2 items-center justify-center space-y-4 overflow-scroll border-l-[1px] border-muted pl-2 lg:w-3/5 lg:space-y-5 lg:pl-4"
                  >
                    <svg
                      width="798"
                      height="835"
                      viewBox="0 0 798 835"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto mt-20 h-fit w-3/5 dark:hidden"
                    >
                      <g clip-path="url(#clip0_2004_166)">
                        <path
                          d="M308.5 834.5C478.88 834.5 617 810.1 617 780C617 749.9 478.88 725.5 308.5 725.5C138.12 725.5 0 749.9 0 780C0 810.1 138.12 834.5 308.5 834.5Z"
                          fill="#3F3D56"
                        />
                        <path
                          d="M496 603C662.514 603 797.5 468.014 797.5 301.5C797.5 134.986 662.514 0 496 0C329.486 0 194.5 134.986 194.5 301.5C194.5 468.014 329.486 603 496 603Z"
                          fill="#3F3D56"
                        />
                        <path
                          opacity="0.05"
                          d="M496 550.398C633.462 550.398 744.898 438.962 744.898 301.5C744.898 164.037 633.462 52.6021 496 52.6021C358.537 52.6021 247.102 164.037 247.102 301.5C247.102 438.962 358.537 550.398 496 550.398Z"
                          fill="black"
                        />
                        <path
                          opacity="0.05"
                          d="M496 505.494C608.663 505.494 699.994 414.163 699.994 301.5C699.994 188.837 608.663 97.5063 496 97.5063C383.337 97.5063 292.006 188.837 292.006 301.5C292.006 414.163 383.337 505.494 496 505.494Z"
                          fill="black"
                        />
                        <path
                          opacity="0.05"
                          d="M496 447.759C576.777 447.759 642.26 382.277 642.26 301.5C642.26 220.723 576.777 155.24 496 155.24C415.223 155.24 349.74 220.723 349.74 301.5C349.74 382.277 415.223 447.759 496 447.759Z"
                          fill="black"
                        />
                        <path
                          d="M197.17 328.482C197.17 328.482 173.466 395.205 184.001 418.909C194.536 442.613 211.217 465.439 211.217 465.439C211.217 465.439 205.071 332.872 197.17 328.482Z"
                          fill="#CCCCCC"
                        />
                        <path
                          opacity="0.1"
                          d="M196.868 329C196.868 329 173.164 395.722 183.699 419.426C194.234 443.13 210.915 465.956 210.915 465.956C210.915 465.956 204.769 333.39 196.868 329Z"
                          fill="black"
                        />
                        <path
                          d="M213.851 482.997C213.851 482.997 212.095 499.678 211.217 500.555C210.339 501.433 212.095 503.189 211.217 505.823C210.339 508.457 209.461 511.968 211.217 512.846C212.973 513.724 201.56 590.982 201.56 590.982C201.56 590.982 173.466 627.854 184.879 685.797L188.391 744.618C188.391 744.618 215.607 746.374 215.607 736.717C215.607 736.717 213.851 725.304 213.851 720.036C213.851 714.769 218.24 714.769 215.607 712.135C212.973 709.501 212.973 707.745 212.973 707.745C212.973 707.745 217.362 704.234 216.485 703.356C215.607 702.478 224.386 640.145 224.386 640.145C224.386 640.145 234.043 630.488 234.043 625.221V619.953C234.043 619.953 238.433 608.54 238.433 607.662C238.433 606.784 262.137 553.231 262.137 553.231L271.794 591.86L282.329 647.169C282.329 647.169 287.596 697.21 298.131 716.525C298.131 716.525 316.568 779.735 316.568 777.979C316.568 776.224 347.295 771.834 346.417 763.933C345.539 756.031 327.981 645.413 327.981 645.413L332.37 481.241L213.851 482.997Z"
                          fill="#2F2E41"
                        />
                        <path
                          d="M190.147 740.228C190.147 740.228 166.443 786.758 182.246 788.514C198.048 790.27 204.194 790.27 211.217 783.247C215.057 779.407 222.832 774.255 229.093 770.374C232.802 768.111 235.799 764.849 237.739 760.961C239.679 757.073 240.484 752.717 240.062 748.392C239.599 744.097 237.994 740.558 234.043 740.228C223.508 739.351 211.217 729.693 211.217 729.693L190.147 740.228Z"
                          fill="#2F2E41"
                        />
                        <path
                          d="M320.957 774.468C320.957 774.468 297.254 820.998 313.056 822.754C328.859 824.509 335.004 824.509 342.028 817.486C345.867 813.646 353.643 808.495 359.903 804.613C363.613 802.35 366.609 799.088 368.549 795.2C370.489 791.312 371.295 786.956 370.872 782.631C370.409 778.336 368.804 774.797 364.854 774.468C354.319 773.59 342.028 763.933 342.028 763.933L320.957 774.468Z"
                          fill="#2F2E41"
                        />
                        <path
                          d="M295.905 252.337C316.287 252.337 332.809 235.814 332.809 215.432C332.809 195.051 316.287 178.528 295.905 178.528C275.523 178.528 259 195.051 259 215.432C259 235.814 275.523 252.337 295.905 252.337Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M272.18 227.558C272.18 227.558 245.82 276.061 243.711 276.061C241.602 276.061 291.16 291.878 291.16 291.878C291.16 291.878 304.867 245.483 306.976 241.266L272.18 227.558Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M312.617 280.636C312.617 280.636 259.942 251.664 254.674 252.542C249.407 253.42 193.22 302.584 194.098 322.776C194.976 342.968 201.999 376.329 201.999 376.329C201.999 376.329 204.633 469.389 209.9 470.267C215.168 471.145 209.022 486.948 210.778 486.948C212.534 486.948 333.687 486.948 334.565 484.314C335.443 481.68 312.617 280.636 312.617 280.636Z"
                          fill="#CCCCCC"
                        />
                        <path
                          d="M342.028 489.142C342.028 489.142 358.708 540.062 344.661 538.306C330.615 536.55 324.469 494.41 324.469 494.41L342.028 489.142Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M297.254 277.562C297.254 277.562 264.77 284.586 270.038 328.482C275.306 372.378 284.963 416.274 284.963 416.274L317.446 487.386L320.958 500.555L344.662 494.41L327.103 392.57C327.103 392.57 320.958 283.708 313.056 280.196C308.074 278.072 302.656 277.169 297.254 277.562Z"
                          fill="#CCCCCC"
                        />
                        <path
                          opacity="0.1"
                          d="M277.5 414.958L317.885 486.947L283.86 411.09L277.5 414.958Z"
                          fill="black"
                        />
                        <path
                          d="M332.646 204.566L332.768 201.746L338.378 203.142C338.318 202.237 338.062 201.355 337.628 200.558C337.194 199.761 336.592 199.068 335.864 198.527L341.84 198.193C336.826 191.067 330.419 185.032 323.007 180.451C315.595 175.87 307.332 172.839 298.716 171.541C285.79 169.668 271.397 172.379 262.534 181.972C258.234 186.625 255.533 192.542 253.611 198.579C250.072 209.697 249.351 222.951 256.731 231.988C264.232 241.173 277.333 242.972 289.137 244.109C293.29 244.509 297.643 244.881 301.491 243.27C301.92 238.855 301.355 234.401 299.838 230.233C299.206 228.943 298.904 227.516 298.959 226.081C299.483 222.569 304.168 221.684 307.686 222.159C311.205 222.633 315.436 223.359 317.748 220.664C319.341 218.808 319.247 216.105 319.458 213.669C320.033 207.035 332.586 205.956 332.646 204.566Z"
                          fill="#2F2E41"
                        />
                        <path
                          d="M559 787.5C582.748 787.5 602 768.248 602 744.5C602 720.752 582.748 701.5 559 701.5C535.252 701.5 516 720.752 516 744.5C516 768.248 535.252 787.5 559 787.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 772.5C77.7482 772.5 97 753.248 97 729.5C97 705.752 77.7482 686.5 54 686.5C30.2518 686.5 11 705.752 11 729.5C11 753.248 30.2518 772.5 54 772.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 703.5C71.1208 703.5 85 689.621 85 672.5C85 655.379 71.1208 641.5 54 641.5C36.8792 641.5 23 655.379 23 672.5C23 689.621 36.8792 703.5 54 703.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 646.5C66.1503 646.5 76 636.65 76 624.5C76 612.35 66.1503 602.5 54 602.5C41.8497 602.5 32 612.35 32 624.5C32 636.65 41.8497 646.5 54 646.5Z"
                          fill="#809966"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_2004_166">
                          <rect width="797.5" height="834.5" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <svg
                      width="798"
                      height="835"
                      viewBox="0 0 798 835"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mx-auto my-10 hidden h-fit w-3/5 dark:block"
                    >
                      <g clip-path="url(#clip0_2004_70)">
                        <path
                          d="M308.5 834.5C478.88 834.5 617 810.1 617 780C617 749.9 478.88 725.5 308.5 725.5C138.12 725.5 0 749.9 0 780C0 810.1 138.12 834.5 308.5 834.5Z"
                          fill="#222222"
                        />
                        <path
                          d="M496 603C662.514 603 797.5 468.014 797.5 301.5C797.5 134.986 662.514 0 496 0C329.486 0 194.5 134.986 194.5 301.5C194.5 468.014 329.486 603 496 603Z"
                          fill="#222222"
                        />
                        <path
                          opacity="0.05"
                          d="M496 550.398C633.462 550.398 744.898 438.962 744.898 301.5C744.898 164.037 633.462 52.6021 496 52.6021C358.537 52.6021 247.102 164.037 247.102 301.5C247.102 438.962 358.537 550.398 496 550.398Z"
                          fill="black"
                        />
                        <path
                          opacity="0.05"
                          d="M496 505.494C608.663 505.494 699.994 414.163 699.994 301.5C699.994 188.837 608.663 97.5063 496 97.5063C383.337 97.5063 292.006 188.837 292.006 301.5C292.006 414.163 383.337 505.494 496 505.494Z"
                          fill="black"
                        />
                        <path
                          opacity="0.05"
                          d="M496 447.759C576.777 447.759 642.26 382.277 642.26 301.5C642.26 220.723 576.777 155.24 496 155.24C415.223 155.24 349.74 220.723 349.74 301.5C349.74 382.277 415.223 447.759 496 447.759Z"
                          fill="black"
                        />
                        <path
                          d="M197.17 328.482C197.17 328.482 173.466 395.205 184.001 418.909C194.536 442.613 211.217 465.439 211.217 465.439C211.217 465.439 205.071 332.872 197.17 328.482Z"
                          fill="#CCCCCC"
                        />
                        <path
                          opacity="0.1"
                          d="M196.868 329C196.868 329 173.164 395.722 183.699 419.426C194.234 443.13 210.915 465.956 210.915 465.956C210.915 465.956 204.769 333.39 196.868 329Z"
                          fill="black"
                        />
                        <path
                          d="M213.851 482.997C213.851 482.997 212.095 499.678 211.217 500.555C210.339 501.433 212.095 503.189 211.217 505.823C210.339 508.457 209.461 511.968 211.217 512.846C212.973 513.724 201.56 590.982 201.56 590.982C201.56 590.982 173.466 627.854 184.879 685.797L188.391 744.618C188.391 744.618 215.607 746.374 215.607 736.717C215.607 736.717 213.851 725.304 213.851 720.036C213.851 714.769 218.24 714.769 215.607 712.135C212.973 709.501 212.973 707.745 212.973 707.745C212.973 707.745 217.362 704.234 216.485 703.356C215.607 702.478 224.386 640.145 224.386 640.145C224.386 640.145 234.043 630.488 234.043 625.221V619.953C234.043 619.953 238.433 608.54 238.433 607.662C238.433 606.784 262.137 553.231 262.137 553.231L271.794 591.86L282.329 647.169C282.329 647.169 287.596 697.21 298.131 716.525C298.131 716.525 316.568 779.735 316.568 777.979C316.568 776.224 347.295 771.834 346.417 763.933C345.539 756.031 327.981 645.413 327.981 645.413L332.37 481.241L213.851 482.997Z"
                          fill="#717171"
                        />
                        <path
                          d="M190.147 740.228C190.147 740.228 166.443 786.758 182.246 788.514C198.048 790.27 204.194 790.27 211.217 783.247C215.057 779.407 222.832 774.255 229.093 770.374C232.802 768.111 235.799 764.849 237.739 760.961C239.679 757.073 240.484 752.717 240.062 748.392C239.599 744.097 237.994 740.558 234.043 740.228C223.508 739.351 211.217 729.693 211.217 729.693L190.147 740.228Z"
                          fill="#717171"
                        />
                        <path
                          d="M320.957 774.468C320.957 774.468 297.254 820.998 313.056 822.754C328.859 824.509 335.004 824.509 342.028 817.486C345.867 813.646 353.643 808.495 359.903 804.613C363.613 802.35 366.609 799.088 368.549 795.2C370.489 791.312 371.295 786.956 370.872 782.631C370.409 778.336 368.804 774.797 364.854 774.468C354.319 773.59 342.028 763.933 342.028 763.933L320.957 774.468Z"
                          fill="#717171"
                        />
                        <path
                          d="M295.905 252.337C316.287 252.337 332.809 235.814 332.809 215.432C332.809 195.051 316.287 178.528 295.905 178.528C275.523 178.528 259 195.051 259 215.432C259 235.814 275.523 252.337 295.905 252.337Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M272.18 227.558C272.18 227.558 245.82 276.061 243.711 276.061C241.602 276.061 291.16 291.878 291.16 291.878C291.16 291.878 304.867 245.483 306.976 241.266L272.18 227.558Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M312.617 280.636C312.617 280.636 259.942 251.664 254.674 252.542C249.407 253.42 193.22 302.584 194.098 322.776C194.976 342.968 201.999 376.329 201.999 376.329C201.999 376.329 204.633 469.389 209.9 470.267C215.168 471.145 209.022 486.948 210.778 486.948C212.534 486.948 333.687 486.948 334.565 484.314C335.443 481.68 312.617 280.636 312.617 280.636Z"
                          fill="#CCCCCC"
                        />
                        <path
                          d="M342.028 489.142C342.028 489.142 358.708 540.062 344.661 538.306C330.615 536.55 324.469 494.41 324.469 494.41L342.028 489.142Z"
                          fill="#FFB8B8"
                        />
                        <path
                          d="M297.254 277.562C297.254 277.562 264.77 284.586 270.038 328.482C275.306 372.378 284.963 416.274 284.963 416.274L317.446 487.386L320.958 500.555L344.662 494.41L327.103 392.57C327.103 392.57 320.958 283.708 313.056 280.196C308.074 278.072 302.656 277.169 297.254 277.562Z"
                          fill="#CCCCCC"
                        />
                        <path
                          opacity="0.1"
                          d="M277.5 414.958L317.885 486.947L283.86 411.09L277.5 414.958Z"
                          fill="black"
                        />
                        <path
                          d="M332.646 204.566L332.768 201.746L338.378 203.142C338.318 202.237 338.062 201.355 337.628 200.558C337.194 199.761 336.592 199.068 335.864 198.527L341.84 198.193C336.826 191.067 330.419 185.032 323.007 180.451C315.595 175.87 307.332 172.839 298.716 171.541C285.79 169.668 271.397 172.379 262.534 181.972C258.234 186.625 255.533 192.542 253.611 198.579C250.072 209.697 249.351 222.951 256.731 231.988C264.232 241.173 277.333 242.972 289.137 244.109C293.29 244.509 297.643 244.881 301.491 243.27C301.92 238.855 301.355 234.401 299.838 230.233C299.206 228.943 298.904 227.516 298.959 226.081C299.483 222.569 304.168 221.684 307.686 222.159C311.205 222.633 315.436 223.359 317.748 220.664C319.341 218.808 319.247 216.105 319.458 213.669C320.033 207.035 332.586 205.956 332.646 204.566Z"
                          fill="#717171"
                        />
                        <path
                          d="M559 787.5C582.748 787.5 602 768.248 602 744.5C602 720.752 582.748 701.5 559 701.5C535.252 701.5 516 720.752 516 744.5C516 768.248 535.252 787.5 559 787.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 772.5C77.7482 772.5 97 753.248 97 729.5C97 705.752 77.7482 686.5 54 686.5C30.2518 686.5 11 705.752 11 729.5C11 753.248 30.2518 772.5 54 772.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 703.5C71.1208 703.5 85 689.621 85 672.5C85 655.379 71.1208 641.5 54 641.5C36.8792 641.5 23 655.379 23 672.5C23 689.621 36.8792 703.5 54 703.5Z"
                          fill="#809966"
                        />
                        <path
                          d="M54 646.5C66.1503 646.5 76 636.65 76 624.5C76 612.35 66.1503 602.5 54 602.5C41.8497 602.5 32 612.35 32 624.5C32 636.65 41.8497 646.5 54 646.5Z"
                          fill="#809966"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_2004_70">
                          <rect width="797.5" height="834.5" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                )}
              </section>
            </TabsContent>
          );
        })}
      </Tabs>
    </DefaultLayout>
  );
}

/**
 * Component used when links are still loading.
 */
function Loading() {
  return (
    <DefaultLayout className="p-6 pb-0 md:px-10">
      <div className="mb-2 flex h-[68px] w-full animate-pulse flex-row gap-1 rounded-lg bg-[#809966]/5 p-2">
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
      </div>

      <JobsListSkeleton />
    </DefaultLayout>
  );
}

/**
 * Component used when the user has no links.
 */
function NoLinks() {
  return (
    <DefaultLayout className={`flex h-screen w-full max-w-[800px] flex-col justify-evenly pb-14 md:px-10 lg:px-20`}>
      <div className="flex flex-col items-center gap-10">
        <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl">
          Be the: <span className="text-primary">first 2 apply</span>
        </h1>
        <p className="text-center text-muted-foreground">
          Save your tailored job searches from top job platforms, and let us do the heavy lifting. We'll monitor your
          specified job feeds and swiftly notify you of new postings, providing you the edge to be the first in line.
        </p>
        <Link to="/links">
          <Button>Add new search</Button>
        </Link>
      </div>
    </DefaultLayout>
  );
}

/**
 * Tab actions component.
 */
function TabActions({
  tab,
  onTabChange,
  onCsvExport,
  onArchiveAll,
  onDeleteAll,
}: {
  tab: JobStatus;
  onTabChange: (tab: JobStatus) => void;
  onCsvExport: (tab: JobStatus) => Promise<void>;
  onArchiveAll: (tab: JobStatus) => Promise<void>;
  onDeleteAll: (tab: JobStatus) => Promise<void>;
}) {
  const [isArchiveAllDialogOpen, setIsArchiveAllDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-6 w-6 focus-visible:outline-none focus-visible:ring-0"
          onClick={(evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          }}
        >
          <DotsVerticalIcon className="m-auto h-5 w-auto text-muted-foreground transition-all duration-200 ease-in-out hover:h-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="space-y-1">
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onTabChange(tab)}>
            <UpdateIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onCsvExport(tab)}>
            <DownloadIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            CSV export
          </DropdownMenuItem>
          {tab !== 'archived' && (
            <DropdownMenuItem
              className="cursor-pointer focus:bg-secondary/40"
              onClick={() => setIsArchiveAllDialogOpen(true)}
            >
              <ArchiveIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
              Archive all
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer bg-destructive/5 focus:bg-destructive/20"
            onClick={() => setIsDeleteAllDialogOpen(true)}
          >
            <TrashIcon className="-ml-0.5 mb-0.5 mr-2 inline-block h-5 w-5 text-destructive" />
            Delete all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* archive all jobs confirm dialog */}
      <AlertDialog open={isArchiveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and all jobs will be moved to the archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsArchiveAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsArchiveAllDialogOpen(false);
                onArchiveAll(tab);
              }}
            >
              <ArchiveIcon className="mr-2 inline-block h-4 w-4" />
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* delete all jobs confirm dialog */}
      <AlertDialog open={isDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone, you won't ever see these jobs again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setIsDeleteAllDialogOpen(false);
                onDeleteAll(tab);
              }}
            >
              <TrashIcon className="mr-2 inline-block h-5 w-5" />
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
