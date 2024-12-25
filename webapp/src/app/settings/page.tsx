"use client";

import { CronSchedule } from "@/components/cronSchedule";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/hooks/appState";
import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { useSettings } from "@/hooks/settings";
import { applyAppUpdate, logout, openExternalUrl } from "@/lib/electronMainSdk";
import { JobScannerSettings } from "@/lib/types";
import * as luxon from "luxon";
import Link from "next/link";

export default function SettingsPage() {
  const { handleError } = useError();
  const {
    isLoading: isLoadingSession,
    logout: resetUser,
    user,
    profile,
    stripeConfig,
  } = useSession();

  const isLoading = !profile || !stripeConfig || isLoadingSession;

  // Logout
  const onLogout = async () => {
    try {
      await logout();
      resetUser();
    } catch (error) {
      handleError({ error });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-6 md:p-10">
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="pb-3 text-2xl font-medium tracking-wide">
        Settings ({user?.email})
      </h1>

      {/* cron settings */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Search Frequency</h2>
          <p className="text-sm font-light">
            How often do you want to receive job notifications?
          </p>
        </div>
        <Link href="f2a://settings">Configure in app</Link>
      </div>

      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Prevent computer from entering sleep</h2>
          <p className="text-sm font-light">
            First2Apply needs to run in the background to notify you of new jobs
          </p>
        </div>
        <Link href="f2a://settings">Configure in app</Link>
      </div>

      {/* notification settings */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Enable notification sounds</h2>
          <p className="text-sm font-light">
            Play a sound when a new job is found in order to get your attention
          </p>
        </div>
        <Link href="f2a://settings">Configure in app</Link>
      </div>

      {/* email notifications */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">Email notifications</h2>
          <p className="text-sm font-light">
            Get notified of new jobs even when you are on the go
          </p>
        </div>
        <Link href="f2a://settings">Configure in app</Link>
      </div>

      {/* subscription */}
      <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg">
            {profile.subscription_tier.toUpperCase()} subscription
            {profile.is_trial && " (Trial)"}
          </h2>
          <p className="text-sm font-light">
            Your subscription ends on{" "}
            <span className="underline">
              {luxon.DateTime.fromISO(profile.subscription_end_date).toFormat(
                "dd LLLL yyyy"
              )}
            </span>
            .
            {!profile.is_trial &&
              " You can cancel or upgrade your subscription at any time."}
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
    </div>
  );
}
