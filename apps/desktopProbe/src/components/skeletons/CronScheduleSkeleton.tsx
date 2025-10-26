import { FC } from 'react';

import { Skeleton } from '@first2apply/ui';

export const CronScheduleSkeleton: FC = () => {
  return (
    <div className="flex h-[102px] animate-pulse flex-row items-center justify-between rounded-lg border p-6">
      <div className="space-y-1">
        {/* Title */}
        <Skeleton className="mb-2 h-6 w-[146px]" />
        {/* Subtitle */}
        <Skeleton className="h-4 w-[325px]" />
      </div>
      {/* Select */}
      <Skeleton className="h-9 w-[180px]" />
    </div>
  );
};
