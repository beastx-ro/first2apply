import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { GoogleTagManager } from "@next/third-parties/google";
import { ThemeProvider } from "@/components/themeProvider";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />
      </ThemeProvider>

      <GoogleTagManager
        gtmId="GTM-KD9GMF7P	
"
      />
    </>
  );
}
