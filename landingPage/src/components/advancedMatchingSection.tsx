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
          Precise job filtering, tailored results
        </h2>
        <p className="mt-2 sm:mt-4 text-balance md:text-right">
          Fed up with irrelevant listings? Set your preferences to exclude
          specific tech stacks or companies (yes, even Luxoft). First 2 Apply's
          refined filtering means you only see the jobs that truly match your
          criteria.
        </p>
      </div>

      <div className="relative w-full md:w-1/2">
        <Image
          src={advancedMatchingLight}
          alt="advanced-matching light"
          className="w-full h-auto blur-sm dark:hidden"
        />
        <Image
          src={advancedMatchingDark}
          alt="advanced-matching dark"
          className="hidden w-full h-auto blur-sm dark:block"
        />
        <div className="absolute top-8 xs:top-10 sm:top-12 md:top-8 lg:top-14 right-1 xs:right-2 sm:right-3 md:right-2 lg:right-3 bg-gradient-to-r from-primary via-primary via-80% to-background/5 opacity-70 rounded-l-sm py-2 pl-6 pr-8 transform text-background sm:text-lg font-medium tracking-wide">
          Coming Soon
        </div>
      </div>
    </section>
  );
}