import { Job } from '@first2apply/core';
import React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';

let SHOW_DELETE_WARNING = true;

/**
 * Component used to render a delete job confirmation dialog.
 */
export function DeleteJobDialog({
  isOpen,
  onClose,
  onDelete,
  job,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (job: Job) => void;
  job: Job;
}) {
  /**
   * Effect used to automatically delete the job if the user has disabled the warning.
   */
  React.useEffect(() => {
    if (isOpen && !SHOW_DELETE_WARNING) {
      onDelete(job);
      onClose();
    }
  }, [isOpen]);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this job and you won't be able to see it again.
          </AlertDialogDescription>
          <AlertDialogDescription className="flex items-center">
            <Checkbox
              id="disable-delete-warning"
              onCheckedChange={(checked) => {
                SHOW_DELETE_WARNING = !checked;
              }}
            ></Checkbox>
            <label htmlFor="disable-delete-warning" className="ml-2 space-y-1 leading-none">
              Do not show this warning again.
            </label>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(job)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
