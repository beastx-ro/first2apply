'use client';

import { LinksProvider, SdkProvider, SitesProvider, ThemeProvider } from '@first2apply/ui';

import { WebappApiSdk } from '../../lib/sdk';

export function WithClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={'system'} disableTransitionOnChange>
      <SdkProvider sdk={new WebappApiSdk()}>
        <SitesProvider>
          <LinksProvider>{children}</LinksProvider>
        </SitesProvider>
      </SdkProvider>
    </ThemeProvider>
  );
}
