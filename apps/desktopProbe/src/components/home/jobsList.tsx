import { createRef, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Job } from '@first2apply/core';
import { JobCard, useSites } from '@first2apply/ui';
import { useLinks } from '@first2apply/ui';

import { DeleteJobDialog } from './deleteJobDialog';

/**
 * List of jobs component.
 */
export function JobsList({
  jobs,
  selectedJobId,
  hasMore,
  parentContainerId,
  onLoadMore,
  onSelect,
  onArchive,
  onDelete,
}: {
  jobs: Job[];
  selectedJobId?: number;
  hasMore: boolean;
  parentContainerId: string;
  onLoadMore: () => void;
  onSelect: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
}) {
  const { siteLogos, siteMap } = useSites();
  const { links } = useLinks();

  const [jobToDelete, setJobToDelete] = useState<Job | undefined>();
  const [scrollToIndex, setScrollToIndex] = useState<number | undefined>();
  const itemRefs = useMemo(() => jobs.map(() => createRef<HTMLLIElement>()), [jobs]);
  const selectedIndex = jobs.findIndex((job) => job.id === selectedJobId);
  const linksMap = useMemo(() => new Map(links.map((link) => [link.id, link])), [links]);

  useEffect(() => {
    if (scrollToIndex === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      const selectedRef = itemRefs[scrollToIndex];
      if (selectedRef.current) {
        selectedRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        setScrollToIndex(undefined);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [scrollToIndex, itemRefs]);

  // Navigate between jobs using arrow keys
  useHotkeys(
    'down',
    () => {
      if (selectedIndex < jobs.length - 1) {
        // Check if not last job
        const nextIndex = selectedIndex + 1;
        onSelect(jobs[nextIndex]);
        setScrollToIndex(nextIndex);
      }
    },
    [selectedIndex, jobs],
  );
  useHotkeys(
    'up',
    () => {
      if (selectedIndex > 0) {
        // Check if not first job
        const prevIndex = selectedIndex - 1;
        onSelect(jobs[prevIndex]);
        setScrollToIndex(prevIndex);
      }
    },
    [selectedIndex, jobs],
  );

  // Archive job keyboard shortcut
  useHotkeys(
    'meta+a, ctrl+a',
    () => {
      if (selectedJobId) {
        const jobToArchive = jobs.find((job) => job.id === selectedJobId);
        if (jobToArchive && jobToArchive.status !== 'archived') {
          onArchive(jobToArchive);
        }
      }
    },
    [selectedJobId, jobs, onArchive],
    { preventDefault: true },
  );

  // Delete job keyboard shortcut
  useHotkeys(
    'meta+d, ctrl+d',
    () => {
      if (selectedJobId) {
        const jobToDelete = jobs.find((job) => job.id === selectedJobId);
        if (jobToDelete) {
          setJobToDelete(jobToDelete);
        }
      }
    },
    [selectedJobId, jobs, onDelete],
    { preventDefault: true },
  );

  return (
    <InfiniteScroll
      dataLength={jobs.length}
      next={onLoadMore}
      hasMore={hasMore}
      loader={<Icons.spinner2 />}
      scrollThreshold={0.8}
      scrollableTarget={parentContainerId}
    >
      <ul>
        {jobs.map((job, index) => {
          return (
            <li
              key={job.id}
              className={cn('-mt-[1px] rounded-lg px-5 pt-6', selectedJobId === job.id && 'bg-muted')}
              ref={itemRefs[index]}
              onClick={() => onSelect(job)}
            >
              <JobCard job={job} siteMap={siteMap} siteLogos={siteLogos} onArchive={onArchive} onDelete={onDelete} />

              <hr className="mt-6 w-full border-muted" />
            </li>
          );
        })}
      </ul>
      {jobToDelete && (
        <DeleteJobDialog
          isOpen={!!jobToDelete}
          job={jobToDelete}
          onClose={() => setJobToDelete(undefined)}
          onDelete={onDelete}
        />
      )}
    </InfiniteScroll>
  );
}

function getRelativeTimeString(date: Date, locale: string = 'en') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / (60 * 60));
  const days = Math.floor(diffInSeconds / (60 * 60 * 24));
  const weeks = Math.floor(diffInSeconds / (60 * 60 * 24 * 7));
  const months = Math.floor(diffInSeconds / (60 * 60 * 24 * 30));
  const years = Math.floor(diffInSeconds / (60 * 60 * 24 * 365));

  if (years >= 1) {
    return rtf.format(-years, 'year');
  } else if (months >= 1) {
    return rtf.format(-months, 'month');
  } else if (weeks >= 1) {
    return rtf.format(-weeks, 'week');
  } else if (days >= 1) {
    return rtf.format(-days, 'day');
  } else if (hours >= 1) {
    return rtf.format(-hours, 'hour');
  } else if (minutes >= 1) {
    return rtf.format(-minutes, 'minute');
  } else {
    return rtf.format(-Math.floor(diffInSeconds), 'second');
  }
}
