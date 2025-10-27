import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SignupCard } from '@/components/signupCard';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { signupWithEmail } from '@/lib/electronMainSdk';

/**
 * Component used to render the signup page.
 */
export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useSession();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignupWithEmail = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await signupWithEmail({ email, password });
      login(user);
      navigate('/');
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignupCard onSignupWithEmail={onSignupWithEmail} isSubmitting={isSubmitting} />
    </main>
  );
}
