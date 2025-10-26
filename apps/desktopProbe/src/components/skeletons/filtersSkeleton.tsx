import { Skeleton } from '@first2apply/ui';

export function FiltersSkeleton() {
  return (
    <>
      {/* Title skeleton */}
      <div className="mb-16">
        <Skeleton className="h-8 w-56 rounded-md" />
      </div>

      {/* Advanced matching skeleton */}
      <Skeleton className="mb-4 h-7 w-full max-w-[800px] rounded-md" />
      <Skeleton className="mb-2 h-[106px] w-full rounded-md" />
      <Skeleton className="mb-16 h-5 w-full max-w-[1056px] rounded-md" />

      {/* Company blacklisting skeleton */}
      <Skeleton className="mb-4 h-7 w-full max-w-[850px] rounded-md" />
      <div className="mb-2 flex items-center">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <Skeleton className="mb-4 h-5 w-full max-w-[430px] rounded-md" />

      <div className="flex items-center gap-2">
        <Skeleton className="h-[34px] w-24 rounded-md" />
        <Skeleton className="h-[34px] w-20 rounded-md" />
        <Skeleton className="h-[34px] w-32 rounded-md" />
        <Skeleton className="h-[34px] w-28 rounded-md" />
      </div>

      <Skeleton className="ml-auto mt-16 h-9 w-36 rounded-md" />
    </>
  );
}
