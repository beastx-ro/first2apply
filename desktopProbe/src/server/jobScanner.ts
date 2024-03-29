import path from "path";
import fs from "fs";

import { Notification, app, powerSaveBlocker } from "electron";
import { ScheduledTask, schedule } from "node-cron";
import { AVAILABLE_CRON_RULES, JobScannerSettings } from "../lib/types";
import { F2aSupabaseApi } from "./supabaseApi";
import { getExceptionMessage } from "../lib/error";
import { Job, Link } from "../../../supabase/functions/_shared/types";
import { chunk, promiseAllSequence } from "./helpers";
import { HtmlDownloader } from "./htmlDownloader";
import { IAnalyticsClient } from "@/lib/analytics";
import { ILogger } from "./logger";

const userDataPath = app.getPath("userData");
const settingsPath = path.join(userDataPath, "settings.json");

const DEFAULT_SETTINGS: JobScannerSettings = {
  cronRule: AVAILABLE_CRON_RULES[0].value,
  preventSleep: true,
  useSound: true,
};

/**
 * Class used to manage a cron job that periodically scans links.
 */
export class JobScanner {
  private _isRunning = true;
  private _settings: JobScannerSettings = {
    preventSleep: false,
    useSound: false,
  };
  private _cronJob: ScheduledTask | undefined;
  private _prowerSaveBlockerId: number | undefined;
  private _notificationsMap: Map<string, Notification> = new Map();

  constructor(
    private _logger: ILogger,
    private _supabaseApi: F2aSupabaseApi,
    private _htmlDownloader: HtmlDownloader,
    private _onNavigate: (_: { path: string }) => void,
    private _analytics: IAnalyticsClient
  ) {
    // used for testing
    // fs.unlinkSync(settingsPath);

    // load the setings from disk
    let settingsToApply = this._settings;
    if (fs.existsSync(settingsPath)) {
      settingsToApply = {
        ...this._settings,
        ...JSON.parse(fs.readFileSync(settingsPath, "utf-8")),
      };
      this._logger.info(
        `loadied settings from disk: ${JSON.stringify(settingsToApply)}`
      );
    } else {
      this._logger.info(`no settings found on disk, using defaults`);
      settingsToApply = DEFAULT_SETTINGS;
    }

    this._applySettings(settingsToApply);
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
      this._logger.info("scanning links...");
      this._analytics.trackEvent("scan_links_start", {
        links_count: links.length,
      });

      const newJobs = await Promise.all(
        links.map(async (link) => {
          const html = await this._htmlDownloader
            .loadUrl(link.url, 5)
            .catch((error) => {
              const errorMessage = getExceptionMessage(error);
              this._logger.error(`failed to download html: ${errorMessage}`, {
                linkId: link.id,
              });
              return `<html><body class="f2a-error">${errorMessage}<body><html>`;
            });

          if (!this._isRunning) return []; // stop if the scanner is closed

          const { newJobs } = await this._supabaseApi
            .scanHtmls([{ linkId: link.id, content: html }])
            .catch((error) => {
              // intetionally return an empty array if there is an error
              // in order to continue scanning the rest of the links
              this._logger.error(
                `failed to scan html: ${getExceptionMessage(error)}`,
                {
                  linkId: link.id,
                }
              );
              return { newJobs: [] };
            });

          return newJobs;
        })
      ).then((r) => r.flat());
      this._logger.info(`downloaded html for ${links.length} links`);

      // scan job descriptions
      if (!this._isRunning) return;
      await this.scanJobs(newJobs.reverse()); // reverse to scan the newest jobs first

      // fire a notification if there are new jobs
      if (!this._isRunning) return;
      this.showNewJobsNotification({ newJobs });

      this._logger.info("scan complete");
      this._analytics.trackEvent("scan_links_complete", {
        links_count: links.length,
        new_jobs_count: newJobs.length,
      });
    } catch (error) {
      this._logger.error(getExceptionMessage(error));
    }
  }

  /**
   * Scan a list of new jobs to extract the description.
   */
  async scanJobs(jobs: Job[]): Promise<Job[]> {
    this._logger.info(`scanning ${jobs.length} jobs descriptions...`);

    const jobChunks = chunk(jobs, 10);
    const updatedJobs = await promiseAllSequence(
      jobChunks,
      async (chunkOfJobs) => {
        if (!this._isRunning) return chunkOfJobs; // stop if the scanner is closed

        return Promise.all(
          chunkOfJobs.map(async (job) => {
            try {
              const html = await this._htmlDownloader.loadUrl(
                job.externalUrl,
                1
              );
              this._logger.info(`downloaded html for ${job.title}`, {
                jobId: job.id,
              });

              // stop if the scanner is closed
              if (!this._isRunning) return job;

              const { job: updatedJob } =
                await this._supabaseApi.scanJobDescription({
                  jobId: job.id,
                  html,
                });

              return updatedJob;
            } catch (error) {
              // intetionally return initial job if there is an error
              // in order to continue scanning the rest of the jobs
              this._logger.error(getExceptionMessage(error), {
                jobId: job.id,
              });
              return job;
            }
          })
        );
      }
    ).then((r) => r.flat());

    this._logger.info("finished scanning job descriptions");

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

    const firstJobsLabel = displatedJobs
      .map((job: any) => `${job.title} at ${job.companyName}`)
      .join(", ");
    const plural = otherJobsCount > 1 ? "s" : "";
    const otherJobsLabel =
      otherJobsCount > 0 ? ` and ${otherJobsCount} other${plural}` : "";
    const notification = new Notification({
      title: "Job Search Update",
      body: `${firstJobsLabel}${otherJobsLabel} ${
        displatedJobs.length > 1 ? "are" : "is"
      } now available!`,
      // sound: "Submarine",
      silent: !this._settings.useSound,
    });

    // Show the notification
    const notificationId = new Date().getTime().toString();
    this._notificationsMap.set(notificationId, notification);
    notification.on("click", () => {
      this._onNavigate({ path: "/?status=new" });
      this._notificationsMap.delete(notificationId);
      this._analytics.trackEvent("notification_click", {
        jobs_count: newJobs.length,
      });
    });
    notification.show();
    this._analytics.trackEvent("show_notification", {
      jobs_count: newJobs.length,
    });
  }

  /**
   * Update settings.
   */
  updateSettings(settings: JobScannerSettings) {
    this._applySettings(settings);
    this._saveSettings();
    this._analytics.trackEvent("update_settings", settings);
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
    if (typeof this._prowerSaveBlockerId === "number") {
      this._logger.info(`stopping prevent sleep`);
      powerSaveBlocker.stop(this._prowerSaveBlockerId);
    }

    this._isRunning = false;
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
        this._logger.info(`cron job started successfully`);
      }
    }

    if (settings.preventSleep !== this._settings.preventSleep) {
      // stop old power blocker
      if (typeof this._prowerSaveBlockerId === "number") {
        this._logger.info(`stopping old prevent sleep`);
        powerSaveBlocker.stop(this._prowerSaveBlockerId);
      }
      // start new power blocker if needed
      if (settings.preventSleep) {
        this._prowerSaveBlockerId = powerSaveBlocker.start(
          "prevent-app-suspension"
        );
        this._logger.info(
          `prevent sleep started successfully: ${this._prowerSaveBlockerId}`
        );
      }
    }

    this._settings = settings;
    this._logger.info(`settings applied successfully`);
  }
}
