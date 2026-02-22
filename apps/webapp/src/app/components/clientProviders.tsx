'use client';

import { JobSite, Link } from '@first2apply/core';
import { LinksProvider, SdkProvider, SitesProvider, ThemeProvider } from '@first2apply/ui';

import { WebappApiSdk } from '../../lib/sdk';

export function WithClientProviders({
  sites,
  links,
  children,
}: {
  sites: JobSite[];
  links: Link[];
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme={'system'} disableTransitionOnChange>
      <SdkProvider sdk={new WebappApiSdk()}>
        <SitesProvider sites={sites}>
          <LinksProvider links={links}>{children}</LinksProvider>
        </SitesProvider>
      </SdkProvider>
    </ThemeProvider>
  );
}
