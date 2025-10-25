import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { changeAllJobsStatus, exportJobsToCsv } from '@/lib/electronMainSdk';
import { ArchiveIcon, DotsVerticalIcon, DownloadIcon, TrashIcon, UpdateIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Job, JobStatus } from '../../../../../supabase/functions/_shared/types';
import { JobTabsContent } from './jobTabsContent';

export type JobListing = {
  isLoading: boolean;
  hasMore: boolean;
  jobs: Array<
    Job & {
      isLoadingJD?: boolean;
    }
  >;
  new: number;
  applied: number;
  archived: number;
  filtered: number;
  nextPageToken?: string;
};

/**
 * Job tabs component.
 */
export function JobTabs() {
  const { handleError } = useError();

  const navigate = useNavigate();
  const location = useLocation();

  // Parse the query parameters to determine the active tab
  const searchParams = new URLSearchParams(location.search);
  const status = (searchParams.get('status') || 'new') as JobStatus;
  const search = searchParams.get('search') || '';
  const siteIds = searchParams.get('site_ids') ? searchParams.get('site_ids').split(',').map(Number) : [];
  const linkIds = searchParams.get('link_ids') ? searchParams.get('link_ids').split(',').map(Number) : [];
  const labels = searchParams.get('labels') ? searchParams.get('labels').split(',') : [];

  const [listing, setListing] = useState<JobListing>({
    isLoading: true,
    hasMore: true,
    jobs: [],
    new: 0,
    applied: 0,
    archived: 0,
    filtered: 0,
  });

  // Handle tab change
  const onTabChange = (tabValue: string) => {
    navigate(
      `?status=${tabValue}&search=${search}&site_ids=${siteIds?.join(',')}&link_ids=${linkIds?.join(',')}&labels=${labels?.join(',')}&r=${Math.random()}`,
    );
  };

  // Archive all jobs from the current tab
  const onArchiveAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: status, to: 'archived' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs archived',
        description: `All your ${status} jobs have been archived, you can find them in the archived tab.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to archive all jobs' });
    }
  };

  // Delete all jobs from the current tab
  const onDeleteAll = async (tab: JobStatus) => {
    try {
      await changeAllJobsStatus({ from: tab, to: 'deleted' });

      // refresh the tab
      onTabChange(tab);

      toast({
        title: 'All jobs deleted',
        description: `All your ${status} jobs have been deleted.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to delete all jobs' });
    }
  };

  // Download all jobs from the current tab to a CSV file
  const onCsvExport = async (tab: JobStatus) => {
    try {
      await exportJobsToCsv(tab);
      toast({
        title: 'Jobs exported',
        description: `All your ${tab} jobs have been exported to a CSV file.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Failed to export jobs' });
    }
  };

  return (
    <Tabs value={status} onValueChange={(value) => onTabChange(value)}>
      <TabsList className="h-fit w-full p-2">
        <TabsTrigger
          value="new"
          className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            status === 'new' ? 'justify-between' : 'justify-center'
          }`}
        >
          {status === 'new' ? (
            <>
              <span className="w-6" />
              <span>New jobs {`(${listing.new})`}</span>
              <TabActions
                tab="new"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            </>
          ) : (
            `New jobs ${`(${listing.new})`}`
          )}
        </TabsTrigger>
        <TabsTrigger
          value="applied"
          className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            status === 'applied' ? 'justify-between' : 'justify-center'
          }`}
        >
          {status === 'applied' ? (
            <>
              <span className="w-6" />
              <span>Applied {`(${listing.applied})`}</span>
              <TabActions
                tab="applied"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            </>
          ) : (
            `Applied ${`(${listing.applied})`}`
          )}
        </TabsTrigger>
        <TabsTrigger
          value="archived"
          className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            status === 'archived' ? 'justify-between' : 'justify-center'
          }`}
        >
          {status === 'archived' ? (
            <>
              <span className="w-6" />
              <span>Archived {`(${listing.archived})`}</span>
              <TabActions
                tab="archived"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            </>
          ) : (
            `Archived ${`(${listing.archived})`}`
          )}
        </TabsTrigger>
        <TabsTrigger
          value="excluded_by_advanced_matching"
          className={`flex flex-1 items-center px-6 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            status === 'excluded_by_advanced_matching' ? 'justify-between' : 'justify-center'
          }`}
        >
          {status === 'excluded_by_advanced_matching' ? (
            <>
              <span className="w-6" />
              <span>Filtered out {`(${listing.filtered})`}</span>
              <TabActions
                tab="excluded_by_advanced_matching"
                onTabChange={onTabChange}
                onCsvExport={onCsvExport}
                onArchiveAll={onArchiveAll}
                onDeleteAll={onDeleteAll}
              />
            </>
          ) : (
            `Filtered out ${`(${listing.filtered})`}`
          )}
        </TabsTrigger>
      </TabsList>

      <JobTabsContent
        status={status}
        listing={listing}
        setListing={setListing}
        search={search}
        siteIds={siteIds}
        linkIds={linkIds}
        labels={labels}
      />
    </Tabs>
  );
}

/**
 * Tab actions component.
 */
function TabActions({
  tab,
  onTabChange,
  onCsvExport,
  onArchiveAll,
  onDeleteAll,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
  onCsvExport: (tab: string) => Promise<void>;
  onArchiveAll: (tab: string) => Promise<void>;
  onDeleteAll: (tab: string) => Promise<void>;
}) {
  const [isArchiveAllDialogOpen, setIsArchiveAllDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-6 w-6 focus-visible:outline-none focus-visible:ring-0"
          onClick={(evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          }}
        >
          <DotsVerticalIcon className="m-auto h-5 w-auto text-muted-foreground transition-all duration-200 ease-in-out hover:h-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="space-y-1">
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onTabChange(tab)}>
            <UpdateIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onCsvExport(tab)}>
            <DownloadIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            CSV export
          </DropdownMenuItem>
          {tab !== 'archived' && (
            <DropdownMenuItem
              className="cursor-pointer focus:bg-secondary/40"
              onClick={() => setIsArchiveAllDialogOpen(true)}
            >
              <ArchiveIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
              Archive all
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer bg-destructive/5 focus:bg-destructive/20"
            onClick={() => setIsDeleteAllDialogOpen(true)}
          >
            <TrashIcon className="-ml-0.5 mb-0.5 mr-2 inline-block h-5 w-5 text-destructive" />
            Delete all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive all jobs confirm dialog */}
      <AlertDialog open={isArchiveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone, and all jobs will be moved to the archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsArchiveAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsArchiveAllDialogOpen(false);
                onArchiveAll(tab);
              }}
            >
              <ArchiveIcon className="mr-2 inline-block h-4 w-4" />
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all jobs confirm dialog */}
      <AlertDialog open={isDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You won't ever see these jobs again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setIsDeleteAllDialogOpen(false);
                onDeleteAll(tab);
              }}
            >
              <TrashIcon className="mr-2 inline-block h-5 w-5" />
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
