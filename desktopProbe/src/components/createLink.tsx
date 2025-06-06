import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { closeJobBoardModal, finishJobBoardModal, openJobBoardModal } from '@/lib/electronMainSdk';
import { JobBoardModalResponse } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoCircledIcon } from '@radix-ui/react-icons/dist';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { JobSite, Link } from '../../../supabase/functions/_shared/types';
import { Icons } from './icons';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

export function CreateLink() {
  const [jobBoardModalResponse, setJobBoardModalResponse] = useState<JobBoardModalResponse>();
  const [isJobBoardModalOpen, setIsJobBoardModalOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);

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
      setIsJobBoardModalOpen(true);
      await openJobBoardModal(site);
    } catch (error) {
      handleError({ error, title: 'Error opening job board' });
    }
  };
  const onCancelBrowsing = async () => {
    try {
      setJobBoardModalResponse(undefined);
      await closeJobBoardModal();
    } catch (error) {
      handleError({ error, title: 'Error closing job board' });
    } finally {
      setIsJobBoardModalOpen(false);
    }
  };

  /**
   * Handler for closing the job browser.
   */
  const onCloseJobBoardModal = async () => {
    try {
      const jobSearchInfo = await finishJobBoardModal();
      setJobBoardModalResponse(jobSearchInfo);
      setIsJobBoardModalOpen(false);
      setIsConfirmationDialogOpen(true);
      return jobSearchInfo;
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

  const onSaveSearch = async (data: { title: string }) => {
    if (!jobBoardModalResponse) {
      throw new Error('Job board modal response is not set');
    }

    const createdLink = await createLink({
      url: jobBoardModalResponse.url,
      title: data.title,
      html: jobBoardModalResponse.html,
    });
    toast({
      title: 'Link created',
      description: `Link ${createdLink.title} created successfully`,
    });

    setIsConfirmationDialogOpen(false);
    setJobBoardModalResponse(undefined);
    setIsJobBoardModalOpen(false);
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
      <JobBrowserOverlay isOpen={isJobBoardModalOpen} onCancel={onCancelBrowsing} onSave={onCloseJobBoardModal} />

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

/**
 * Helper component used to render a top level overlay on top of the main window.
 * It sits fixed on top and has a height of 50px and a width of 100%.
 * Render a cancel and a save button.
 */
const JobBrowserOverlay = ({
  isOpen,
  onCancel,
  onSave,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onSave: () => void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 top-0 z-50 flex h-[50px] w-full items-center justify-between border-b border-primary-foreground/50 bg-background px-5`}
    >
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <p className="text-sm font-medium">
        Search for the jobs you want to apply to. Once you are done, click on save and we will create a job search for
        you.
      </p>
      <Button variant="default" onClick={onSave}>
        Save
      </Button>
    </div>
  );
};

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
