import { getRelativeTimeString, Job, JobSite } from "@first2apply/core"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { Button } from "../ui/button"
import { ArchiveIcon, TrashIcon } from "lucide-react"
import { LABEL_COLOR_CLASSES } from "../../lib/labels"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

export type JobCardProps = {
  job: Job
  siteMap: Record<number, JobSite>
  siteLogos: Record<number, string>
  onArchive: (job: Job) => void
  onDelete: (job: Job) => void
}
export function JobCard({
  job,
  siteMap,
  siteLogos,
  onArchive,
  onDelete,
}: JobCardProps) {
  return (
    <>
      <div className="flex flex-wrap-reverse items-center justify-between gap-1.5">
        {/* Company Name */}
        <p className="my-1.5 text-xs text-muted-foreground">
          {job.companyName}
        </p>

        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-2">
          {/* Archive button */}
          {job.status !== "archived" && (
            <TooltipProvider delayDuration={500}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    className="h-6 w-6 rounded-sm bg-transparent px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus:bg-foreground/10"
                    onClick={(evt) => {
                      onArchive(job)
                      evt.stopPropagation()
                    }}
                  >
                    <ArchiveIcon className="p-1 text-foreground" />
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
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="h-6 w-6 rounded-sm bg-transparent px-0 transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus:bg-foreground/10"
                  onClick={(evt) => {
                    onDelete(job)
                    evt.stopPropagation()
                  }}
                >
                  <TrashIcon className="p-1 text-destructive" />
                </Button>
              </TooltipTrigger>

              <TooltipContent
                side="bottom"
                className="bg-destructive text-base text-white"
              >
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
              {job.location && (
                <span className="mx-1 text-[14px] font-light text-foreground/40">
                  {" "}
                  |{" "}
                </span>
              )}
              <span>{job.jobType}</span>
            </>
          )}
          {job.salary && (
            <>
              {(job.location || job.jobType) && (
                <span className="mx-1 text-[14px] font-light text-foreground/40">
                  {" "}
                  |{" "}
                </span>
              )}
              <span>{job.salary}</span>
            </>
          )}
          {job.tags?.map((tag) => (
            <span key={job.id + tag}>
              {(job.location || job.jobType || job.salary) && (
                <span className="text-3 mx-2 font-light text-foreground/40">
                  {" "}
                  |{" "}
                </span>
              )}
              <span>{tag}</span>
            </span>
          ))}
        </p>

        {/* Job Label */}
        {job.labels[0] && (
          <div
            className={`w-[85px] shrink-0 rounded-md bg-opacity-80 py-1 text-center text-xs leading-3 text-white dark:bg-opacity-60 ${
              LABEL_COLOR_CLASSES[job.labels[0]]
            }`}
          >
            {job.labels[0]}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-12">
        {/* Source */}
        <p className="flex items-center gap-2 text-xs leading-3 text-foreground/80">
          {/* Source logo */}
          <Avatar className="h-6 w-6">
            <AvatarImage src={siteLogos[job.siteId]} />
            <AvatarFallback>LI</AvatarFallback>
          </Avatar>
          {siteMap[job.siteId]?.name}
        </p>

        {/* Timestamp */}
        <p className="ml-auto w-fit shrink-0 text-xs text-foreground/80">
          detected {getRelativeTimeString(new Date(job.created_at))}
        </p>
      </div>
    </>
  )
}
