"use client";

import { JobTabs } from "@/components/home/jobTabs";
import { JobsListSkeleton } from "@/components/home/jobsSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLinks } from "@/hooks/links";
import Link from "next/link";

/**
 * Home page component.
 */
export default function Home() {
  const { links, isLoading: isLoadingLinks } = useLinks();

  // Links are still loading
  if (isLoadingLinks) {
    return <Loading />;
  }

  // User has no links
  if (links.length === 0) {
    return <NoLinks />;
  }

  return <JobTabs />;
}

/**
 * Links are still loading component.
 */
function Loading() {
  return (
    <>
      <div className="mb-2 flex h-[68px] w-full animate-pulse flex-row gap-1 rounded-lg bg-[#809966]/5 p-2">
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
      </div>

      <JobsListSkeleton />
    </>
  );
}

/**
 * User has no links component.
 */
function NoLinks() {
  return (
    <>
      <div className="mt-24 flex flex-col items-center gap-10  max-w-[900px] mx-auto">
        <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl">
          Be the: <span className="text-primary">first 2 apply</span>
        </h1>
        <p className="text-center text-muted-foreground">
          Save your tailored job searches from top job platforms, and let us do
          the heavy lifting. We'll monitor your specified job feeds and swiftly
          notify you of new postings, providing you the edge to be the first in
          line.
        </p>
        <p className="text-center text-muted-foreground">
          First 2 Apply is a{" "}
          <Link href="/help" className="text-primary underline">
            DESKTOP app
          </Link>
          , you will need to install it on your computer and let it run in the
          background. It will notify you when new jobs are available.
        </p>
        <Link href="https://first2apply.com/download">
          <Button>Download app</Button>
        </Link>
      </div>
    </>
  );
}
