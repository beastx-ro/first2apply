export const AVAILABLE_CRON_RULES = [
  {
    name: 'Every 30 minutes',
    value: '*/30 * * * *',
  },
  {
    name: 'Every hour',
    value: '0 * * * *',
  },
  {
    name: 'Every 2 hours',
    value: '0 */2 * * *',
  },
  {
    name: 'Every 4 hours',
    value: '0 */4 * * *',
  },
  {
    name: 'Every 8 hours',
    value: '0 */8 * * *',
  },
  {
    name: 'Every 12 hours',
    value: '0 */12 * * *',
  },
  {
    name: 'Every day',
    value: '0 0 * * *',
  },
  {
    name: 'Every 3 days',
    value: '0 0 */3 * *',
  },
  {
    name: 'Every week',
    value: '0 0 * * 0',
  },
];
export type CronRule = (typeof AVAILABLE_CRON_RULES)[number];

export type JobScannerSettings = {
  cronRule?: string;
  preventSleep: boolean;
  useSound: boolean;
  areEmailAlertsEnabled: boolean;
  inAppBrowserEnabled: boolean;
};

export type NewAppVersion = {
  name: string;
  url: string;
  message: string;
};

export type OverlayBrowserViewResult = {
  url: string;
  title: string;
  html: string;
};
