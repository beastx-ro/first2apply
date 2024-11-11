import { LABEL_COLOR_CLASSES } from '@/lib/labels';
import { BackpackIcon, CookieIcon, ExternalLinkIcon, ListBulletIcon, TrashIcon } from '@radix-ui/react-icons';
import React from 'react';

import { JOB_LABELS, Job, JobLabel } from '../../../../supabase/functions/_shared/types';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DeleteJobDialog } from './deleteJobDialog';

function isJobLabel(value: any): value is JobLabel {
  return Object.values(JOB_LABELS).includes(value);
}

/**
 * Job summary component.
 */
export function JobSummary({
  job,
  onApply,
  onArchive,
  onDelete,
  onUpdateLabels,
  onView,
}: {
  job: Job;
  onApply: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
  onUpdateLabels: (jobId: number, labels: JobLabel[]) => void;
  onView: (job: Job) => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-muted p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4 lg:gap-6">
        <div>
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
        {job.tags && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <ListBulletIcon className="h-auto w-5" />
            <p>
              {'Skills: '}
              {job.tags?.slice(0, 5).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-2 lg:mt-10">
        {/* Apply button */}
        {job.status !== 'applied' && (
          <Button
            size="lg"
            className="w-24 text-sm"
            onClick={() => {
              onApply(job);
            }}
          >
            Apply
          </Button>
        )}

        {/* Archive button */}
        {job.status !== 'archived' && (
          <Button
            size="lg"
            variant="secondary"
            className="w-24 text-sm"
            onClick={() => {
              onArchive(job);
            }}
          >
            Archive
          </Button>
        )}

        {/* Open job button */}
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="lg"
                variant="secondary"
                className="w-10 border-none bg-border px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/15 focus:bg-foreground/15"
                onClick={() => onView(job)}
              >
                <ExternalLinkIcon className="h-4 w-auto" />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="text-base">
              See job page
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
          onDelete={onDelete}
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
