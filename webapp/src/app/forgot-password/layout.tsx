import type { Metadata } from "next";
import { AppStateProvider } from "@/hooks/appState";
import { SessionProvider } from "@/hooks/session";
import { ThemeProvider } from "@/components/themeProvider";
import { SettingsProvider } from "@/hooks/settings";
import { SitesProvider } from "@/hooks/sites";
import { LinksProvider } from "@/hooks/links";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "First 2 Apply",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <>
          <AppStateProvider>
            <SessionProvider>
              <ThemeProvider
                attribute="class"
                system={true}
                defaultTheme="system"
                // defaultTheme={"light"}
                disableTransitionOnChange
              >
                <SettingsProvider>
                  <SitesProvider>
                    <LinksProvider>
                      <div className="mx-auto min-h-screen max-w-[600px] flex items-center justify-between">
                        <div className="h-screen/2">{children}</div>
                      </div>
                    </LinksProvider>
                  </SitesProvider>
                </SettingsProvider>
              </ThemeProvider>
            </SessionProvider>
          </AppStateProvider>

          <Toaster />
        </>
      </body>
    </html>
  );
}