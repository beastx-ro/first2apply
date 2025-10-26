import { IAnalyticsClient } from '@/lib/analytics';
import { NewAppVersion } from '@/lib/types';
import { getExceptionMessage } from '@first2apply/core';
import { Notification, app, autoUpdater, shell } from 'electron';
import { ScheduledTask, schedule } from 'node-cron';
import * as semver from 'semver';

import { ILogger } from './logger';

const S3_BUCKET = 'https://s3.eu-central-1.amazonaws.com/first2apply.com/releases';

type ReleaseJson = {
  currentRelease: string;
  releases: {
    version: string;
    updateTo: {
      name: string;
      version: string;
      pub_date: string;
      url: string;
      notes: string;
    };
  }[];
};

type LatestRelease = {
  name: string;
  url: string;
};

/**
 * Class used to handle the auto-updates. For now only supported on MacOS since Windows updates
 * are handled by the Microsoft Store.
 */
export class F2aAutoUpdater {
  private _canAutoUpdate = false;
  private _cronJob: ScheduledTask | undefined;
  private _notification: Notification | undefined;
  private _feedUrl: string;
  private _latestRelease: LatestRelease | undefined;

  /**
   * Class constructor.
   */
  constructor(
    private _logger: ILogger,
    private _onQuit: () => Promise<void>,
    private _analytics: IAnalyticsClient,
  ) {
    // only enable auto-updates in packaged apps
    this._canAutoUpdate = app.isPackaged;
    this._feedUrl = `${S3_BUCKET}/${process.platform}/${process.arch}/RELEASES.json`;
  }

  /**
   * Start checking for updates.
   */
  start() {
    if (!this._canAutoUpdate) return;

    autoUpdater.setFeedURL({ url: this._feedUrl, serverType: 'json' });

    // setup auto updater events
    autoUpdater.on('error', (error) => {
      console.error('Error fetching updates', getExceptionMessage(error));
    });
    autoUpdater.on('checking-for-update', () => {
      this._logger.info('Checking for updates ...');
    });
    autoUpdater.on('update-available', () => {
      this._logger.info('Update available, downloading in background ...');
    });
    autoUpdater.on('update-not-available', () => {
      this._logger.info('No updates available');
    });

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
      this._showUpdateNotification({ releaseName, updateURL });
    });

    this._logger.info('auto updater started');

    // check for updates every hour
    this._cronJob = schedule('0 * * * *', () => {
      this._checkForUpdates();
    });

    // check for updates on startup
    process.nextTick(() => {
      this._checkForUpdates();
    });
  }

  /**
   * Stop checking for updates.
   */
  stop() {
    this._cronJob?.stop();
  }

  /**
   * Check if there is a cached update available.
   */
  getNewUpdate(): NewAppVersion | undefined {
    if (!this._latestRelease) return;

    return {
      name: this._latestRelease.name,
      url: this._latestRelease.url,
      message: this._getUpdateNotificationMessage(),
    };
  }

  /**
   * Apply the update.
   */
  async applyUpdate() {
    if (!this._latestRelease) return;

    try {
      process.platform === 'darwin'
        ? this._logger.info('restarting to apply update ...')
        : this._logger.info('opening download url ...');
      this._analytics.trackEvent('apply_update', {
        release_name: this._latestRelease.name,
      });

      // on linux/win32 we can't apply the update automatically, so just open the download page
      // and let the user install it manually
      if (process.platform !== 'darwin') {
        shell.openExternal(this._latestRelease.url);
        return;
      }

      await this._onQuit();
      autoUpdater.quitAndInstall();
    } catch (error) {
      this._logger.error(getExceptionMessage(error));
    }
  }

  /**
   * Show a notification for new updates.
   */
  private _showUpdateNotification({ releaseName, updateURL }: { releaseName: string; updateURL: string }) {
    // cache the release info for further checks
    this._latestRelease = { name: releaseName, url: updateURL };

    // show a notification
    const message = this._getUpdateNotificationMessage();
    const actions: Electron.NotificationAction[] | undefined =
      process.platform === 'darwin' ? [{ text: 'Restart Now', type: 'button' }] : undefined;
    this._notification = new Notification({
      title: releaseName,
      body: message,
      actions,
    });
    this._notification.show();
    this._analytics.trackEvent('show_update_notification', {
      release_name: releaseName,
    });

    this._notification.on('action', () => this.applyUpdate());
    this._notification.on('click', () => this.applyUpdate());
  }

  /**
   * Check for updates. The auto-updater only emits the `update-downloaded` once, so we are caching
   * the latest release info and showing the notification manually with the next cron job.
   */
  private async _checkForUpdates() {
    try {
      // check cached release info
      if (this._latestRelease) {
        this._showUpdateNotification({
          releaseName: this._latestRelease.name,
          updateURL: this._latestRelease.url,
        });
        return;
      }

      if (process.platform === 'darwin') {
        autoUpdater.checkForUpdates();
      } else {
        // manually check for updates on other platforms
        await this._checkForUpdatesManually();
      }
    } catch (error) {
      this._logger.error(`Error checking for updates: ${getExceptionMessage(error)}`);
    }
  }

  /**
   * Manually check for updates in the feed JSON.
   */
  private async _checkForUpdatesManually() {
    // download the feed JSON and check for updates
    this._logger.info('checking for updates manually ...');
    const releasesJson: ReleaseJson = await fetch(this._feedUrl).then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Failed to fetch updates');
    });
    this._logger.info('release json downloaded');

    // check if the current version is the latest
    const currentVersion = app.getVersion();
    const latestVersion = releasesJson.currentRelease;
    if (semver.gt(latestVersion, currentVersion)) {
      this._logger.info(`new version available: ${latestVersion}`);

      // find the release metadata the latest version
      const release = releasesJson.releases.find((release) => release.version === latestVersion);
      if (!release) {
        throw new Error(`Release metadata not found for version ${latestVersion}`);
      }

      // show the update notification
      this._showUpdateNotification({
        releaseName: release.updateTo.name,
        updateURL: release.updateTo.url,
      });
    } else {
      this._logger.info('no updates available');
    }
  }

  /**
   * Get an update notification message.
   */
  private _getUpdateNotificationMessage() {
    const message =
      process.platform === 'darwin'
        ? 'A new version has been downloaded. Restart the application to apply the updates.'
        : 'A new version is available. You can now download and install it.';

    return message;
  }
}
