import { ForgotPasswordCard } from '@/components/forgotPasswordCard';
import { useError } from '@/hooks/error';
import { sendPasswordResetEmail } from '@/lib/electronMainSdk';
import { useToast } from '@first2apply/ui';
import { useState } from 'react';

/**
 * Component used to render the forgot password card.
 */
export function ForgotPasswordPage() {
  const { toast } = useToast();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPasswordRequest = async ({ email }: { email: string }) => {
    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail({ email });
      toast({
        title: 'Reset password email sent',
        description: `An email has been sent to ${email} with a link to reset your password.`,
        variant: 'success',
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <ForgotPasswordCard onResetPassword={resetPasswordRequest} isSubmitting={isSubmitting} />
    </main>
  );
}
