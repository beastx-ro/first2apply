import Image from 'next/image';

import advancedMatchingDark from '../../public/assets/advanced-matching-dark.png';
import advancedMatchingLight from '../../public/assets/advanced-matching-light.png';

export function AdvancedMatchingSection() {
  return (
    <section
      id="advanced-matching"
      className="mx-auto mt-[10vh] flex max-w-7xl flex-col items-center gap-4 px-6 sm:px-10 md:mt-[20vh] md:flex-row-reverse"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-balance text-2xl font-semibold sm:text-4xl md:text-right">
          Extra filtering using <span className="animate-bounce font-bold sm:text-[40px]">AI</span>
        </h2>
        <p className="mt-2 text-balance sm:mt-4 sm:text-lg md:text-right">
          With AI-powered search you can set smart, <span className="text-primary">natural language</span> rules to
          refine job listings like: &quot;exclude jobs that require office visits, even if they’re labeled remote&quot; , &quot;hide
          fullstack roles that require python&quot;, &quot;only see positions with less than 2 years of experience&quot; and more.
          <span className="mt-3 block">No more sifting through irrelevant listings, just jobs that suit you.</span>
        </p>
      </div>

      <div className="relative w-full md:w-1/2">
        <Image src={advancedMatchingLight} alt="advanced-matching light" className="h-auto w-full dark:hidden" />
        <Image src={advancedMatchingDark} alt="advanced-matching dark" className="hidden h-auto w-full dark:block" />
      </div>
    </section>
  );
}
