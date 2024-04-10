import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function Faqs() {
  return (
    <section
      id="help"
      className="max-w-7xl mx-auto px-6 sm:px-10 py-[10vh] md:pt-[20vh]"
    >
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
        FAQs
      </h2>

      <Accordion type="single" collapsible className="sm:mt-[5vh]">
        <AccordionItem value="item-1" className="sm:py-2">
          <AccordionTrigger className="text-lg font-normal text-left hover:no-underline hover:text-primary">
            Why is this a desktop app and not a website?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            To maintain affordability for our users, the app is designed to
            utilize your device to refresh your saved job searches. This method
            helps us avoid the higher costs associated with using our own
            servers for this task.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-b-0 sm:py-2">
          <AccordionTrigger className="text-lg font-normal text-left hover:no-underline hover:text-primary">
            Does the app automatically apply to jobs for me?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            No - the app does not apply to jobs on your behalf ... yet. We are
            planning to add this feature in the future, but for now, the app is
            designed to help you find more job opportunities.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-b-0 sm:py-2">
          <AccordionTrigger className="text-lg font-normal text-left hover:no-underline hover:text-primary">
            Can it filter out jobs that I'm not interested in?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            Yes! LinkedIn can sometimes show you jobs that are not relevant to
            your search (even with the filters you set). With{" "}
            <b>Advanced Matching</b> the app allows you to filter out jobs based
            on keywords in job titles, companies or even the job description.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="sm:py-2">
          <AccordionTrigger className="text-lg font-normal text-left hover:no-underline hover:text-primary">
            What happens if I close my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            If you close your computer, the app will temporarily pause its job
            search operations. It will automatically reactivate and continue
            searching for new jobs once you power on your computer again. For
            uninterrupted service, we've included a setting in the app that can
            keep your computer awake while the app is in use.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5" className="border-b-0 sm:py-2">
          <AccordionTrigger className="text-lg font-normal text-left hover:no-underline hover:text-primary">
            How will I see new job alerts when I'm not in front on my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            Currently, the app delivers real-time desktop notifications to alert
            you about new job postings. We understand the importance of staying
            informed while away from your computer, and we are actively
            developing an email notification feature. This forthcoming update
            will ensure you receive timely job alerts, even when you're mobile.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 sm:mt-[10vh] flex justify-center items-center gap-4">
        <p className="text-base">Didn't find what you need?</p>

        <a
          href="mailto:dragos@first2apply.com"
          className="inline-flex w-fit items-center text-base justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-foreground shadow hover:bg-[#809966]/90 h-10 rounded-lg px-6"
        >
          Email us
        </a>
      </div>
    </section>
  );
}
