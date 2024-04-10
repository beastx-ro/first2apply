import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import trackBlackImage from "../../public/assets/track-black.png";
import trackWhiteImage from "../../public/assets/track-white.png";
import homepageLight from "../../public/assets/homepage-light.png";
import homepageDark from "../../public/assets/homepage-dark.png";

export function ProductSection() {
  return (
    <section id="product">
      <div className="w-full max-w-7xl h-[calc(50vh-56px)] md:h-[calc(50vh-64px)] mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-start md:items-end justify-end md:justify-between md:gap-10 lg:gap-20">
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

        <h1 className="z-10 text-3xl sm:text-5xl lg:text-6xl font-semibold md:text-nowrap">
          New job alerts from&nbsp;
          <br className="hidden md:inline-block" />
          10+ most popular sites.
        </h1>

        <h2 className="md:hidden text-sm text-foreground/70 mt-2">
          Stop waisting time manually browsing LinkedIn, Indeed, Dice or other
          job boards.
        </h2>

        <Link href="/download" passHref className="self-center md:self-end">
          <Button className="w-full max-w-72 lg:max-w-96 h-12 lg:h-14 text-xl lg:text-2xl my-[calc(10vh-64px)] md:my-0">
            Try it&nbsp;
            <span className="md:hidden lg:inline-block">now&nbsp;</span>
            for free
          </Button>
        </Link>
      </div>

      <div className="hidden md:block relative h-[50vh] bg-gradient-to-t from-muted dark:from-card/60 to-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-3">
          <h2 className="text-sm lg:text-base text-foreground/70">
            Stop waisting time manually browsing LinkedIn, Indeed, Dice or other
            job boards.
          </h2>

          <Image
            src={trackBlackImage}
            alt="paperfly track black"
            className="z-10 dark:hidden absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-28 lg:ml-8"
          />
          <Image
            src={trackWhiteImage}
            alt="paperfly track white"
            className="z-10 hidden dark:block absolute top-2 md:left-1/2 md:-translate-x-1/2 h-auto lg:h-[40vh] max-h-[315px] w-96 lg:w-auto md:ml-28 lg:ml-8"
          />
        </div>
      </div>

      <div className="md:relative md:-top-[20vh] max-w-5xl mx-auto rounded-2xl">
        <Image
          src={homepageLight}
          alt="app homepage light"
          className="dark:hidden w-full h-auto"
        />
        <Image
          src={homepageDark}
          alt="app homepage dark"
          className="hidden dark:block w-full h-auto"
        />
      </div>
    </section>
  );
}