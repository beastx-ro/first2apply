import { DefaultLayout } from '@/components/defaultLayout';
import { F2aHead } from '@/components/head';
import { Button } from '@first2apply/ui';
import { sendGTMEvent } from '@next/third-parties/google';

export default function Download() {
  return (
    <>
      <F2aHead
        title="Download First 2 Apply"
        description="Experience the convenience of monitoring and managing job
          applications from top platforms, all in one place. Dive into a 7-day
          free trial, no credit card required."
        path="/download"
      />

      <DefaultLayout>
        <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-7xl flex-col items-center justify-center px-6 pb-14 sm:px-10 md:min-h-[calc(100vh-64px)] md:pb-16">
          <h1 className="w-full text-balance text-3xl font-semibold sm:text-center sm:text-5xl lg:text-6xl">
            Download First 2 Apply
          </h1>
          <h2 className="mt-2 text-sm font-medium text-foreground/70 sm:text-balance sm:text-center sm:tracking-wide lg:text-xl">
            Experience the convenience of monitoring and managing job applications from top platforms, all in one place.
            Dive into a 7-day free trial, no credit card required
          </h2>

          <div className="mt-12 flex w-full flex-col gap-4 xs:max-w-[500px] xs:flex-row xs:flex-wrap xs:items-center xs:justify-center">
            {/* macos apple silicon */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/arm64/first2apply-latest.dmg"
              onClick={() => {
                sendGTMEvent({
                  event: 'file_download',
                  file_extension: 'dmg',
                });
              }}
            >
              <Button size="lg" className="flex h-12 w-full items-center gap-2 xs:w-fit">
                <svg
                  className="h-4 w-auto"
                  viewBox="0 0 814 1000"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.8-82-102.2-209.3-102.2-330.1C2.3 349.9 79.1 218.2 199.8 218.2c63.4 0 116.2 41.6 155.5 41.6 37.7 0 96.4-44.2 170.4-44.2 27.5 0 126.2 2.3 191.4 87.3zm-282.5-153.8c31.7-38.4 54.5-91.5 54.5-144.7 0-7.5-.6-14.8-1.9-20.9-51.9 1.9-113.5 34.6-150.7 77.8-26.7 30.5-54.5 83.6-54.5 137.5 0 8.1 1.3 16.1 1.9 18.7 3.2.6 8.4 1.3 13.6 1.3 46.5 0 104.8-31.2 137.1-69.7z" />
                </svg>
                MacOS Apple Silicon
              </Button>
            </a>

            {/* windows */}
            <a
              href="ms-windows-store://pdp/?productid=9NK18WV87SV2"
              onClick={() => {
                sendGTMEvent({
                  event: 'file_download',
                  file_extension: 'exe',
                });
              }}
            >
              <Button size="lg" className="flex h-12 w-full items-center gap-2 xs:w-fit">
                <svg className="h-4 w-auto" viewBox="0 0 88 88" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 71.48l-.026-25.55zm4.326-39.025L87.314 0v42.185l-47.318.376zm47.329 39.349l-.011 42.139L39.996 81.222l-.054-34.962z" />
                </svg>
                Windows
              </Button>
            </a>

            {/* macos x64 */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/x64/first2apply-latest.dmg"
              onClick={() => {
                sendGTMEvent({
                  event: 'file_download',
                  file_extension: 'dmg',
                });
              }}
            >
              <Button size="lg" className="flex h-12 w-full items-center gap-2 xs:w-fit">
                <svg
                  className="h-4 w-auto"
                  viewBox="0 0 814 1000"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.8-82-102.2-209.3-102.2-330.1C2.3 349.9 79.1 218.2 199.8 218.2c63.4 0 116.2 41.6 155.5 41.6 37.7 0 96.4-44.2 170.4-44.2 27.5 0 126.2 2.3 191.4 87.3zm-282.5-153.8c31.7-38.4 54.5-91.5 54.5-144.7 0-7.5-.6-14.8-1.9-20.9-51.9 1.9-113.5 34.6-150.7 77.8-26.7 30.5-54.5 83.6-54.5 137.5 0 8.1 1.3 16.1 1.9 18.7 3.2.6 8.4 1.3 13.6 1.3 46.5 0 104.8-31.2 137.1-69.7z" />
                </svg>
                MacOS Intel
              </Button>
            </a>

            {/* linux */}
            <a
              href="https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/linux/x64/first2apply-latest.deb"
              onClick={() => {
                sendGTMEvent({
                  event: 'file_download',
                  file_extension: 'deb',
                });
              }}
            >
              <Button size="lg" className="flex h-12 w-full items-center gap-2 xs:w-fit">
                <svg className="h-auto w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <rect width="24" height="24" fill="none"></rect>
                  <path d="M14.62,8.35c-.42.28-1.75,1-1.95,1.19a.82.82,0,0,1-1.14,0c-.2-.16-1.53-.92-1.95-1.19s-.45-.7.08-.92a6.16,6.16,0,0,1,4.91,0c.49.21.51.6,0,.9m7.22,7.28A19.09,19.09,0,0,0,18,10a4.31,4.31,0,0,1-1.06-1.88c-.1-.33-.17-.67-.24-1A11.32,11.32,0,0,0,16,4.47,4.06,4.06,0,0,0,12.16,2,4.2,4.2,0,0,0,8.21,4.4a5.9,5.9,0,0,0-.46,1.34c-.17.76-.32,1.55-.5,2.32a3.38,3.38,0,0,1-1,1.71,19.53,19.53,0,0,0-3.88,5.35A6.09,6.09,0,0,0,2,16c-.19.66.29,1.12,1,1,.44-.09.88-.18,1.3-.31s.57,0,.67.35a6.73,6.73,0,0,0,4.24,4.5c4.12,1.56,8.93-.66,10-4.58.07-.27.17-.37.47-.27.46.14.93.24,1.4.35a.72.72,0,0,0,.92-.64,1.44,1.44,0,0,0-.16-.73"></path>
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
