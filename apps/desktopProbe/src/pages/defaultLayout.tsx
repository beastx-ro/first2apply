import { cn } from '@/lib/utils';

import { Navbar } from '../components/navbar';

/**
 * Default layout for all pages
 */
export function DefaultLayout({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="ml-16 md:ml-20 2xl:ml-56">
        <div className={cn('mx-auto min-h-screen max-w-[1536px]', className)}>{children}</div>
      </main>
    </>
  );
}
