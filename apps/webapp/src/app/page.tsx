'use client';

import { useState } from 'react';

import { LoginCard } from '@first2apply/ui';
import { useRouter } from 'next/navigation';

import { login } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin({ email, password }: { email: string; password: string }) {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);

    const result = await login({ error: null }, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoginCard
          onLoginWithEmail={handleLogin}
          isSubmitting={isSubmitting}
          signUpLink={
            <a
              href="https://first2apply.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download the app
            </a>
          }
        />
        {error && (
          <div className="bg-destructive/10 text-destructive w-full max-w-80 rounded-md px-3 py-2 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
