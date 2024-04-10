import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>
          First 2 Apply - New job alerts from 10+ most popular sites
        </title>
        <meta
          name="description"
          content="Land more interviews by being the first to know when new jobs are posted. Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards."
        />
        <meta
          property="og:title"
          content="First 2 Apply - New job alerts from 10+ most popular sites"
        />
        <meta
          property="og:description"
          content="Land more interviews by being the first to know when new jobs are posted. Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/preview-image.jpeg" />
        <meta property="og:url" content="https://www.first2apply.com" />
        <meta property="og:site_name" content="First 2 Apply" />
        <meta
          property="og:see_also"
          content="https://www.facebook.com/first2apply"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.first2apply.com" />
        <meta
          property="twitter:title"
          content="First 2 Apply - New job alerts from 10+ most popular sites"
        />
        <meta
          property="twitter:description"
          content="Land more interviews by being the first to know when new jobs are posted. Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards."
        />
        <meta property="twitter:site" content="@first2apply" />
        <meta property="twitter:creator" content="@first2apply" />
        <meta
          property="og:see_also"
          content="https://www.linkedin.com/company/first2apply/"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/favicons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicons/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicons/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#000"
        />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
