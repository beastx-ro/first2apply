import { ENV } from '../env';

import { IAnalyticsClient } from '@/lib/analytics';
import * as amplitude from '@amplitude/analytics-node';
import { createHash } from 'crypto';
import { app } from 'electron';

const userDataPath = app.getPath('userData');
const deviceId = createHash('sha256').update(userDataPath).digest('hex');

export class AmplitudeAnalyticsClient implements IAnalyticsClient {
  private _isInitialized = false;
  private _userId: string | undefined;
  private _appVersion = app.getVersion();

  /**
   * Class constructor.
   */
  constructor() {
    if (ENV.amplitudeApiKey) {
      amplitude.init(ENV.amplitudeApiKey, {
        flushIntervalMillis: 10000,
      });
      this._isInitialized = true;
    }
  }

  public setUserId(userId: string) {
    this._userId = userId;
  }

  public trackEvent(event: string, properties?: Record<string, any>) {
    if (!this._isInitialized) return;

    amplitude.track(
      event,
      {
        arch: process.arch,
        ...properties,
      },
      {
        user_id: this._userId,
        app_version: this._appVersion,
        platform: process.platform,
        device_id: deviceId,
      },
    );
  }

  public flush() {
    if (!this._isInitialized) return;

    amplitude.flush();
  }
}
