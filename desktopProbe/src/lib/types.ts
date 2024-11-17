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
    name: 'Every 4 hours',
    value: '0 */4 * * *',
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
};

export type NewAppVersion = {
  name: string;
  url: string;
  message: string;
};
