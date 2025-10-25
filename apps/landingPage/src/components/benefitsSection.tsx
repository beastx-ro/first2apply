import Image from 'next/image';
import { useState } from 'react';

import benefitsDark from '../../public/assets/benefits-dark.png';
import benefitsLight from '../../public/assets/benefits-light.png';

const sites = [
  'LinkedIn',
  'Indeed',
  'Dice',
  'Glassdoor',
  'BuiltIn',
  'Remotive',
  'Remote IO',
  'RemoteOK',
  'WeWorkRemotely',
  'FlexJobs',
  'Robert Half',
  'USA Jobs',
];

export function BenefitsSection() {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  return (
    <section
      id="benefits"
      className="mx-auto mt-[20vh] flex max-w-7xl flex-col items-center gap-4 px-6 sm:px-10 md:flex-row"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-balance text-2xl font-semibold sm:text-4xl">More jobs, less hassle</h2>

        <p className="mt-2 text-balance sm:mt-4 sm:text-lg">
          Venture beyond LinkedIn to seize every opportunity. But manual searching across multiple platforms can be
          overwhelming... Let First 2 Apply automate the process, fetching roles from{' '}
          {showAllPlatforms ? `${sites.join(', ')}.` : `${sites.slice(0, 3).join(', ')}, and `}
          {!showAllPlatforms && (
            <button onClick={() => setShowAllPlatforms(true)} className="text-blue-500">
              {sites.length - 3} other job platforms.
            </button>
          )}{' '}
          Just sit back, relax and let us curate the perfect job list for you.
        </p>
      </div>

      <div className="h-auto w-full md:w-1/2">
        <Image src={benefitsLight} alt="sites light" className="h-auto w-full dark:hidden" />
        <Image src={benefitsDark} alt="sites dark" className="hidden h-auto w-full dark:block" />
      </div>
    </section>
  );
}
