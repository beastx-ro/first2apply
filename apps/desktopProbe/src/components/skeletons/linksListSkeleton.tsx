import { FC } from 'react';

import { Skeleton } from '@first2apply/ui';

export const LinksListSkeleton: FC = () => {
  return (
    <>
      {/* Title skeleton */}
      <div className="flex items-start justify-between">
        <Skeleton className="h-8 w-[152px] rounded-md" />
        <Skeleton className="h-10 w-[166px] rounded-md" />
      </div>

      {/* List skeleton */}
      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
        {Array.from({ length: 9 }).map((_, index) => (
          <li
            key={index}
            className="flex animate-pulse cursor-pointer flex-col gap-4 rounded-lg border border-border bg-card px-6 pb-6 pt-8 shadow-sm"
          >
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <Skeleton className="h-12 w-12 rounded-full" />

              <div>
                {/* Site name */}
                <Skeleton className="mb-1 h-2 w-32" />
                {/* Title */}
                <Skeleton className="h-5 w-64" />
              </div>
            </div>

            {/* URL */}
            <div className="mb-4 mt-7 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>

              {/* Button skeleton */}
              <Skeleton className="d h-9 w-9 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
