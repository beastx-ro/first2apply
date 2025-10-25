import Image from 'next/image';
import Link from 'next/link';

import trackBlackImage from '../../public/assets/track-black.png';
import trackWhiteImage from '../../public/assets/track-white.png';
import { Button } from './ui/button';

export function ProductSection() {
  return (
    <section id="product">
      <div className="mx-auto flex h-[calc(55vh-56px)] w-full max-w-7xl flex-col items-start justify-end px-6 sm:px-10 md:h-[calc(50vh-64px)] md:flex-row md:items-end md:justify-between md:gap-10 lg:gap-20">
        <div id="embed02" className="absolute top-20 md:top-[calc(25vh-27px)]">
          <a
            href="https://www.producthunt.com/posts/first-2-apply?utm_source=badge-featured&amp;utm_medium=badge&amp;utm_souce=badge-first-2-apply"
            target="_blank"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=443975&amp;theme=dark"
              alt="First 2 Apply - New job alerts from 10+ most popular sites  | Product Hunt"
              width="250"
              height="54"
            />
          </a>
        </div>

        <h1 className="z-10 text-3xl font-semibold sm:text-5xl md:text-nowrap lg:text-6xl">
          New job alerts from&nbsp;
          <br className="hidden md:inline-block" />
          10+ most popular sites.
        </h1>

        <h2 className="mt-2 text-sm text-foreground/70 md:hidden">
          Land more interviews by being the first to know when new jobs are posted.&nbsp;
          <br className="hidden sm:inline-block" />
          Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards.
        </h2>

        <Link href="/download" passHref className="self-center md:self-end">
          <Button className="my-[calc(10vh-64px)] h-12 w-full max-w-72 text-xl md:my-0 lg:h-14 lg:max-w-96 lg:text-2xl">
            Try it&nbsp;
            <span className="md:hidden lg:inline-block">now&nbsp;</span>
            for free
          </Button>
        </Link>
      </div>

      <div className="relative hidden h-[50vh] bg-gradient-to-t from-muted to-background dark:from-card/60 md:block">
        <div className="mx-auto max-w-7xl px-6 pt-3 sm:px-10">
          <h2 className="text-md text-foreground/70 lg:text-lg">
            Land more interviews by being the first to know when new jobs are posted.
            <br />
            Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards.
          </h2>

          <Image
            src={trackBlackImage}
            alt="paperfly track black"
            priority={true}
            className="absolute top-2 z-10 h-auto max-h-[315px] w-96 dark:hidden md:left-1/2 md:ml-40 md:-translate-x-1/2 lg:ml-44 lg:h-[40vh] lg:w-auto"
          />
          <Image
            src={trackWhiteImage}
            alt="paperfly track white"
            priority={true}
            className="absolute top-2 z-10 hidden h-auto max-h-[315px] w-96 dark:block md:left-1/2 md:ml-40 md:-translate-x-1/2 lg:ml-44 lg:h-[40vh] lg:w-auto"
          />
        </div>
      </div>

      <div className="mx-auto min-h-fit max-w-5xl overflow-hidden px-6 md:relative md:-top-[20vh] md:px-10">
        <iframe
          className="h-[250px] rounded-2xl shadow-lg xs:h-[350px] sm:h-[500px] md:h-[550px] lg:h-[662px]"
          width="100%"
          height="720"
          src="https://www.youtube.com/embed/FdGVp3SbV2k?si=X5NGCDIo0K_ibaZN"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
