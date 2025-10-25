import { useToast } from '@/components/ui/use-toast';
import { getExceptionMessage } from '@/lib/error';
import { useState } from 'react';

/**
 * Hook used to handle errors.
 */
export function useError() {
  const { toast } = useToast();

  const [error, setError] = useState<unknown>(null);

  const handleError = ({
    error,
    title = 'Oops, something went wrong!',
    silent = false,
  }: {
    error: unknown;
    title?: string;
    silent?: boolean;
  }) => {
    console.error(getExceptionMessage(error));

    if (!silent) {
      toast({
        title,
        description: getExceptionMessage(error, true),
        variant: 'destructive',
      });
    }

    setError(error);
  };

  const resetError = () => {
    setError(null);
  };

  return { error, handleError, resetError };
}
