import siteMetadata from '@/data/siteMetadata';
import { Metadata } from 'next';

interface PageSEOProps {
  title: string;
  description?: string;
  image?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function genPageMetadata({ title, description, image, ...rest }: PageSEOProps): Metadata {
  return {
    title,
    openGraph: {
      title: `${title} | ${siteMetadata.title}`,
      description: description || siteMetadata.description,
      url: './',
      siteName: siteMetadata.title,
      images: image ? [image] : [siteMetadata.socialBanner],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      title: `${title} | ${siteMetadata.title}`,
      card: 'summary_large_image',
      images: image ? [image] : [siteMetadata.socialBanner],
    },
    icons: {
      icon: [
        { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [{ url: '/favicons/apple-touch-icon.png', sizes: '76x76' }],
      shortcut: [{ url: '/favicons/favicon.ico' }],
    },
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#fff' },
      { media: '(prefers-color-scheme: dark)', color: '#000' },
    ],
    other: {
      'msapplication-TileColor': '#000000',
      manifest: '/favicons/site.webmanifest',
      maskIcon: '<link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5" />',
    },
    ...rest,
  };
}
