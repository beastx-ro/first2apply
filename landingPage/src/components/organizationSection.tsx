import Image from 'next/image';

import organizationDark from '../../public/assets/organization-dark.png';
import organizationLight from '../../public/assets/organization-light.png';

export function OrganizationSection() {
  return (
    <section
      id="organization"
      className="mx-auto mt-[10vh] flex max-w-7xl flex-col items-center gap-4 px-6 sm:px-10 md:mt-[20vh] md:flex-row-reverse"
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-balance text-2xl font-semibold sm:text-4xl md:text-right">
          Manage applications like a pro
        </h2>

        <p className="mt-2 text-balance sm:mt-4 sm:text-lg md:text-right">
          Ditch the spreadsheets. First 2 Apply brings seamless organization to your job search, with intuitive labeling
          and tracking at each application stage, right within the app.
        </p>
      </div>

      <Image
        src={organizationLight}
        alt="organization light"
        className="h-auto w-full pb-6 pr-5 dark:hidden md:w-1/2"
      />
      <Image
        src={organizationDark}
        alt="organization dark"
        className="hidden h-auto w-full pb-6 pr-5 dark:block md:w-1/2"
      />
    </section>
  );
}
