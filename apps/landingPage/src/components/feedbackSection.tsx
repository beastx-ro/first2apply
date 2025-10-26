import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { QuoteIcon } from '@radix-ui/react-icons';
import Autoplay from 'embla-carousel-autoplay';

type Review = {
  title: string;
  details: string;
  source: { href: string; name: string };
};

const reviews: Review[] = [
  {
    title: 'Helped me find a job within a few days of installing!',
    details:
      "After being able to only send out about 5-10 applications a day, which usually took me about 3 hours of parsing through a bunch of suggestions that simply weren't relevant to me, this app immensely increased my productivity! I was able to send out about 30-40 applications most days, in the course of about 2 hours. It also found jobs that I would've otherwise not seen! But most importantly, it allowed me to be one of the first applicants (I believe I was within the first 5) to a particular job, which I am sure was instrumental in me then landing that position!",
    source: {
      href: 'https://apps.microsoft.com/detail/9nk18wv87sv2?hl=en-us&gl=US">MS Store Reviews',
      name: 'MS Store Reviews',
    },
  },
  {
    title: 'Where can I leave a review for First2Apply?',
    details:
      "I want to leave a review as this App has been a powerful tool for me over the past several months. I just recommended it to my FB group for women in tech and I know several have downloaded it. I want to spread the word further. I start a new role on 12/2/24 and it was because I was one of the first resume's in the recruiters pile. Wouldn't have happened without this application. Where can I leave a review? Everyone whose searching for work should be using First2Apply. For real.",
    source: {
      href: 'https://www.reddit.com/r/first2apply/comments/1gugtme/where_can_i_leave_a_review_for_first2apply/',
      name: 'Reddit',
    },
  },
  {
    title: 'First 2 Apply worked for me!',
    details: `I GOT A JOB! It took a long time to find the right program that didn't \"mass apply\" and that gave you results quickly and orderly. The application helped me a lot to be able to filter and apply quickly and efficiently. My trick was to use the application to search and find jobs quickly then use Simplify to be able to tailor my resume quickly. It was a win-win and I HIGHLY recommend this program. It was a game changer getting ahead of a lot of applications and having the frequent notifications when things came in were great. I think this is how I was able to increase my interview rate and I was able to finally land a job after 12 months and thousands of applications. For the record, I applied to 329 jobs manually with this program. They listen to feedback as well and are very quick with any issues you might have. I think this is the best app out there to get. Thank you again. I will be recommending this program!`,
    source: {
      href: 'https://www.reddit.com/r/first2apply/comments/1h83xgm/first_2_apply_worked_for_me/',
      name: 'Reddit',
    },
  },
];

export function FeedbackSection() {
  return (
    <section id="feedback" className="bg-muted dark:bg-card/60 relative mt-[10vh] md:mt-[20vh]">
      <QuoteIcon className="text-foreground/80 absolute left-1 top-2 h-10 w-10 sm:top-10 sm:h-16 sm:w-16" />
      <Carousel
        className="xs:py-32 mx-auto flex max-w-7xl flex-col justify-center py-12"
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 8000,
          }),
        ]}
      >
        <CarouselContent>
          {reviews.map((review, index) => (
            <CarouselItem key={index} className="flex flex-col justify-center px-10 sm:px-16">
              <p className="block text-balance text-2xl font-medium sm:text-3xl">{review.title}</p>
              <p className="mt-4 block text-base sm:text-justify sm:text-lg">{review.details} </p>
              <a href={review.source.href} className="text-muted-foreground mt-4">
                Source: {review.source.name}
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="mt-10 hidden items-center justify-between px-14 md:flex">
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative bottom-auto left-0 right-auto top-0 translate-y-0" />
            Back
          </div>
          <div className="flex items-center gap-2">
            Next
            <CarouselNext className="relative bottom-auto left-0 right-auto top-0 translate-y-0" />
          </div>
        </div>
      </Carousel>
      <QuoteIcon className="text-foreground/80 absolute bottom-2 right-1 h-10 w-10 sm:bottom-10 sm:h-16 sm:w-16" />
    </section>
  );
}
