import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginCard } from '@/components/loginCard';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { loginWithEmail } from '@/lib/electronMainSdk';

/**
 * Component used to render the login page.
 */
export function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLoginWithEmail = async ({ email, password }: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await loginWithEmail({ email, password });
      await login(user);
      navigate('/');
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoginCard onLoginWithEmail={onLoginWithEmail} isSubmitting={isSubmitting} />
    </main>
  );
}
