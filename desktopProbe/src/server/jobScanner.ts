import { IAnalyticsClient } from '@/lib/analytics';
import { BrowserWindow, Notification, app, powerSaveBlocker } from 'electron';
import fs from 'fs';
import { ScheduledTask, schedule } from 'node-cron';
import path from 'path';

import { Job, Link } from '../../../supabase/functions/_shared/types';
import { getExceptionMessage } from '../lib/error';
import { AVAILABLE_CRON_RULES, JobScannerSettings } from '../lib/types';
import { chunk, promiseAllSequence } from './helpers';
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

  constructor(
    private _logger: ILogger,
    private _supabaseApi: F2aSupabaseApi,
    private _htmlDownloader: HtmlDownloader,
    private _onNavigate: (_: { path: string }) => void,
    private _analytics: IAnalyticsClient,
  ) {
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
    // fetch all links from the database
    const links = (await this._supabaseApi.listLinks()) ?? [];
    this._logger.info(`found ${links?.length} links`);

    // start the scan
    return this.scanLinks({ links });
  }

  /**
   * Perform a scan of a list links.
   */
  async scanLinks({ links }: { links: Link[] }) {
    try {
      this._runningScansCount++;
      this._logger.info('scanning links...');
      this._analytics.trackEvent('scan_links_start', {
        links_count: links.length,
      });

      await Promise.all(
        links.map(async (link) => {
          const newJobs = await this._htmlDownloader
            .loadUrl({
              url: link.url,
              scrollTimes: 5,
              callback: async ({ html, maxRetries, retryCount }) => {
                if (!this._isRunning) return []; // stop if the scanner is closed

                // add a random delay before moving on to the next link
                // to avoid being rate limited by cloudflare
                await waitRandomBetween(300, 2000);

                const { newJobs, parseFailed } = await this._supabaseApi.scanHtmls([
                  { linkId: link.id, content: html, maxRetries, retryCount },
                ]);

                if (parseFailed) {
                  this._logger.debug(`failed to parse html for link ${link.title}`, {
                    linkId: link.id,
                  });

                  throw new Error(`failed to parse html for link ${link.id}`);
                }

                return newJobs;
              },
            })
            .catch((error): Job[] => {
              const errorMessage = getExceptionMessage(error);
              if (this._isRunning)
                this._logger.error(`failed to scan link: ${errorMessage}`, {
                  linkId: link.id,
                });

              // intetionally return an empty array if there is an error
              // in order to continue scanning the rest of the links
              return [];
            });

          return newJobs;
        }),
      ).then((r) => r.flat());
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
        .runPostScanHook({ newJobIds, areEmailAlertsEnabled: this._settings.areEmailAlertsEnabled })
        .catch((error) => {
          this._logger.error(`failed to run post scan hook: ${getExceptionMessage(error)}`);
        });

      // fire a notification if there are new jobs
      if (!this._isRunning) return;
      this.showNewJobsNotification({ newJobs });

      this._logger.info('scan complete');
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

    const jobChunks = chunk(jobs, 10);
    const updatedJobs = await promiseAllSequence(jobChunks, async (chunkOfJobs) => {
      if (!this._isRunning) return chunkOfJobs; // stop if the scanner is closed

      // add a random delay before moving on to the next link
      // to avoid being rate limited by cloudflare
      await waitRandomBetween(300, 1000);

      return Promise.all(
        chunkOfJobs.map(async (job) => {
          try {
            return await this._htmlDownloader.loadUrl({
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
   * Start a debug window for a link.
   */
  async startDebugWindow({ linkId }: { linkId: number }) {
    const link = await this._supabaseApi.listLinks().then((links) => links.find((l) => l.id === linkId));
    if (!link) {
      throw new Error(`link not found: ${linkId}`);
    }

    const debugWindow = new ScannerDebugWindow(this._logger, () => {
      // scan the link after the debug window is closed
      this.scanLinks({ links: [link] }).catch((error) => {
        this._logger.error(getExceptionMessage(error));
      });
    });

    await debugWindow.loadUrl(link.url);
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

/**
 * Class used to open a debug window for manual user intervention to a link.
 */
class ScannerDebugWindow {
  private _window: BrowserWindow | undefined;

  /**
   * Class constructor.
   */
  constructor(
    private _logger: ILogger,
    private _onClose: () => void = () => {},
  ) {
    this._window = new BrowserWindow({
      show: true,
      width: 1600,
      height: 1200,
      webPreferences: {
        webSecurity: false,
        partition: `persist:scraper`,
      },
    });

    // destroy the window when closed
    this._window.on('close', (event) => {
      this._logger.info('debug window closed');
      this._window = undefined;
      this._onClose();
    });
  }

  /**
   * Load a url into the debug window.
   */
  loadUrl(url: string) {
    this._window?.loadURL(url);
  }
}

// method used to wait a random amount of time between a min and max value
const waitRandomBetween = (min: number, max: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));
