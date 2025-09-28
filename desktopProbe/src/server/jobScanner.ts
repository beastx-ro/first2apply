import { IAnalyticsClient } from '@/lib/analytics';
import { BrowserWindow, Notification, app, powerSaveBlocker } from 'electron';
import fs from 'fs';
import { ScheduledTask, schedule } from 'node-cron';
import path from 'path';

import { Job, Link } from '../../../supabase/functions/_shared/types';
import { getExceptionMessage, throwError } from '../lib/error';
import { AVAILABLE_CRON_RULES, JobScannerSettings } from '../lib/types';
import { chunk, promiseAllSequence, waitRandomBetween } from './helpers';
import { HtmlDownloader } from './htmlDownloader';
import { ILogger } from './logger';
import { F2aSupabaseApi } from './supabaseApi';

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

const DEFAULT_SETTINGS: JobScannerSettings = {
  cronRule: AVAILABLE_CRON_RULES[0].value,
  preventSleep: true,
  useSound: true,
  areEmailAlertsEnabled: true,
};

/**
 * Class used to manage a cron job that periodically scans links.
 */
export class JobScanner {
  private _logger: ILogger;
  private _supabaseApi: F2aSupabaseApi;
  private _normalHtmlDownloader: HtmlDownloader;
  private _incognitoHtmlDownloader: HtmlDownloader;
  private _onNavigate: (_: { path: string }) => void;
  private _analytics: IAnalyticsClient;

  private _isRunning = true;
  // do not use the default settings directly
  private _settings: JobScannerSettings = {
    preventSleep: false,
    useSound: false,
    areEmailAlertsEnabled: true,
  };
  private _cronJob: ScheduledTask | undefined;
  private _prowerSaveBlockerId: number | undefined;
  private _notificationsMap: Map<string, Notification> = new Map();
  private _runningScansCount = 0;

  constructor({
    logger,
    supabaseApi,
    normalHtmlDownloader,
    incognitoHtmlDownloader,
    onNavigate,
    analytics,
  }: {
    logger: ILogger;
    supabaseApi: F2aSupabaseApi;
    normalHtmlDownloader: HtmlDownloader;
    incognitoHtmlDownloader: HtmlDownloader;
    onNavigate: (_: { path: string }) => void;
    analytics: IAnalyticsClient;
  }) {
    this._logger = logger;
    this._supabaseApi = supabaseApi;
    this._normalHtmlDownloader = normalHtmlDownloader;
    this._incognitoHtmlDownloader = incognitoHtmlDownloader;
    this._onNavigate = onNavigate;
    this._analytics = analytics;

    // used for testing
    // fs.unlinkSync(settingsPath);

    // load the setings from disk
    let settingsToApply = this._settings;
    if (fs.existsSync(settingsPath)) {
      settingsToApply = {
        ...this._settings,
        ...JSON.parse(fs.readFileSync(settingsPath, 'utf-8')),
      };
      this._logger.info(`loadied settings from disk: ${JSON.stringify(settingsToApply)}`);
    } else {
      this._logger.info(`no settings found on disk, using defaults`);
      settingsToApply = DEFAULT_SETTINGS;
    }

    this._applySettings(settingsToApply);
  }

  /**
   * Check if there are any scans running.
   */
  isScanning() {
    return this._runningScansCount > 0;
  }

  /**
   * Scan all links for the current user.
   */
  async scanAllLinks() {
    // if the scanner hasn't finished scanning the previous links, skip this scan
    if (this.isScanning()) {
      this._logger.info('skipping scheduled scan because the scanner is processing other links');
      return;
    }

    // fetch all links from the database
    const links = (await this._supabaseApi.listLinks()) ?? [];
    this._logger.info(`found ${links?.length} links`);

    // start the scan
    return this.scanLinks({ links });
  }

  /**
   * Perform a scan of a list links.
   */
  async scanLinks({ links, sendNotification = true }: { links: Link[]; sendNotification?: boolean }) {
    try {
      this._logger.info('scanning links ...');
      this._analytics.trackEvent('scan_links_start', {
        links_count: links.length,
      });
      this._runningScansCount++;
      const start = new Date().getTime();

      await Promise.all(
        links.map(async (link) => {
          const newJobs = await this._normalHtmlDownloader
            .loadUrl({
              url: link.url,
              scrollTimes: 5,
              callback: async ({ html, maxRetries, retryCount }) => {
                if (!this._isRunning) return []; // stop if the scanner is closed

                const { newJobs, parseFailed } = await this._supabaseApi.scanHtmls([
                  { linkId: link.id, content: html, maxRetries, retryCount },
                ]);

                if (parseFailed) {
                  this._logger.debug(`failed to parse html for link ${link.title}`, {
                    linkId: link.id,
                  });

                  throw new Error(`failed to parse html for link ${link.id}`);
                }

                // add a random delay before moving on to the next link
                // to avoid being rate limited by cloudflare
                await waitRandomBetween(1000, 4000);

                return newJobs;
              },
            })
            .catch(async (error): Promise<Job[]> => {
              if (this._isRunning) {
                const errorMessage = getExceptionMessage(error);
                this._logger.error(`failed to scan link: ${errorMessage}`, {
                  linkId: link.id,
                });

                // when dealing with rate limits, bump the number of failed attempts for the link
                await this._supabaseApi
                  .increaseScrapeFailureCount({
                    linkId: link.id,
                    failures: link.scrape_failure_count + 1,
                  })
                  .catch((error) => {
                    this._logger.error(`failed to increase scrape failure count: ${getExceptionMessage(error)}`, {
                      linkId: link.id,
                    });
                  });
              }

              // intetionally return an empty array if there is an error
              // in order to continue scanning the rest of the links
              return [];
            });

          return newJobs;
        }),
      );
      this._logger.info(`downloaded html for ${links.length} links`);

      // scan job descriptions for all pending jobs
      if (!this._isRunning) return;
      const { jobs } = await this._supabaseApi.listJobs({
        status: 'processing',
        limit: 300,
      });
      this._logger.info(`found ${jobs.length} jobs that need processing`);
      const scannedJobs = await this.scanJobs(jobs);
      const newJobs = scannedJobs.filter((job) => job.status === 'new');

      // run post scan hook
      const newJobIds = newJobs.map((job) => job.id);
      await this._supabaseApi
        .runPostScanHook({
          newJobIds: sendNotification ? newJobIds : [], // hacky way to supress email alerts
          areEmailAlertsEnabled: this._settings.areEmailAlertsEnabled,
        })
        .catch((error) => {
          this._logger.error(`failed to run post scan hook: ${getExceptionMessage(error)}`);
        });

      // fire a notification if there are new jobs
      if (!this._isRunning) return;
      if (sendNotification) this.showNewJobsNotification({ newJobs });

      const end = new Date().getTime();
      const took = (end - start) / 1000;
      this._logger.info(`scan complete in ${took.toFixed(0)} seconds`);
      this._analytics.trackEvent('scan_links_complete', {
        links_count: links.length,
        new_jobs_count: newJobs.length,
      });
    } catch (error) {
      this._logger.error(getExceptionMessage(error));
    } finally {
      this._runningScansCount--;
    }
  }

  /**
   * Scan a list of new jobs to extract the description.
   */
  async scanJobs(jobs: Job[]): Promise<Job[]> {
    this._logger.info(`scanning ${jobs.length} jobs descriptions...`);

    // figure out which jobs can be scanned in incognito mode
    const sites = await this._supabaseApi.listSites();
    const sitesMap = new Map(sites.map((site) => [site.id, site]));
    const incognitoJobsToScan = jobs.filter((job) => sitesMap.get(job.siteId)?.incognito_support);
    const normalJobsToScan = jobs.filter((job) => !sitesMap.get(job.siteId)?.incognito_support);

    const scanJobDescriptions = async ({
      jobsToScan,
      htmlDownloader,
    }: {
      jobsToScan: Job[];
      htmlDownloader: HtmlDownloader;
    }) => {
      const jobChunks = chunk(jobsToScan, 10);
      const updatedJobs = await promiseAllSequence(jobChunks, async (chunkOfJobs) => {
        if (!this._isRunning) return chunkOfJobs; // stop if the scanner is closed

        return Promise.all(
          chunkOfJobs.map(async (job) => {
            try {
              return await htmlDownloader.loadUrl({
                url: job.externalUrl,
                scrollTimes: 1,
                callback: async ({ html, maxRetries, retryCount }) => {
                  this._logger.info(`downloaded html for ${job.title}`, {
                    jobId: job.id,
                  });

                  // stop if the scanner is closed
                  if (!this._isRunning) return job;

                  const { job: updatedJob, parseFailed } = await this._supabaseApi.scanJobDescription({
                    jobId: job.id,
                    html,
                    maxRetries,
                    retryCount,
                  });

                  if (parseFailed) {
                    this._logger.debug(`failed to parse job description: ${job.title}`, {
                      jobId: job.id,
                    });

                    throw new Error(`failed to parse job description for ${job.id}`);
                  }

                  // add a random delay before moving on to the next link
                  // to avoid being rate limited by cloudflare
                  await waitRandomBetween(300, 1000);

                  return updatedJob;
                },
              });
            } catch (error) {
              if (this._isRunning)
                this._logger.error(`failed to scan job description: ${getExceptionMessage(error)}`, {
                  jobId: job.id,
                });

              // intetionally return initial job if there is an error
              // in order to continue scanning the rest of the jobs
              return job;
            }
          }),
        );
      }).then((r) => r.flat());

      return updatedJobs;
    };

    const [scannedNormalJobs, scannedIncognitoJobs] = await Promise.all([
      scanJobDescriptions({
        jobsToScan: normalJobsToScan,
        htmlDownloader: this._normalHtmlDownloader,
      }),
      scanJobDescriptions({
        jobsToScan: incognitoJobsToScan,
        htmlDownloader: this._incognitoHtmlDownloader,
      }),
    ]);

    const allScannedJobs = [...scannedIncognitoJobs, ...scannedNormalJobs];
    const updatedJobs = jobs.map((job) => allScannedJobs.find((j) => j.id === job.id) ?? throwError('job not found')); // preserve the order

    this._logger.info('finished scanning job descriptions');

    return updatedJobs;
  }

  /**
   * Display a notfication for new jobs.
   */
  showNewJobsNotification({ newJobs }: { newJobs: Job[] }) {
    if (newJobs.length === 0) return;

    // Create a new notification
    const maxDisplayedJobs = 3;
    const displatedJobs = newJobs.slice(0, maxDisplayedJobs);
    const otherJobsCount = newJobs.length - maxDisplayedJobs;

    const firstJobsLabel = displatedJobs.map((job: any) => `${job.title} at ${job.companyName}`).join(', ');
    const plural = otherJobsCount > 1 ? 's' : '';
    const otherJobsLabel = otherJobsCount > 0 ? ` and ${otherJobsCount} other${plural}` : '';
    const notification = new Notification({
      title: 'Job Search Update',
      body: `${firstJobsLabel}${otherJobsLabel} ${displatedJobs.length > 1 ? 'are' : 'is'} now available!`,
      // sound: "Submarine",
      silent: !this._settings.useSound,
    });

    // Show the notification
    const notificationId = new Date().getTime().toString();
    this._notificationsMap.set(notificationId, notification);
    notification.on('click', () => {
      this._onNavigate({ path: '/?status=new' });
      this._notificationsMap.delete(notificationId);
      this._analytics.trackEvent('notification_click', {
        jobs_count: newJobs.length,
      });
    });
    notification.show();
    this._analytics.trackEvent('show_notification', {
      jobs_count: newJobs.length,
    });
  }

  /**
   * Update settings.
   */
  updateSettings(settings: JobScannerSettings) {
    this._applySettings(settings);
    this._saveSettings();
    this._analytics.trackEvent('update_settings', settings);
  }

  /**
   * Get the current settings.
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Close the scanner.
   */
  close() {
    // end cron job
    if (this._cronJob) {
      this._logger.info(`stopping cron schedule`);
      this._cronJob.stop();
    }

    // stop power blocker
    if (typeof this._prowerSaveBlockerId === 'number') {
      this._logger.info(`stopping prevent sleep`);
      powerSaveBlocker.stop(this._prowerSaveBlockerId);
    }

    this._isRunning = false;
  }

  /**
   * Scan a link to fetch new jobs.
   */
  async scanLink({ linkId }: { linkId: number }) {
    const link = await this._supabaseApi.listLinks().then((links) => links.find((l) => l.id === linkId));
    if (!link) {
      throw new Error(`link not found: ${linkId}`);
    }

    // scan the link after the debug window is closed
    this.scanLinks({ links: [link] }).catch((error) => {
      this._logger.error(getExceptionMessage(error));
    });
  }

  /**
   * Persist settings to disk.
   */
  private _saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(this._settings));
    this._logger.info(`settings saved to disk`);
  }

  /**
   * Apply a new set of settings into the runtime.
   */
  private _applySettings(settings: JobScannerSettings) {
    if (settings.cronRule !== this._settings.cronRule) {
      // stop old cron job
      if (this._cronJob) {
        this._logger.info(`stopping old cron schedule`);
        this._cronJob.stop();
      }
      // start new cron job if needed
      if (settings.cronRule) {
        this._cronJob = schedule(settings.cronRule, () => this.scanAllLinks());
        this._logger.info(`cron job started successfully ${settings.cronRule}`);
      }
    }

    if (settings.preventSleep !== this._settings.preventSleep) {
      // stop old power blocker
      if (typeof this._prowerSaveBlockerId === 'number') {
        this._logger.info(`stopping old prevent sleep`);
        powerSaveBlocker.stop(this._prowerSaveBlockerId);
      }
      // start new power blocker if needed
      if (settings.preventSleep) {
        this._prowerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension');
        this._logger.info(`prevent sleep started successfully: ${this._prowerSaveBlockerId}`);
      }
    }

    this._settings = settings;
    this._logger.info(`settings applied successfully`);
  }
}
