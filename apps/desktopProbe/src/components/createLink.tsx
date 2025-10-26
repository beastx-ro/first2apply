import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@first2apply/ui';
import { useToast } from '@first2apply/ui';
import { useError } from '@/hooks/error';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { OverlayBrowserViewResult } from '@/lib/types';
import { JobSite, Link } from '@first2apply/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoCircledIcon } from '@radix-ui/react-icons/dist';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { BrowserWindow, BrowserWindowHandle } from './browserWindow';
import { Icons } from './icons';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

export function CreateLink() {
  const [jobBoardModalResponse, setJobBoardModalResponse] = useState<OverlayBrowserViewResult>();
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const browserWindowRef = useRef<BrowserWindowHandle>(null);

  const { handleError } = useError();
  const { createLink } = useLinks();
  const { sites } = useSites();
  const { toast } = useToast();

  // sort sites by name
  const sortedSites = sites
    .sort((a, b) => a.name.localeCompare(b.name))
    // also filter out deprecated sites
    .filter((site) => site.deprecated === false);

  const [isOpen, setIsOpen] = useState(false);

  // Handler for form submission
  const onOpenSite = async (site: JobSite) => {
    try {
      setIsOpen(false);
      await browserWindowRef.current?.open(site.urls[0]);
    } catch (error) {
      handleError({ error, title: 'Error opening job board' });
    }
  };
  const onCancelBrowsing = async () => {
    try {
      setJobBoardModalResponse(undefined);
      // await closeJobBoardModal();
    } catch (error) {
      handleError({ error, title: 'Error closing job board' });
    }
  };

  /**
   * Handler for closing the job browser.
   */
  const onSaveCurrentNavigation = async () => {
    try {
      const jobSearchInfo = await browserWindowRef.current?.finish();
      setJobBoardModalResponse(jobSearchInfo);
      setIsConfirmationDialogOpen(true);
    } catch (error) {
      handleError({ error, title: 'Error closing job board' });
    }
  };

  /**
   * Handler for closing the confirmation dialog.
   */
  const onCancelSave = async () => {
    try {
      setIsConfirmationDialogOpen(false);
      setJobBoardModalResponse(undefined);
    } catch (error) {
      handleError({ error, title: 'Error closing job board' });
    }
  };

  const onSaveSearch = async () => {
    if (!jobBoardModalResponse) {
      handleError({ error: new Error('No job search data'), title: 'Error saving job search' });
      return;
    }

    const createdLink = await createLink({
      url: jobBoardModalResponse.url,
      title: jobBoardModalResponse.title,
      html: jobBoardModalResponse.html,
    });
    toast({
      title: 'Link created',
      description: `Link ${createdLink.title} created successfully`,
    });

    setIsConfirmationDialogOpen(false);
    setJobBoardModalResponse(undefined);
    setIsOpen(false);

    return createdLink;
  };

  // JSX for rendering the form
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="lg" className="px-10 text-base">
            Add Search
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[90vw] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-wide">Add new job search</DialogTitle>
            <DialogDescription>
              <p>
                Click on one of the supported job boards and start searching for a role. The more specific your filters,
                the better we can tailor job alerts for you.
              </p>

              <Alert className="mt-2 flex items-center gap-2 border-0 p-0">
                <AlertTitle className="mb-0">
                  <InfoCircledIcon className="h-5 w-5" />
                </AlertTitle>
                <AlertDescription className="text-base">
                  <span className="font-medium">Pro Tip: </span>Apply the 'Last 24 Hours' filter where possible.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>

          <h2 className="mt-6 text-base tracking-wide">Supported job boards:</h2>
          <DialogFooter>
            <ul className="flex w-full flex-wrap justify-evenly gap-1.5">
              {sortedSites.map((site) => (
                <li key={site.id}>
                  <Badge
                    onClick={() => {
                      onOpenSite(site);
                    }}
                  >
                    {site.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* render a top level action bar overlay */}
      <BrowserWindow
        ref={browserWindowRef}
        onClose={onCancelBrowsing}
        customActionButton={{
          text: 'Save',
          onClick: onSaveCurrentNavigation,
          tooltip: 'Click when you are done browsing and want to save this search',
        }}
      ></BrowserWindow>

      {/* render the confirmation dialog */}
      <JobSearchSubmitDialog
        isOpen={isConfirmationDialogOpen}
        title={jobBoardModalResponse?.title ?? ''}
        url={jobBoardModalResponse?.url ?? ''}
        onCancel={onCancelSave}
        onSaveJobSearch={onSaveSearch}
      />
    </>
  );
}

const JobSearchSubmitDialog = ({
  title,
  url,
  isOpen,
  onSaveJobSearch,
  onCancel,
}: {
  title: string;
  url: string;
  isOpen: boolean;
  onSaveJobSearch: (data: { title: string }) => Promise<Link>;
  onCancel: () => void;
}) => {
  if (!isOpen) {
    return null;
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleError } = useError();
  const { toast } = useToast();

  const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().url('Invalid URL').min(1, 'URL is required'),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title,
      url,
    },
  });

  const onSubmit = async (data: { title: string }) => {
    setIsSubmitting(true);
    try {
      await onSaveJobSearch(data);
      toast({
        title: 'Job search created',
        description: `Job search ${data.title} created successfully`,
      });
    } catch (error) {
      handleError({ error, title: 'Error creating job search' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="w-[90vw] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-wide">Add new job search</DialogTitle>
          <DialogDescription>
            Give this search a name so you can easily find it later. First 2 Apply will keep monitoring this search and
            let you know when it finds new jobs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Form fields */}
            <div className="flex flex-col gap-3">
              {/* Title field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        id="title"
                        type="title"
                        placeholder="Enter a descriptive name (eg: java senior remote)"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* URL field */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input id="url" type="url" disabled={true} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between pt-3">
              {/* Cancel button */}
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              {/* Submit button */}
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                className="ml-auto flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Icons.spinner2 className="h-4 w-4 animate-spin" />
                    Scanning site...
                  </>
                ) : (
                  'Save search'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
