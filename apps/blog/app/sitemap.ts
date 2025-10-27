import siteMetadata from '@/data/siteMetadata';
import { allBlogs } from 'contentlayer/generated';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl;

  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.slug}`,
      lastModified: post.lastmod || post.date,
    }));

  const routes = ['/', '/tags', '/articles', '/about'].map((route) => {
    // make sure there is no end slash
    if (route.endsWith('/')) {
      route = route.slice(0, -1);
    }
    return {
      url: `${siteUrl}${route}`,
      lastModified: new Date().toISOString().split('T')[0],
    };
  });

  return [...routes, ...blogRoutes];
}
