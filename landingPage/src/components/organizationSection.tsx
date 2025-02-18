import Image from "next/image";
import organizationLight from "../../public/assets/organization-light.png";
import organizationDark from "../../public/assets/organization-dark.png";

export function OrganizationSection() {
  return (
    <section
      id="organization"
      className="max-w-7xl mx-auto px-6 sm:px-10 mt-[10vh] md:mt-[20vh] flex flex-col md:flex-row items-center gap-4"
    >
      <Image
        src={organizationLight}
        alt="organization light"
        className="dark:hidden w-full md:w-1/2 h-auto"
      />
      <Image
        src={organizationDark}
        alt="organization dark"
        className="hidden dark:block w-full md:w-1/2 h-auto"
      />

      <div className="w-full md:w-1/2">
        <h2 className="text-2xl sm:text-4xl font-semibold text-balance">
          Manage applications like a pro
        </h2>

        <p className="mt-2 sm:mt-4 text-balance sm:text-lg">
          Ditch the spreadsheets. First 2 Apply brings seamless organization to
          your job search, with intuitive labeling and tracking at each
          application stage, right within the app.
        </p>
      </div>
    </section>
  );
}
