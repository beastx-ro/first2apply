import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { loginWithEmail } from '@/lib/electronMainSdk';
import { LoginCard } from '@first2apply/ui';

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
      <LoginCard
        onLoginWithEmail={onLoginWithEmail}
        isSubmitting={isSubmitting}
        signUpLink={
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        }
        forgotPasswordLink={
          <Link to="/forgot-password" className="w-fit text-xs text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        }
      />
    </main>
  );
}
