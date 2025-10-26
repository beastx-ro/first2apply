import Head from 'next/head';

/**
 * Component used to render the head of a page with customizable values.
 */
export function F2aHead({ title, description, path }: { title: string; description: string; path: string }) {
  path = path.startsWith('/') ? path : `/${path}`;
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  const url = `https://first2apply.com${path}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/preview-image.jpeg" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="First 2 Apply" />
      <meta property="og:see_also" content="https://facebook.com/first2apply" />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:site" content="@first2apply" />
      <meta property="twitter:creator" content="@first2apply" />
      <meta property="og:see_also" content="https://www.linkedin.com/company/first2apply/" />
      <link rel="apple-touch-icon" sizes="76x76" href="/favicons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
      <link rel="manifest" href="/favicons/site.webmanifest" />
      <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="canonical" href={url} />
    </Head>
  );
}
