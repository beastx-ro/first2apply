import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReloadIcon } from "@radix-ui/react-icons";

import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";

import {
  listJobs,
  updateJobStatus,
  scanJob,
  openExternalUrl,
} from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { JobsSkeleton } from "@/components/skeletons/jobsSkeleton";
import { Button } from "@/components/ui/button";
import { JobsList } from "@/components/jobsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobDetails } from "@/components/jobDetails";

import { Job, JobStatus } from "../../../supabase/functions/_shared/types";
import { JobSummary } from "@/components/jobSummary";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

const JOB_BATCH_SIZE = 30;
const ALL_JOB_STATUSES: JobStatus[] = ["new", "applied", "archived"];

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
  nextPageToken?: string;
};

/**
 * Component that renders the home page.
 */
export function Home() {
  const { handleError } = useError();

  const navigate = useNavigate();
  const location = useLocation();

  const { links, isLoading: isLoadingLinks } = useLinks();

  // Parse the query parameters to determine the active tab
  const status = (new URLSearchParams(location.search).get("status") ||
    "new") as JobStatus;

  const [listing, setListing] = useState<JobListing>({
    isLoading: true,
    hasMore: true,
    jobs: [],
    new: 0,
    applied: 0,
    archived: 0,
  });
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const selectedJob = listing.jobs.find((job) => job.id === selectedJobId);

  // Update jobs when location changes
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        setListing((listing) => ({ ...listing, isLoading: true }));
        const result = await listJobs({ status, limit: JOB_BATCH_SIZE });

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
        handleError({ error, title: "Failed to load jobs" });
      }
    };
    asyncLoad();
  }, [status, location.search]); // using location.search to trigger the effect when the query parameter changes

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
    navigate(`?status=${tabValue}&r=${Math.random()}`);
  };

  // update the status of a job and remove it from the list if necessary
  const updateListedJobStatus = async (
    jobId: number,
    newStatus: JobStatus,
    removeFromList: boolean = true
  ) => {
    await updateJobStatus({ jobId, status: newStatus });

    setListing((listing) => {
      const oldJob = listing.jobs.find((job) => job.id === jobId);
      const jobs = removeFromList
        ? listing.jobs.filter((job) => job.id !== jobId)
        : listing.jobs.map((job) => {
            if (job.id === jobId) {
              return { ...job, status: newStatus };
            }
            return job;
          });

      const tabToDecrement = oldJob?.status as JobStatus;
      const tabToIncrement = newStatus;

      const newCount =
        tabToIncrement === "new"
          ? listing.new + 1
          : tabToDecrement === "new"
          ? listing.new - 1
          : listing.new;
      const appliedCount =
        tabToIncrement === "applied"
          ? listing.applied + 1
          : tabToDecrement === "applied"
          ? listing.applied - 1
          : listing.applied;
      const archivedCount =
        tabToIncrement === "archived"
          ? listing.archived + 1
          : tabToDecrement === "archived"
          ? listing.archived - 1
          : listing.archived;

      return {
        ...listing,
        jobs,
        new: newCount,
        applied: appliedCount,
        archived: archivedCount,
      };
    });
  };

  const onUpdateJobStatus = async (jobId: number, newStatus: JobStatus) => {
    try {
      updateListedJobStatus(jobId, newStatus);
    } catch (error) {
      handleError({ error, title: "Failed to update job status" });
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
      handleError({ error, title: "Failed to load more jobs" });
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
          const jobs = listing.jobs.map((j) =>
            j.id === job.id ? { ...job, isLoadingJD: true } : j
          );
          return { ...listing, jobs };
        });

        const updatedJob = await scanJob(job);

        // Update the job in the list
        setListing((listing) => {
          const jobs = listing.jobs.map((j) =>
            j.id === updatedJob.id ? updatedJob : j
          );
          return { ...listing, jobs };
        });
      } catch (error) {
        handleError({ error, title: "Failed to scan job" });
      }
    }
  };

  /**
   * Mark a job as applied and inform the user via toast.
   */
  const onApply = async (job: Job) => {
    try {
      // open url in default browser
      openExternalUrl(job.externalUrl);

      // update the job status in the list
      await updateListedJobStatus(job.id, "applied", false);

      // notify the user with options to undo
      toast({
        title: "Job marked as applied",
        description: `"${job.title}" has been automatically marked as applied. If this was a mistake, you can undo this action.`,
        variant: "success",
        duration: Infinity,
        action: (
          <ToastAction
            altText="undo"
            className="bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
            onClick={() => {
              updateListedJobStatus(job.id, status, false).catch((error) => {
                handleError({ error, title: "Failed to undo" });
              });
            }}
          >
            Undo
          </ToastAction>
        ),
      });
    } catch (error) {
      handleError({ error, title: "Failed to mark job as applied" });
    }
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
        <TabsList className="w-full h-fit p-2">
          <TabsTrigger value="new" className="px-6 py-2.5 flex-1">
            <div className="w-full flex items-center pl-9">
              <span className="flex-1">New Jobs {`(${listing.new})`}</span>
              <Button
                variant="outline"
                size="sm"
                className={`w-8 ${
                  status === "new"
                    ? "opacity-100 transition-all duration-300"
                    : "opacity-0 pointer-events-none"
                }`}
                onClick={(evt) => {
                  evt.preventDefault();
                  evt.stopPropagation();
                  onTabChange("new");
                }}
              >
                <ReloadIcon className="h-4 w-auto shrink-0 text-muted-foreground transition-transform duration-200" />
              </Button>
            </div>
          </TabsTrigger>
          <TabsTrigger value="applied" className="px-6 py-4 flex-1">
            Applied {`(${listing.applied})`}
          </TabsTrigger>
          <TabsTrigger value="archived" className="px-6 py-4 flex-1">
            Archived {`(${listing.archived})`}
          </TabsTrigger>
        </TabsList>

        {listing.jobs.length > 0 ? (
          ALL_JOB_STATUSES.map((statusItem) => {
            return (
              <TabsContent key={statusItem} value={statusItem}>
                {listing.isLoading || statusItem !== status ? (
                  <JobsSkeleton />
                ) : (
                  <section className="flex">
                    {/* jobs list */}
                    <div
                      id="jobsList"
                      className="w-1/2 lg:w-2/5 h-[calc(100vh-100px)] overflow-scroll no-scrollbar"
                    >
                      <JobsList
                        jobs={listing.jobs}
                        selectedJobId={selectedJobId}
                        hasMore={listing.hasMore}
                        parentContainerId="jobsList"
                        onUpdateJobStatus={onUpdateJobStatus}
                        onLoadMore={onLoadMore}
                        onSelect={(job) => scanJobAndSelect(job)}
                      />
                    </div>

                    {/* JD side panel */}
                    <div className="w-1/2 lg:w-3/5 h-[calc(100vh-100px)] overflow-scroll border-l-[1px] border-muted pl-2 lg:pl-4 space-y-4 lg:space-y-5">
                      {selectedJob && (
                        <>
                          <JobSummary
                            job={selectedJob}
                            onApply={onApply}
                            onArchive={(j) => {
                              onUpdateJobStatus(j.id, "archived");
                            }}
                          />
                          <JobDetails
                            job={selectedJob}
                            isScrapingDescription={!!selectedJob.isLoadingJD}
                          ></JobDetails>
                        </>
                      )}
                    </div>
                  </section>
                )}
              </TabsContent>
            );
          })
        ) : (
          <p className="text-center mt-20 max-w-md m-auto">
            No new job listings right now, but don't worry! We're on the lookout
            and will update you as soon as we find anything.
          </p>
        )}
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
      <div className="h-[68px] bg-[#809966]/5 w-full rounded-lg flex flex-row gap-1 p-2 animate-pulse mb-2">
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
      </div>

      <JobsSkeleton />
    </DefaultLayout>
  );
}

/**
 * Component used when the user has no links.
 */
function NoLinks() {
  return (
    <DefaultLayout
      className={`flex flex-col justify-evenly h-screen pb-14 max-w-[800px] w-full md:px-10 lg:px-20`}
    >
      <div className="flex flex-col items-center gap-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
          Be the: <span className="text-primary">first 2 apply</span>
        </h1>
        <p className="text-muted-foreground text-center">
          Save your tailored job searches from top job platforms, and let us do
          the heavy lifting. We'll monitor your specified job feeds and swiftly
          notify you of new postings, providing you the edge to be the first in
          line.
        </p>
        <Link to="/links">
          <Button>Add new search</Button>
        </Link>
      </div>
    </DefaultLayout>
  );
}
