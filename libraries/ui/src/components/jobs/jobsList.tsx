"use client"

import { createRef, useEffect, useMemo, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"

import { Job } from "@first2apply/core"

import { useSites } from "../../hooks/useSites"
import { cn } from "../../lib/utils"
import { DeleteJobDialog } from "./deleteJobDialog"
import { Icons } from "../icons"

import { JobCard } from "./jobCard"

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
  enableKeyboardNavigation = false,
}: {
  jobs: Job[]
  selectedJobId?: number
  hasMore: boolean
  parentContainerId: string
  onLoadMore: () => void
  onSelect: (job: Job) => void
  onArchive: (job: Job) => void
  onDelete: (job: Job) => void
  enableKeyboardNavigation?: boolean
}) {
  const { siteLogos, siteMap, isLoading: isLoadingSites } = useSites()

  const [jobToDelete, setJobToDelete] = useState<Job | undefined>()
  const [scrollToIndex, setScrollToIndex] = useState<number | undefined>()
  const itemRefs = useMemo(
    () => jobs.map(() => createRef<HTMLLIElement>()),
    [jobs]
  )
  const selectedIndex = jobs.findIndex((job) => job.id === selectedJobId)

  useEffect(() => {
    if (scrollToIndex === undefined) {
      return
    }

    const timer = setTimeout(() => {
      const selectedRef = itemRefs[scrollToIndex]
      if (selectedRef.current) {
        selectedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        setScrollToIndex(undefined)
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [scrollToIndex, itemRefs])

  // Keyboard navigation (only enabled for desktop app)
  useEffect(() => {
    if (!enableKeyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigate down
      if (e.key === "ArrowDown" && selectedIndex < jobs.length - 1) {
        const nextIndex = selectedIndex + 1
        onSelect(jobs[nextIndex])
        setScrollToIndex(nextIndex)
      }
      // Navigate up
      else if (e.key === "ArrowUp" && selectedIndex > 0) {
        const prevIndex = selectedIndex - 1
        onSelect(jobs[prevIndex])
        setScrollToIndex(prevIndex)
      }
      // Archive job
      else if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault()
        if (selectedJobId) {
          const jobToArchive = jobs.find((job) => job.id === selectedJobId)
          if (jobToArchive && jobToArchive.status !== "archived") {
            onArchive(jobToArchive)
          }
        }
      }
      // Delete job
      else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault()
        if (selectedJobId) {
          const jobToDelete = jobs.find((job) => job.id === selectedJobId)
          if (jobToDelete) {
            setJobToDelete(jobToDelete)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    enableKeyboardNavigation,
    selectedIndex,
    jobs,
    selectedJobId,
    onSelect,
    onArchive,
  ])

  const isLoading = isLoadingSites

  if (isLoading) {
    return null
  }

  return (
    <>
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
                className={cn(
                  "rounded-lg px-5 pt-6",
                  selectedJobId === job.id && "bg-muted"
                )}
                ref={itemRefs[index]}
                onClick={() => onSelect(job)}
              >
                <JobCard
                  job={job}
                  siteMap={siteMap}
                  siteLogos={siteLogos}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />

                <hr className="mt-6 w-full border-muted" />
              </li>
            )
          })}
        </ul>
      </InfiniteScroll>
      {jobToDelete && (
        <DeleteJobDialog
          isOpen={!!jobToDelete}
          job={jobToDelete}
          onClose={() => setJobToDelete(undefined)}
          onDelete={onDelete}
        />
      )}
    </>
  )
}
