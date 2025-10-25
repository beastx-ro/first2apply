import { DefaultLayout } from "@/components/defaultLayout";

export default function TermsOfService() {
  return (
    <DefaultLayout>
      <section className="max-w-7xl h-fit min-h-screen mx-auto my-[10vh] px-6 md:px-10">
        <h1 className="w-full text-3xl sm:text-5xl font-semibold sm:text-center text-balance">
          Terms and Conditions for using First 2 Apply
        </h1>
        <h2 className="mt-2 sm:mt-4 text-sm lg:text-xl text-foreground/70 font-medium sm:text-center sm:text-balance sm:tracking-wide">
          Last updated: 02.12.2024
        </h2>

        <h3 className="mt-[10vh] text-lg lg:text-2xl font-medium">
          Introduction:
        </h3>
        <p>
          Welcome to First 2 Apply, a dynamic job alert service designed to keep
          you ahead in your job search. This service is proudly provided by
          BeastX Industries SRL, a company based in Romania committed to
          delivering innovative solutions tailored to your career advancement
          needs. By using First 2 Apply, you agree to our Terms of Service,
          which outline the legal agreement between you and BeastX Industries
          SRL regarding your use of our service.
        </p>

        <h3 className="mt-[5vh] text-lg lg:text-2xl font-medium">
          Service Description:
        </h3>
        <p>
          First 2 Apply offers a tailored job alert service, designed to give
          users a competitive edge by instantly notifying them about new job
          listings. With a focus on tech and IT positions, our desktop
          application streamlines the job search process. Users can customize
          alerts based on their preferred job sites and specific criteria,
          ensuring they are the first to know about relevant opportunities. Our
          service aims to simplify the job hunt, saving time and directly
          connecting professionals with their next career move.
        </p>

        <h3 className="mt-[5vh] text-lg lg:text-2xl font-medium">
          User Responsibilities:
        </h3>
        <p>
          Users of First 2 Apply are responsible for correctly setting up and
          maintaining their job alert preferences within the app. This includes
          accurately configuring links to desired job sites, specifying relevant
          job search filters, and ensuring their computer and application
          settings allow for the proper functioning of the service.
        </p>
        <p>
          Please note that First 2 Apply is an automation tool, and its usage
          may potentially violate the terms of service of certain job board
          sites. Users acknowledge that by employing First 2 Apply, they assume
          all associated risks, including the possibility of having their
          accounts restricted or banned on those platforms. First 2 Apply is not
          liable for any consequences arising from such actions. Users are also
          expected to abide by applicable laws and regulations while using the
          service and to respect the terms of use of any third-party job sites
          accessed through First 2 Apply.
        </p>

        <h3 className="mt-[5vh] text-lg lg:text-2xl font-medium">
          Data Collection and Privacy:
        </h3>
        <p>
          In addition to collecting user emails for account management, First 2
          Apply securely stores your saved job search links and scraped jobs on
          our servers. This allows us to personalize and enhance your service
          experience, including synchronizing your job feed if you reinstall the
          app on another device. This data is strictly used for delivering
          relevant job alerts and ensuring a seamless user experience. We
          guarantee that this information is never shared with third parties. We
          are dedicated to maintaining the confidentiality and security of your
          personal information, ensuring transparency and respect for your
          privacy in all our data handling practices.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium">Pricing and Payment:</h3>
        <p>
          Current pricing details for First 2 Apply are available on our
          website. However, as the payment system is not yet implemented, the
          app is free to use. Users are encouraged to take advantage of this
          introductory offer while the service remains available at no cost.
          Stay updated with our website for future pricing structures and
          payment options.Current pricing details for First 2 Apply are
          available on our website. Users can purchase a subscription securely
          through our payment system, powered by Stripe. Subscriptions grant
          access to our full range of services. Stay informed by checking our
          website for updates on pricing and any future changes to our payment
          options.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium">Service Availability:</h3>
        <p>
          First 2 Apply&apos;s service is primarily available through our
          desktop application. Users should note that job alerts are operational
          when the application is running and the computer is on. We strive to
          ensure reliable service but cannot guarantee uninterrupted
          availability due to factors like software updates, maintenance, or
          user&apos;s computer settings. We are constantly working to enhance
          service reliability and may introduce additional features, like email
          notifications, to improve the user experience.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium">Changes and Updates:</h3>
        <p>
          First 2 Apply reserves the right to modify or update the service,
          including its features, user interface, and operational
          specifications, at any time. We aim to improve your experience and
          expand functionalities to meet evolving user needs. Changes will be
          communicated through the app or via email, ensuring users are informed
          and can adapt to the enhancements. We recommend users regularly check
          for updates to benefit from the latest improvements and additions to
          our service.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium">
          Disclaimer and Limitation of Liability:
        </h3>
        <p>
          First 2 Apply does not guarantee employment, job placement, or job
          availability. The service is provided &apos;as-is&apos;, and while we
          strive to maintain accurate and timely job alerts, we do not warrant
          the completeness or accuracy of the information provided. First 2
          Apply shall not be liable for any decisions, actions, or inactions
          taken based on the information provided by our service. Users are
          advised to conduct their due diligence and verify job details
          independently.
        </p>
      </section>
    </DefaultLayout>
  );
}
