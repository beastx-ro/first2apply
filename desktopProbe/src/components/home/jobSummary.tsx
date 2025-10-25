import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { LABEL_COLOR_CLASSES } from '@/lib/labels';
import {
  ArchiveIcon,
  BackpackIcon,
  CheckIcon,
  CookieIcon,
  CopyIcon,
  InfoCircledIcon,
  ListBulletIcon,
  ResetIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import React, { useMemo } from 'react';

import { JOB_LABELS, Job, JobLabel, JobStatus } from '../../../../supabase/functions/_shared/types';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from '../ui/use-toast';
import { DeleteJobDialog } from './deleteJobDialog';

function isJobLabel(value: any): value is JobLabel {
  return Object.values(JOB_LABELS).includes(value);
}

/**
 * Job summary component.
 */
export function JobSummary({
  job,
  onView,
  onUpdateJobStatus,
  onUpdateLabels,
  onOpenUrl,
}: {
  job: Job;
  onView: (job: Job) => void;
  onUpdateJobStatus: (jobId: number, status: JobStatus) => void;
  onUpdateLabels: (jobId: number, labels: JobLabel[]) => void;
  onOpenUrl: (url: string) => void;
}) {
  const { siteLogos } = useSites();
  const { links } = useLinks();

  const usedLink = useMemo(() => {
    return links.find((l) => l.id === job.link_id);
  }, [links, job.link_id]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-muted p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4 lg:gap-6">
        <div>
          {/* search site */}
          {usedLink && (
            <a
              className="flex items-center gap-2 text-sm text-muted-foreground"
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpenUrl(usedLink.url);
              }}
            >
              <img src={siteLogos[usedLink.site_id]} alt={usedLink.title} className="h-5" />
              <span>
                {' via '}
                {usedLink.title}
              </span>
            </a>
          )}

          {/* Job title */}
          <h1 className="mt-3 text-xl font-medium lg:mt-4">{job.title}</h1>

          {/* Company name & location */}
          <p className="text-sm text-muted-foreground">
            {job.companyName}
            {job.location && (
              <span>
                {' · '}
                {job.location}
              </span>
            )}
          </p>
        </div>

        {/* Company logo */}
        {job.companyLogo && (
          <Avatar className="h-16 w-16">
            <AvatarImage src={job.companyLogo} />
          </Avatar>
        )}
      </div>

      {/* Job details */}
      <div className="mt-3 space-y-1.5 lg:mt-4">
        {job.jobType && (
          <div className="flex items-center gap-3 capitalize text-muted-foreground">
            <BackpackIcon className="h-auto w-5" />
            {job.jobType}
          </div>
        )}
        {job.salary && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <CookieIcon className="h-auto w-5" />
            {job.salary}
          </div>
        )}
        {job.tags.length > 0 && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <ListBulletIcon className="h-auto w-5" />
            <p>{job.tags?.slice(0, 5).join(', ')}</p>
          </div>
        )}
      </div>

      {/* Filtered out job explainer */}
      {job.status === 'excluded_by_advanced_matching' && job.exclude_reason && (
        <div className="mt-6 rounded-md bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <InfoCircledIcon className="h-auto w-5" />
            <p className="font-medium">Why was this job excluded?</p>
          </div>
          <p className="mt-1">{job.exclude_reason}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className={`mt-6 flex flex-wrap gap-2 ${job.status !== 'excluded_by_advanced_matching' && 'lg:mt-10'}`}>
        {/* Open button */}
        <Button
          size="lg"
          className="w-24 text-sm"
          onClick={() => {
            onView(job);
          }}
        >
          Open
        </Button>

        {/* Apply button */}
        {job.status !== 'applied' && (
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-10 border-none bg-border px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/15 focus:bg-foreground/15"
                  onClick={() => onUpdateJobStatus(job.id, 'applied')}
                >
                  <CheckIcon className="h-5 w-auto" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom" className="text-base">
                Mark job as Applied
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Back to new button */}
        {job.status !== 'new' && (
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-10 border-none bg-border px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/15 focus:bg-foreground/15"
                  onClick={() => onUpdateJobStatus(job.id, 'new')}
                >
                  <ResetIcon className="h-4 w-auto" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom" className="text-base">
                Move job back to New
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Archive button */}
        {job.status !== 'archived' && (
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-10 border-none bg-border px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/15 focus:bg-foreground/15"
                  onClick={() => onUpdateJobStatus(job.id, 'archived')}
                >
                  <ArchiveIcon className="h-4 w-auto" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom" className="text-base">
                Archive
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Copy url button */}
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="lg"
                variant="secondary"
                className="w-10 border-none bg-border px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/15 focus:bg-foreground/15"
                onClick={(evt) => {
                  evt.stopPropagation();
                  navigator.clipboard.writeText(job.externalUrl);
                  toast({
                    title: 'Job URL copied to clipboard',
                    description: 'You can now paste it anywhere.',
                    variant: 'success',
                  });
                }}
              >
                <CopyIcon className="h-4 w-auto" />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="text-base">
              Copy URL
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Delete button */}
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="lg"
                variant="destructive"
                className="w-10 bg-destructive/10 px-0 transition-colors duration-200 ease-in-out hover:bg-destructive/20 focus:bg-destructive/20"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <TrashIcon className="h-5 w-auto text-destructive" />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="text-base">
              Delete
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DeleteJobDialog
          isOpen={isDeleteDialogOpen}
          job={job}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDelete={() => onUpdateJobStatus(job.id, 'deleted')}
        />

        {/* Label selector */}
        <div className="lg:ml-auto">
          <JobLabelSelector job={job} onUpdateLabels={onUpdateLabels} />
        </div>
      </div>
    </div>
  );
}

/**
 * Label selector component. For now we only allow setting one label per job.
 */
function JobLabelSelector({
  job,
  onUpdateLabels,
}: {
  job: Job;
  onUpdateLabels: (jobId: number, labels: JobLabel[]) => void;
}) {
  const label = job.labels[0] ?? '';

  const LabelOptionWithColor = ({ jobLabel, colorClass }: { jobLabel: string; colorClass: string }) => (
    <SelectItem value={jobLabel}>
      <div className="flex items-center">
        <div className={`h-3 w-3 rounded-full ${colorClass}`}></div>
        <div className="ml-2 flex-1">{jobLabel}</div>
      </div>
    </SelectItem>
  );

  return (
    <Select
      value={label}
      onValueChange={(labelValue) => {
        const newLabels = isJobLabel(labelValue) ? [labelValue] : [];
        onUpdateLabels(job.id, newLabels);
      }}
    >
      <SelectTrigger className="h-10 w-[148px]">
        <SelectValue placeholder="Add Label" />
      </SelectTrigger>
      <SelectContent>
        {/* no label */}
        <LabelOptionWithColor jobLabel="None" colorClass="bg-background" />

        {/* labels with colors */}
        {Object.values(JOB_LABELS).map((jobLabel) => (
          <LabelOptionWithColor key={jobLabel} jobLabel={jobLabel} colorClass={LABEL_COLOR_CLASSES[jobLabel]} />
        ))}
      </SelectContent>
    </Select>
  );
}
