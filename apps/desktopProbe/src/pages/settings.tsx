import { CronSchedule } from '@/components/cronSchedule';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAppState } from '@/hooks/appState';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { useSettings } from '@/hooks/settings';
import { applyAppUpdate, logout, openExternalUrl } from '@/lib/electronMainSdk';
import { JobScannerSettings } from '@/lib/types';
import * as luxon from 'luxon';

import { DefaultLayout } from './defaultLayout';

export function SettingsPage() {
  const { handleError } = useError();
  const { isLoading: isLoadingSession, logout: resetUser, user, profile, stripeConfig } = useSession();
  const { isLoading: isLoadingSettings, settings, updateSettings } = useSettings();
  const { newUpdate } = useAppState();

  const isLoading = !profile || !stripeConfig || isLoadingSettings || isLoadingSession;
  const hasNewUpdate = !!newUpdate;

  // Update settings
  const onUpdatedSettings = async (newSettings: JobScannerSettings) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      handleError({ error });
    }
  };

  // Logout
  const onLogout = async () => {
    try {
      await logout();
      resetUser();
    } catch (error) {
      handleError({ error });
    }
  };

  // Update cron rule
  const onCronRuleChange = async (cronRule: string | undefined) => {
    try {
      const newSettings = { ...settings, cronRule };
      await updateSettings(newSettings);
    } catch (error) {
      handleError({ error, title: 'Failed to update notification frequency' });
    }
  };

  const onApplyUpdate = async () => {
    try {
      await applyAppUpdate();
    } catch (error) {
      handleError({ error });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="space-y-3 p-6 md:p-10">
        <SettingsSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="space-y-3 p-6 md:p-10">
      <h1 className="pb-3 text-2xl font-medium tracking-wide">Settings ({user.email})</h1>

      {/* new updates */}
      {hasNewUpdate && (
        <div className="border-destructive flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
          <div className="space-y-1">
            <h2 className="text-lg">
              New update available <span className="font-bold">{newUpdate.name}</span>
            </h2>
            <p className="text-sm font-light">{newUpdate.message}</p>
          </div>
          {!profile.is_trial && (
            <Button className="w-fit" onClick={() => onApplyUpdate()}>
              Update
            </Button>
          )}
        </div>
      )}

      {/* cron settings */}
      <CronSchedule cronRule={settings.cronRule} onCronRuleChange={onCronRuleChange} />

      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Prevent computer from entering sleep</h2>
          <p className="text-sm font-light">First2Apply needs to run in the background to notify you of new jobs</p>
        </div>
        <Switch
          checked={settings.preventSleep}
          onCheckedChange={(checked) => onUpdatedSettings({ ...settings, preventSleep: checked })}
        />
      </div>

      {/* notification settings */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Enable notification sounds</h2>
          <p className="text-sm font-light">Play a sound when a new job is found in order to get your attention</p>
        </div>
        <Switch
          checked={settings.useSound}
          onCheckedChange={(checked) => onUpdatedSettings({ ...settings, useSound: checked })}
        />
      </div>

      {/* email notifications */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Email notifications</h2>
          <p className="text-sm font-light">Get notified of new jobs even when you are on the go</p>
        </div>
        <Switch
          checked={settings.areEmailAlertsEnabled}
          onCheckedChange={(checked) => onUpdatedSettings({ ...settings, areEmailAlertsEnabled: checked })}
        />
      </div>

      {/* subscription */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">
            {profile.subscription_tier.toUpperCase()} subscription
            {profile.is_trial && ' (Trial)'}
          </h2>
          <p className="text-sm font-light">
            Your subscription ends on{' '}
            <span className="underline">
              {luxon.DateTime.fromISO(profile.subscription_end_date).toFormat('dd LLLL yyyy')}
            </span>
            .{!profile.is_trial && ' You can cancel or upgrade your subscription at any time.'}
          </p>
        </div>
        {!profile.is_trial && (
          <Button
            className="w-fit"
            variant="secondary"
            onClick={() => openExternalUrl(stripeConfig.customerPortalLink)}
          >
            Manage Subscription
          </Button>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button className="w-fit" variant="destructive" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </DefaultLayout>
  );
}
