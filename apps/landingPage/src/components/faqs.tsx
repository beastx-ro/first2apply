import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@first2apply/ui";

export function Faqs() {
  return (
    <section id="help" className="mx-auto max-w-7xl px-6 py-[10vh] sm:px-10 md:pt-[20vh]">
      <h2 className="text-2xl font-semibold sm:text-4xl md:text-center lg:text-5xl">FAQs</h2>

      <Accordion type="single" collapsible className="sm:mt-[5vh]">
        <AccordionItem value="item-1" className="sm:py-2">
          <AccordionTrigger className="hover:text-primary text-left text-lg font-normal hover:no-underline">
            Why is this a desktop app and not a website?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            To maintain affordability for our users, the app is designed to utilize your device to refresh your saved
            job searches. This method helps us avoid the higher costs associated with using our own servers for this
            task.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="sm:py-2">
          <AccordionTrigger className="hover:text-primary text-left text-lg font-normal hover:no-underline">
            Does the app automatically apply to jobs for me?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            No - the app does not apply to jobs on your behalf ... yet. We are planning to add this feature in the
            future, but for now, the app is designed to help you find more job opportunities.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="sm:py-2">
          <AccordionTrigger className="hover:text-primary text-left text-lg font-normal hover:no-underline">
            Can it filter out jobs that I&apos;m not interested in?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            Yes! LinkedIn can sometimes show you jobs that are not relevant to your search (even with the filters you
            set). With <b>Advanced Matching</b> the app allows you to filter out jobs based on keywords in job titles,
            companies or even the job description.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="sm:py-2">
          <AccordionTrigger className="hover:text-primary text-left text-lg font-normal hover:no-underline">
            What happens if I close my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            If you close your computer, the app will temporarily pause its job search operations. It will automatically
            reactivate and continue searching for new jobs once you power on your computer again. For uninterrupted
            service, we&apos;ve included a setting in the app that can keep your computer awake while the app is in use.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-b-0 sm:py-2">
          <AccordionTrigger className="hover:text-primary text-left text-lg font-normal hover:no-underline">
            How will I see new job alerts when I&apos;m not in front on my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            The app is designed to send you email notifications for new found jobs. This way you can apply to jobs even
            when you are not in front of your computer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-[10vh]">
        <p className="text-base">Didn&apos;t find what you need?</p>

        <a href="mailto:contact@first2apply.com" className="text-foreground">
          Email us at&nbsp;
          <span className="hover:text-primary underline">contact@first2apply.com</span>
        </a>
      </div>
    </section>
  );
}
