import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { signOut } from '../actions';

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { status = 'new' } = await searchParams;
  const validStatuses = ['new', 'applied', 'excluded'] as const;
  const currentStatus = validStatuses.includes(status as (typeof validStatuses)[number]) ? status : 'new';

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold">First 2 Apply</h1>
          <form action={signOut}>
            <button type="submit" className="text-muted-foreground hover:bg-accent rounded-md px-3 py-1.5 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Job status tabs — will become menubar items */}
        <nav className="bg-muted flex gap-1 rounded-lg p-1">
          {validStatuses.map((s) => (
            <a
              key={s}
              href={`/jobs?status=${s}`}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                currentStatus === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </a>
          ))}
        </nav>

        {/* Placeholder */}
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            <span className="font-medium capitalize">{currentStatus}</span> jobs will appear here.
          </p>
          <p className="text-muted-foreground/70 mt-1 text-sm">This is a placeholder — job listing coming soon.</p>
        </div>
      </div>
    </div>
  );
}
