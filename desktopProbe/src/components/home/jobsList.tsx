import { Icons } from '@/components/icons';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { LABEL_COLOR_CLASSES } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { ArchiveIcon, TrashIcon } from '@radix-ui/react-icons';
import { createRef, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Job } from '../../../../supabase/functions/_shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
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
  const { siteLogos } = useSites();
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
          const fromLink = linksMap.get(job.link_id)?.title;

          return (
            <li
              key={job.id}
              className={cn('-mt-[1px] rounded-lg px-5 pt-6', selectedJobId === job.id && 'bg-muted')}
              ref={itemRefs[index]}
              onClick={() => onSelect(job)}
            >
              <div className="flex flex-wrap-reverse items-center justify-between gap-1.5">
                {/* Company Name */}
                <p className="my-1.5 text-xs text-muted-foreground">{job.companyName}</p>

                {/* Action buttons */}
                <div className="ml-auto flex items-center gap-2">
                  {/* Archive button */}
                  {job.status !== 'archived' && (
                    <TooltipProvider delayDuration={500}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="secondary"
                            className="h-[22px] w-[22px] rounded-sm bg-transparent px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus:bg-foreground/10"
                            onClick={(evt) => {
                              onArchive(job);
                              evt.stopPropagation();
                            }}
                          >
                            <ArchiveIcon className="min-h-4 w-fit text-foreground" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent side="bottom" className="text-base">
                          Archive
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Delete button */}
                  <TooltipProvider delayDuration={500}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="destructive"
                          className="h-[22px] w-[22px] rounded-sm bg-transparent px-0 transition-colors duration-200 ease-in-out hover:bg-destructive/20 focus:bg-destructive/20"
                          onClick={(evt) => {
                            // onDelete(job);
                            setJobToDelete(job);
                            evt.stopPropagation();
                          }}
                        >
                          <TrashIcon className="h-5 w-auto text-destructive" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent side="bottom" className="text-base">
                        Delete
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Job Title */}
              <p className="mt-2 leading-5 tracking-wide">{job.title}</p>

              <div className="mt-1.5 flex items-center justify-between gap-4">
                {/* Location, JobType, Salary & Tags */}
                <p className="text-sm leading-[18px] tracking-tight text-foreground/80">
                  {job.location && <span>{job.location}</span>}
                  {job.jobType && (
                    <>
                      {job.location && <span className="mx-1 text-[14px] font-light text-foreground/40"> | </span>}
                      <span>{job.jobType}</span>
                    </>
                  )}
                  {job.salary && (
                    <>
                      {(job.location || job.jobType) && (
                        <span className="mx-1 text-[14px] font-light text-foreground/40"> | </span>
                      )}
                      <span>{job.salary}</span>
                    </>
                  )}
                  {job.tags?.map((tag) => (
                    <>
                      {(job.location || job.jobType || job.salary) && (
                        <span className="text-3 mx-[14px] font-light text-foreground/40"> | </span>
                      )}
                      <span>| {tag}</span>
                    </>
                  ))}
                </p>

                {/* Job Label */}
                {job.labels[0] && (
                  <div
                    className={`w-[85px] flex-shrink-0 rounded-md bg-opacity-80 py-1 text-center text-xs leading-3 text-white dark:bg-opacity-60 ${
                      LABEL_COLOR_CLASSES[job.labels[0]]
                    }`}
                  >
                    {job.labels[0]}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-12">
                {/* Source */}
                {fromLink && (
                  <p className="flex items-center gap-2 text-xs leading-3 text-foreground/80">
                    {/* Source logo */}
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={siteLogos[job.siteId]} />
                      <AvatarFallback>LI</AvatarFallback>
                    </Avatar>
                    {fromLink}
                  </p>
                )}

                {/* Timestamp */}
                <p className="ml-auto w-fit flex-shrink-0 text-xs text-foreground/80">
                  detected {getRelativeTimeString(new Date(job.created_at))}
                </p>
              </div>

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
