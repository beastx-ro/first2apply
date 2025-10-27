import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PricingOptions } from '@/components/pricingOptions';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { openExternalUrl } from '@/lib/electronMainSdk';
import { StripeBillingPlan, SubscriptionTier } from '@first2apply/core';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@first2apply/ui';
import urljoin from 'url-join';

export function SubscriptionPage() {
  const { handleError } = useError();
  const {
    isLoading: isLoadingSession,
    profile,
    isSubscriptionExpired,
    stripeConfig,
    refreshProfile,
    user,
  } = useSession();
  const navigate = useNavigate();
  const isLoading = isLoadingSession || !profile || !stripeConfig;

  /**
   * Refresh the user profile every 5 seconds to check for subscription changes.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshProfile]);

  /**
   * Go to home page after successful subscription.
   */
  useEffect(() => {
    if (!isSubscriptionExpired) {
      navigate('/');
    }
  }, [profile, navigate]);

  /**
   * Open the checkout page for the selected plan.
   */
  const handleSelectPlan = ({ tier, billingCycle }: { tier: SubscriptionTier; billingCycle: string }) => {
    try {
      const stripePlan = stripeConfig.plans.find((p) => p.tier === tier);

      if (!stripePlan) {
        console.error(`Stripe plan not found for ${tier}`);
        return;
      }

      const checkoutLink = stripePlan[`${billingCycle}CheckoutLink` as keyof StripeBillingPlan];

      if (!checkoutLink) {
        console.error(`Checkout link not found for ${billingCycle}`);
        return;
      }

      // add the user email as a query parameter
      const url = urljoin(checkoutLink, `?prefilled_email=${user.email}`);

      openExternalUrl(url);
    } catch (error) {
      handleError({ error, title: 'Failed to open checkout page' });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center p-6 md:p-10">
      {profile.is_trial ? (
        <>
          <h1 className="text-2xl font-semibold sm:text-4xl md:text-center lg:text-5xl">Your 7 days trial has ended</h1>
          <p className="mt-1 text-sm tracking-wide md:text-center">pick a plan to continue</p>
          <p className="mt-1 text-sm tracking-wide md:text-center">use {user.email} email when ordering </p>
          <p className="mb-3 mt-[3vh] text-center sm:mt-[5vh]">Billing Period</p>

          <PricingOptions onSelectPlan={handleSelectPlan} />
        </>
      ) : (
        <>
          <Card className="mt-5">
            <CardHeader className="md:p-8">
              <CardTitle className="md:text-3xl">
                Your {profile.subscription_tier.toUpperCase()} plan has ended
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent className="md:p-8 md:pt-2">
              <p>We hope you landed your dream job with First 2 Apply.</p>
              <p className="mb-8">
                Just in case you still need to use the app, you can renew your plan or switch to a different one.
              </p>
              <PricingOptions onSelectPlan={handleSelectPlan} />
            </CardContent>
            {/* CTA */}
            <CardFooter className="flex flex-col items-center justify-center md:p-8 md:pt-0">
              <p className="mt-1 text-sm tracking-wide">
                use your {user.email} email when logging into the Stripe user portal
              </p>
            </CardFooter>
          </Card>
        </>
      )}
    </main>
  );
}
