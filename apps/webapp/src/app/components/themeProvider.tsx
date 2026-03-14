'use client';

import { ThemeProvider as LibThemeProvider } from '@first2apply/ui';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <LibThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange>
      {children}
    </LibThemeProvider>
  );
}
