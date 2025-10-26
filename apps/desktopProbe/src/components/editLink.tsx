import { useError } from '@/hooks/error';
import { Link } from '@first2apply/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Icons } from './icons';
import { Button } from '@first2apply/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@first2apply/ui';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@first2apply/ui';
import { Input } from '@first2apply/ui';
import { useToast } from '@first2apply/ui';

/**
 * Component used to edit a link.
 */
export function EditLink({
  isOpen,
  link,
  onUpdateLink,
  onCancel,
}: {
  isOpen: boolean;
  link: Link;
  onUpdateLink: (data: { linkId: number; title: string }) => Promise<void>;
  onCancel: () => void;
}) {
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
      title: link.title,
      url: link.url,
    },
  });

  const onSubmit = async (data: { title: string }) => {
    setIsSubmitting(true);
    try {
      await onUpdateLink({
        linkId: link.id,
        title: data.title,
      });
      toast({
        title: 'Job search updated',
        description: `Job search ${data.title} updated successfully`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error, title: 'Error updating job search' });
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
          <DialogTitle className="text-xl font-medium tracking-wide">Update job search</DialogTitle>
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
                    Upting search ...
                  </>
                ) : (
                  'Update search'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
