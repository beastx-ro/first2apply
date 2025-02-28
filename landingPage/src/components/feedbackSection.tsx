import { ChevronLeftIcon, ChevronRightIcon, QuoteIcon } from '@radix-ui/react-icons';
import { ReactElement, useState } from 'react';

type Review = {
  title: string;
  details: string;
  source: ReactElement;
};

const reviews: Review[] = [
  {
    title: 'Helped me find a job within a few days of installing!',
    details:
      "After being able to only send out about 5-10 applications a day, which usually took me about 3 hours of parsing through a bunch of suggestions that simply weren't relevant to me, this app immensely increased my productivity! I was able to send out about 30-40 applications most days, in the course of about 2 hours. It also found jobs that I would've otherwise not seen! But most importantly, it allowed me to be one of the first applicants (I believe I was within the first 5) to a particular job, which I am sure was instrumental in me then landing that position!",
    source: <a href="https://apps.microsoft.com/detail/9nk18wv87sv2?hl=en-us&gl=US">MS Store Reviews</a>,
  },
  {
    title: 'Where can I leave a review for First2Apply?',
    details:
      "I want to leave a review as this App has been a powerful tool for me over the past several months. I just recommended it to my FB group for women in tech and I know several have downloaded it. I want to spread the word further. I start a new role on 12/2/24 and it was because I was one of the first resume's in the recruiters pile. Wouldn't have happened without this application. Where can I leave a review? Everyone whose searching for work should be using First2Apply. For real.",
    source: (
      <a href="https://www.reddit.com/r/first2apply/comments/1gugtme/where_can_i_leave_a_review_for_first2apply/">
        Reddit
      </a>
    ),
  },
  {
    title: 'First 2 Apply worked for me!',
    details: `I GOT A JOB! It took a long time to find the right program that didn't \"mass apply\" and that gave you results quickly and orderly. The application helped me a lot to be able to filter and apply quickly and efficiently. My trick was to use the application to search and find jobs quickly then use Simplify to be able to tailor my resume quickly. It was a win-win and I HIGHLY recommend this program. It was a game changer getting ahead of a lot of applications and having the frequent notifications when things came in were great. I think this is how I was able to increase my interview rate and I was able to finally land a job after 12 months and thousands of applications. For the record, I applied to 329 jobs manually with this program. They listen to feedback as well and are very quick with any issues you might have. I think this is the best app out there to get. Thank you again. I will be recommending this program!`,
    source: <a href="https://www.reddit.com/r/first2apply/comments/1h83xgm/first_2_apply_worked_for_me/">Reddit</a>,
  },
];

export function FeedbackSection() {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const handleNextReview = () => {
    setCurrentReviewIndex((currentReviewIndex + 1) % reviews.length);
  };

  const handlePreviousReview = () => {
    setCurrentReviewIndex(currentReviewIndex === 0 ? reviews.length - 1 : currentReviewIndex - 1);
  };

  const currentReview = reviews[currentReviewIndex];

  return (
    <section id="feedback" className="mt-[10vh] bg-muted dark:bg-card/60 md:mt-[20vh]">
      <div className="relative mx-auto flex max-w-7xl flex-col justify-center py-10 xs:py-32">
        <QuoteIcon className="flex h-10 w-10 flex-col justify-center text-foreground/80 sm:h-16 sm:w-16" />
        <p className="flex min-h-[600px] flex-col justify-center px-10 xs:min-h-[500px] sm:px-16 md:min-h-[400px] lg:min-h-80">
          <span className="block text-balance text-2xl font-medium sm:text-3xl">{currentReview.title}</span>
          <span className="block pt-4 text-base sm:text-justify sm:text-lg">{currentReview.details} </span>
        </p>
        <div className="flex items-center">
          <p className="px-10 text-left text-sm text-foreground/80 sm:px-16">Source: {currentReview.source}</p>
          <QuoteIcon className="ml-auto h-10 w-10 text-foreground/80 sm:h-16 sm:w-16" />
        </div>

        {reviews.length > 1 && (
          <div className="flex w-full justify-between gap-6 px-10 pt-8 xs:absolute xs:bottom-14 xs:pt-0 sm:px-16">
            <button className="flex animate-pulse items-center gap-2" onClick={handlePreviousReview}>
              <div className="h-fit w-fit rounded-full bg-foreground/5 p-2">
                <ChevronLeftIcon className="h-auto w-6 text-foreground" />
              </div>
              Back
            </button>
            <button onClick={handleNextReview} className="flex animate-pulse items-center gap-2">
              Next
              <div className="h-fit w-fit rounded-full bg-foreground/5 p-2">
                <ChevronRightIcon className="h-5 w-auto text-foreground" />
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
