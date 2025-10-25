import { JobTabs } from '@/components/home/jobTabs';
import { JobsListSkeleton } from '@/components/home/jobsSkeleton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinks } from '@/hooks/links';
import { Link } from 'react-router-dom';

import { DefaultLayout } from './defaultLayout';

/**
 * Home page component.
 */
export function Home() {
  const { links, isLoading: isLoadingLinks } = useLinks();

  // Links are still loading
  if (isLoadingLinks) {
    return <Loading />;
  }

  // User has no links
  if (links.length === 0) {
    return <NoLinks />;
  }

  return (
    <DefaultLayout className="px-6 pt-6 md:px-10">
      <JobTabs />
    </DefaultLayout>
  );
}

/**
 * Links are still loading component.
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
 * User has no links component.
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
