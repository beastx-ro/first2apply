import Link from 'next/link';

import { Button } from './ui/button';

export function BottomCta() {
  return (
    <section id="bottom-cta" className="mx-auto max-w-7xl px-6 pt-[10vh] sm:px-10 md:pt-[20vh]">
      <h2 className="text-2xl font-semibold sm:text-4xl md:text-center lg:text-5xl">Ready to get started?</h2>

      <p className="mt-2 w-fit max-w-[600px] sm:mt-6 md:mx-auto md:text-center lg:max-w-[800px]">
        Join 7500+ users who have tried First 2 Apply to streamline their job applications and land their dream jobs.
      </p>

      <Link href="/download" className="mt-6 flex justify-center md:mt-12">
        <Button size="lg" className="xs:w-fit w-full">
          Download for free
        </Button>
      </Link>
    </section>
  );
}
