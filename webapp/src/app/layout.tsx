import type { Metadata } from "next";
import "./globals.css";
import { AppStateProvider } from "@/hooks/appState";
import { SessionProvider } from "@/hooks/session";
import { ThemeProvider } from "@/components/themeProvider";
import { SettingsProvider } from "@/hooks/settings";
import { SitesProvider } from "@/hooks/sites";
import { LinksProvider } from "@/hooks/links";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";

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
                      <>
                        <Navbar />
                        <main className="ml-16 md:ml-20 2xl:ml-56">
                          <div className="mx-auto min-h-screen max-w-[1536px] p-6">
                            {children}
                          </div>
                        </main>
                      </>
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
