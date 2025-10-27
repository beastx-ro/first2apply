import { Skeleton } from '@first2apply/ui';

/**
 * Skeleton for the JobsList component.
 */
export function JobsListSkeleton() {
  return (
    <ul>
      {Array.from({ length: 10 }).map((_, index) => (
        <li key={index} className="-mt-[1px] px-2 pt-6 xl:px-5">
          <div className="grow">
            <div className="flex flex-wrap items-center justify-between">
              {/* Company Name */}
              <Skeleton className="my-1.5 h-3 w-full max-w-20" />

              <div className="ml-auto flex gap-2">
                <Skeleton className="h-[22px] w-[22px]" />
                <Skeleton className="h-[22px] w-[22px]" />
              </div>
            </div>

            {/* Job Title */}
            <Skeleton className="mt-2 h-5 w-full max-w-52" />

            {/* Location, JobType, Salary & Tags */}
            <Skeleton className="mt-2 h-4 w-full max-w-32" />

            <div className="mt-[26px] flex items-center gap-12">
              {/* Source */}
              <div className="flex items-center gap-2">
                {/* Source logo */}
                <Skeleton className="h-6 min-w-6 rounded-full" />
                <Skeleton className="h-3.5 w-48" />
              </div>

              {/* Timestamp */}
              <Skeleton className="ml-auto h-3.5 w-full max-w-28" />
            </div>
          </div>
          <Skeleton className="mt-6 h-px w-full" /> {/* Divider */}
        </li>
      ))}
    </ul>
  );
}

/**
 * Skeleton for the JobSummary component.
 */
export function JobSummarySkeleton() {
  return (
    <div className="rounded-lg border border-muted p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4 lg:gap-6">
        <div className="flex-1">
          <Skeleton className="mt-3 h-7 w-full max-w-80 lg:mt-4" />
          <Skeleton className="mt-2 h-4 w-full max-w-52" />
        </div>

        <Skeleton className="h-16 w-16 rounded-full" />
      </div>

      <div className="mt-3 space-y-1.5 lg:mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 min-w-5" />
          <Skeleton className="h-5 w-full max-w-64" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 lg:mt-10">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-[148px] lg:ml-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the JobDetails component.
 */
export function JobDetailsSkeleton() {
  return (
    <div className="space-y-1 pl-[25px] pr-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-2/3" />
      <div className="h-6" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <div className="h-6" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[99%]" />
      <Skeleton className="h-6 w-[95%]" />
      <Skeleton className="h-6 w-[97%]" />
      <Skeleton className="h-6 w-[99%]" />
    </div>
  );
}
