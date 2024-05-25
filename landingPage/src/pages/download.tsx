import { DefaultLayout } from "@/components/defaultLayout";
import { Button } from "@/components/ui/button";
import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import Head from "next/head";

export default function Download() {
  return (
    <>
      <Head>
        <title>Download First 2 Apply</title>
        <meta
          name="description"
          content="Experience the convenience of monitoring and managing job
          applications from top platforms, all in one place. Dive into a 7-day
          free trial, no payment required."
        />
        <meta property="og:title" content="Download First 2 Apply" />
        <meta
          property="og:description"
          content="Experience the convenience of monitoring and managing job
          applications from top platforms, all in one place. Dive into a 7-day
          free trial, no payment required."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/preview-image.jpeg" />
        <meta property="og:url" content="https://www.first2apply.com" />
        <meta property="og:site_name" content="First 2 Apply" />
        <meta
          property="og:see_also"
          content="https://www.facebook.com/first2apply"
        />

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

      <DefaultLayout>
        <section className="w-full max-w-7xl min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] mx-auto px-6 sm:px-10 pb-14 md:pb-16 flex flex-col items-center justify-center">
          <h1 className="w-full text-3xl sm:text-5xl lg:text-6xl font-semibold sm:text-center text-balance">
            Download First 2 Apply
          </h1>
          <h2 className="mt-2 text-sm lg:text-xl text-foreground/70 font-medium sm:text-center sm:text-balance sm:tracking-wide">
            Experience the convenience of monitoring and managing job
            applications from top platforms, all in one place. Dive into a 7-day
            free trial, no payment required
          </h2>

          <div className="mt-12 w-full xs:max-w-[500px] flex flex-col xs:flex-row xs:flex-wrap xs:items-center xs:justify-center gap-4">
            {/* macos apple silicon */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/arm64/First+2+Apply-1.4.0-arm64.dmg"
              onClick={() => {
                sendGTMEvent({ event: "file_download" });
                sendGAEvent("event", "file_download", {
                  file_name: "First 2 Apply-1.4.0-arm64",
                  file_extension: "dmg",
                  link_domain: "first2apply.com",
                });
              }}
            >
              <Button
                size="lg"
                className="h-12 w-full xs:w-fit flex items-center gap-2"
              >
                <img
                  width="16"
                  alt="Apple logo white"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Apple_logo_white.svg/256px-Apple_logo_white.svg.png"
                  className="h-4 w-auto hidden dark:block"
                />
                <img
                  width="16"
                  alt="Apple logo black"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/256px-Apple_logo_black.svg.png"
                  className="h-4 w-auto dark:hidden"
                />
                MacOS Apple Silicon
              </Button>
            </a>

            {/* windows */}
            <a
              href="ms-windows-store://pdp/?productid=9NK18WV87SV2"
              onClick={() => {
                sendGTMEvent({ event: "file_download" });
                sendGAEvent("event", "file_download", {
                  file_name: "First 2 Apply-1.4.0",
                  file_extension: "exe",
                  link_domain: "first2apply.com",
                });
              }}
            >
              <Button
                size="lg"
                className="h-12 w-full xs:w-fit flex items-center gap-2"
              >
                <img
                  width="16"
                  alt="Windows logo white"
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Windows_icon_logo.png"
                  className="h-4 w-auto hidden dark:block"
                />
                <img
                  width="16"
                  alt="Windows logo black"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Windows_logo_2012-Black.svg/64px-Windows_logo_2012-Black.svg.png"
                  className="h-4 w-auto dark:hidden"
                />
                Windows
              </Button>
            </a>

            {/* macos x64 */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/x64/First+2+Apply-1.4.0-x64.dmg"
              onClick={() => {
                sendGTMEvent({ event: "file_download" });
                sendGAEvent("event", "file_download", {
                  file_name: "First 2 Apply-1.4.0-x64",
                  file_extension: "dmg",
                  link_domain: "first2apply.com",
                });
              }}
            >
              <Button
                size="lg"
                className="h-12 w-full xs:w-fit flex items-center gap-2"
              >
                <img
                  width="16"
                  alt="Apple logo white"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Apple_logo_white.svg/256px-Apple_logo_white.svg.png"
                  className="h-4 w-auto hidden dark:block"
                />
                <img
                  width="16"
                  alt="Apple logo black"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/256px-Apple_logo_black.svg.png"
                  className="h-4 w-auto dark:hidden"
                />
                MacOS Intel
              </Button>
            </a>

            {/* linux */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/linux/x64/first-2-apply_1.4.0_amd64.deb"
              onClick={() => {
                sendGTMEvent({ event: "file_download" });
                sendGAEvent("event", "file_download", {
                  file_name: "First 2 Apply-1.4.0-amd64",
                  file_extension: "deb",
                  link_domain: "first2apply.com",
                });
              }}
            >
              <Button
                size="lg"
                className="h-12 w-full xs:w-fit flex items-center gap-2"
              >
                <svg
                  className="dark:hidden w-5 h-auto"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>linux</title>{" "}
                    <rect width="24" height="24" fill="none"></rect>{" "}
                    <path d="M14.62,8.35c-.42.28-1.75,1-1.95,1.19a.82.82,0,0,1-1.14,0c-.2-.16-1.53-.92-1.95-1.19s-.45-.7.08-.92a6.16,6.16,0,0,1,4.91,0c.49.21.51.6,0,.9m7.22,7.28A19.09,19.09,0,0,0,18,10a4.31,4.31,0,0,1-1.06-1.88c-.1-.33-.17-.67-.24-1A11.32,11.32,0,0,0,16,4.47,4.06,4.06,0,0,0,12.16,2,4.2,4.2,0,0,0,8.21,4.4a5.9,5.9,0,0,0-.46,1.34c-.17.76-.32,1.55-.5,2.32a3.38,3.38,0,0,1-1,1.71,19.53,19.53,0,0,0-3.88,5.35A6.09,6.09,0,0,0,2,16c-.19.66.29,1.12,1,1,.44-.09.88-.18,1.3-.31s.57,0,.67.35a6.73,6.73,0,0,0,4.24,4.5c4.12,1.56,8.93-.66,10-4.58.07-.27.17-.37.47-.27.46.14.93.24,1.4.35a.72.72,0,0,0,.92-.64,1.44,1.44,0,0,0-.16-.73"></path>{" "}
                  </g>
                </svg>
                <svg
                  className="hidden dark:block w-5 h-auto"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <title>linux</title>{" "}
                    <rect width="24" height="24" fill="none"></rect>{" "}
                    <path d="M14.62,8.35c-.42.28-1.75,1-1.95,1.19a.82.82,0,0,1-1.14,0c-.2-.16-1.53-.92-1.95-1.19s-.45-.7.08-.92a6.16,6.16,0,0,1,4.91,0c.49.21.51.6,0,.9m7.22,7.28A19.09,19.09,0,0,0,18,10a4.31,4.31,0,0,1-1.06-1.88c-.1-.33-.17-.67-.24-1A11.32,11.32,0,0,0,16,4.47,4.06,4.06,0,0,0,12.16,2,4.2,4.2,0,0,0,8.21,4.4a5.9,5.9,0,0,0-.46,1.34c-.17.76-.32,1.55-.5,2.32a3.38,3.38,0,0,1-1,1.71,19.53,19.53,0,0,0-3.88,5.35A6.09,6.09,0,0,0,2,16c-.19.66.29,1.12,1,1,.44-.09.88-.18,1.3-.31s.57,0,.67.35a6.73,6.73,0,0,0,4.24,4.5c4.12,1.56,8.93-.66,10-4.58.07-.27.17-.37.47-.27.46.14.93.24,1.4.35a.72.72,0,0,0,.92-.64,1.44,1.44,0,0,0-.16-.73"></path>{" "}
                  </g>
                </svg>
                Linux
              </Button>
            </a>
          </div>
        </section>
      </DefaultLayout>
    </>
  );
}
