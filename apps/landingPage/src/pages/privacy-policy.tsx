import { DefaultLayout } from '@/components/defaultLayout';

export default function PrivacyPolicy() {
  return (
    <DefaultLayout>
      <section className="mx-auto my-[10vh] h-fit min-h-screen max-w-7xl px-6 md:px-10">
        <h1 className="w-full text-balance text-3xl font-semibold sm:text-center sm:text-5xl">Privacy Policy</h1>
        <h2 className="text-foreground/70 mt-2 text-sm font-medium sm:mt-4 sm:text-balance sm:text-center sm:tracking-wide lg:text-xl">
          Last updated: 06.02.2024
        </h2>

        <h3 className="mt-[10vh] text-lg font-medium lg:text-2xl">Introduction:</h3>
        <p>
          Welcome to First 2 Apply&apos;s Privacy Policy. This policy outlines our practices regarding the collection,
          use, and protection of your personal information. Understanding our approach to data privacy is crucial for
          you to make informed decisions about using our services. We are committed to maintaining your trust by
          handling your personal information responsibly and transparently. This service is proudly provided by BeastX
          Industries SRL, a company based in Romania committed to delivering innovative solutions tailored to your
          career advancement needs. By using First 2 Apply, you agree to our Terms of Service, which outline the legal
          agreement between you and BeastX Industries SRL regarding your use of our service.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Information Collection:</h3>
        <p>
          First 2 Apply collects minimal personal information to ensure the efficient operation of our service. This
          includes your email address, necessary for account management and communication, and your saved job search
          links, which allow us to tailor job alerts to your preferences. We collect this information directly from you
          when you register and customize your profile. Our focus on essential data reflects our commitment to your
          privacy and the streamlined nature of our service.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Use of Information:</h3>
        <p>
          The information collected by First 2 Apply is used to provide a personalized and efficient job alert service.
          Your email address enables account management and communication about service-related matters. The job search
          links you save allow us to tailor notifications to match your career interests precisely. Our use of your
          information is solely focused on enhancing your experience with First 2 Apply, ensuring you receive the most
          relevant job alerts quickly and efficiently.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Data Sharing and Disclosure:</h3>
        <p>
          First 2 Apply values your privacy. We assure you that your personal information, including your email and
          saved job search links, is not shared with or sold to third parties. Our commitment is to use your data solely
          for improving and personalizing the service we provide to you, without compromising your privacy. Any
          disclosure of personal information would only occur if legally required or explicitly permitted by you.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Data Security:</h3>
        <p>
          First 2 Apply prioritizes the security of your personal information. We use Supabase for authentication and
          its database with Row Level Security (RLS) to ensure that your data is protected. These robust security
          measures are designed to safeguard your data from unauthorized access and breaches, maintaining the
          confidentiality and integrity of your personal information while you use our service.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">User Rights:</h3>
        <p>
          As a user of First 2 Apply, you have certain rights under the General Data Protection Regulation (GDPR). These
          include the right to access, correct, delete, or restrict the processing of your personal data. You also have
          the right to object to processing and the right to data portability. We respect these rights and are committed
          to providing the necessary support to exercise them. For any requests or inquiries about your data, please
          contact us at contact@first2apply.com.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Policy Updates:</h3>
        <p>
          First 2 Apply reserves the right to update this privacy policy at any time. Changes will be made to reflect
          new practices or regulatory requirements. We will notify users of significant changes through our website or
          via direct communication. We encourage users to review this policy periodically to stay informed about how we
          are protecting the personal information we collect. Your continued use of the service after any changes
          signifies your acceptance of our updated privacy policy.
        </p>

        <h3 className="mt-[5vh] text-lg font-medium lg:text-2xl">Contact Information:</h3>
        <p>
          For any questions, concerns, or feedback regarding our privacy practices or this policy, please feel free to
          reach out to us at contact@first2apply.com. We are dedicated to addressing your inquiries promptly and
          ensuring your experience with First 2 Apply is secure and satisfactory. Your input is valuable to us as we
          strive to maintain the highest standards of privacy and service.
        </p>
      </section>
    </DefaultLayout>
  );
}
