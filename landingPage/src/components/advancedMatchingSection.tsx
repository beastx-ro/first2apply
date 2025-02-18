import Image from "next/image";
import advancedMatchingLight from "../../public/assets/advanced-matching-light.png";
import advancedMatchingDark from "../../public/assets/advanced-matching-dark.png";

export function AdvancedMatchingSection() {
  return (
    <section
      id="advanced-matching"
      className="flex flex-col md:flex-row-reverse items-center gap-4 mt-[10vh] md:mt-[20vh] max-w-7xl mx-auto px-6 sm:px-10"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-2xl sm:text-4xl font-semibold text-balance md:text-right">
          Advanced Matching using AI
        </h2>
        <p className="mt-2 sm:mt-4 text-balance md:text-right sm:text-lg">
          <b>Tired of sifting through irrelevant job listings?</b> First 2 Apply
          goes beyond basic keyword filtering. With AI-powered search, you can
          set smart, natural language rules like:
        </p>
        <ul className="text-balance mx-auto list-disc">
          <li>
            Exclude jobs that require office visits (even if they're labeled
            remote)
          </li>
          <li>Hide roles requiring Python when searching for Fullstack jobs</li>
          <li>Only show positions with less than 2 years of experience</li>
          <li>Filter out specific companies</li>
        </ul>
        <p className="mt-2 sm:mt-4 text-balance md:text-right sm:text-lg">
          No more manual filtering—just the jobs that truly match your criteria.
        </p>
      </div>

      <div className="relative w-full md:w-1/2">
        <Image
          src={advancedMatchingLight}
          alt="advanced-matching light"
          className="w-full h-auto dark:hidden"
        />
        <Image
          src={advancedMatchingDark}
          alt="advanced-matching dark"
          className="hidden w-full h-auto dark:block"
        />
      </div>
    </section>
  );
}
