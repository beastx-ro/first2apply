import { PricingOptions } from '@/components/pricingOptions';
import { FiltersSkeleton } from '@/components/skeletons/filtersSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@first2apply/ui';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@first2apply/ui';
import { Badge } from '@first2apply/ui';
import { Button } from '@first2apply/ui';
import { Input } from '@first2apply/ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@first2apply/ui';
import { useToast } from '@first2apply/ui';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { getAdvancedMatchingConfig, openExternalUrl, updateAdvancedMatchingConfig } from '@/lib/electronMainSdk';
import { StripeBillingPlan, SubscriptionTier } from '@first2apply/core';
import { Cross2Icon, InfoCircledIcon, MinusCircledIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { DefaultLayout } from './defaultLayout';

export function FiltersPage() {
  const { handleError } = useError();
  const { toast } = useToast();
  const { profile, stripeConfig, refreshProfile } = useSession();

  const [userAiInput, setUserAiInput] = useState<string>('');
  const [blacklistedCompanies, setBlacklistedCompanies] = useState<string[]>([]);
  const [addBlacklistedCompany, setAddBlacklistedCompany] = useState<string>('');
  const [isSubscriptionDialogOpen, setSubscriptionDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAllBlacklistedCompanies, setShowAllBlacklistedCompanies] = useState(false);

  /**
   * Load the advanced matching filters from the user's profile.
   */
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const config = await getAdvancedMatchingConfig();
        if (config) {
          setUserAiInput(config.chatgpt_prompt);
          setBlacklistedCompanies(config.blacklisted_companies);
        }
      } catch (error) {
        handleError({ error, title: 'Failed to load advanced matching filters' });
      } finally {
        setIsLoading(false);
      }
    };
    asyncLoad();
  }, []);

  /**
   * Save the config to the database.
   */
  const onSave = async () => {
    try {
      const updatedConfig = await updateAdvancedMatchingConfig({
        chatgpt_prompt: userAiInput,
        blacklisted_companies: blacklistedCompanies,
      });
      setUserAiInput(updatedConfig.chatgpt_prompt);
      setBlacklistedCompanies(updatedConfig.blacklisted_companies);

      // if the user is not on the PRO plan, show the subscription dialog
      if (profile.subscription_tier !== 'pro') {
        setSubscriptionDialogOpen(true);
        return;
      } else {
        toast({ title: 'Advanced matching filters saved' });
      }
    } catch (error) {
      handleError({ error, title: 'Failed to save advanced matching filters' });
    }
  };

  /**
   * Handle plan selection from a trial customer.
   */
  const onSelectPlan = async ({ tier, billingCycle }: { tier: SubscriptionTier; billingCycle: string }) => {
    try {
      if (!profile.is_trial) {
        await openExternalUrl(stripeConfig.customerPortalLink);
      } else {
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

        await openExternalUrl(checkoutLink);
      }
    } catch (error) {
      handleError({ error, title: 'Failed to upgrade to PRO plan' });
    }
  };

  const onCloseSubscriptionDialog = async () => {
    try {
      await refreshProfile();
      setSubscriptionDialogOpen(false);
    } catch (error) {
      handleError({ error, title: 'Failed to close subscription dialog' });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="flex flex-col p-6 md:p-10">
        <FiltersSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="flex flex-col space-y-16 p-6 md:p-10">
      <h1 className="w-fit text-2xl font-medium tracking-wide">Advanced Matching</h1>

      <section>
        <p className="mb-4 text-lg">
          Set your preferences and let <span className="font-medium">AI</span> find the{' '}
          <span className="font-medium">right jobs</span> for you. Just tell us what you’re looking for:
        </p>

        <div className="relative">
          <TextareaAutosize
            value={userAiInput}
            placeholder='E.g. "Avoid Java or senior roles", "Seeking $60K+ salary, remote opportunities", "Suitable for under 2 years of experience"'
            autoFocus={true}
            onChange={(evt) => setUserAiInput(evt.target.value)}
            minRows={3}
            maxLength={5000}
            className="border-border bg-card ring-ring placeholder:text-muted-foreground w-full resize-none rounded-md border px-6 py-4 text-base focus:outline-none focus:ring-2"
          />
          <span className="text-muted-foreground absolute bottom-4 right-4 text-sm">{userAiInput.length}/5000</span>
        </div>

        <Alert className="flex items-center gap-2 border-0 p-0">
          <AlertTitle className="mb-0">
            <InfoCircledIcon className="text-muted-foreground h-4 w-4" />
          </AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            Pro Tips: Exclude skills you don’t want, specify salary expectations, define experience levels, select job
            specifics like remote work or PTO preferences and more.
          </AlertDescription>
        </Alert>
      </section>

      {/* HERE STARTS THE BLACKLISTING */}

      <section>
        <p className="mb-4 text-lg">
          <span className="font-medium">Blacklist companies</span> you don’t want to work for. We’ll make sure you{' '}
          <span className="font-medium">don’t see jobs</span> from them anymore:
        </p>

        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input
              value={addBlacklistedCompany}
              placeholder="E.g. Luxoft"
              onChange={(evt) => setAddBlacklistedCompany(evt.target.value)}
              maxLength={100}
              className="bg-card ring-ring px-6 pr-20 text-base placeholder:text-base focus-visible:ring-2"
            />
            <span className="text-muted-foreground absolute bottom-2 right-4 text-sm">
              {addBlacklistedCompany.length}/100
            </span>
          </div>

          <Button
            variant="secondary"
            className="border-border w-36 border"
            onClick={() => {
              if (addBlacklistedCompany) {
                setBlacklistedCompanies([...blacklistedCompanies, addBlacklistedCompany]);
                setAddBlacklistedCompany('');
              }
            }}
          >
            Add company
          </Button>
        </div>

        <Alert className="mt-1.5 flex items-center gap-2 border-0 p-0">
          <AlertTitle className="mb-0">
            <MinusCircledIcon className="text-destructive/90 h-4 w-4" />
          </AlertTitle>
          <AlertDescription className="text-destructive/90 text-sm">
            Attention: Ensure you input the company name accurately without any typos.
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          {blacklistedCompanies.length === 0 ? (
            <p>You haven't blacklisted any companies yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(showAllBlacklistedCompanies ? blacklistedCompanies : blacklistedCompanies.slice(0, 10)).map(
                (company) => (
                  <Badge
                    key={company}
                    className="border-border bg-card hover:bg-card flex items-center gap-2 border py-1 pl-4 pr-2 text-base"
                  >
                    {company}
                    <TooltipProvider delayDuration={500}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Cross2Icon
                            className="text-foreground h-4 w-4"
                            onClick={() => setBlacklistedCompanies(blacklistedCompanies.filter((c) => c !== company))}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="mt-2 text-sm">
                          Remove
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                ),
              )}
              {blacklistedCompanies.length > 10 && !showAllBlacklistedCompanies && (
                <Button variant="secondary" className="py-2" onClick={() => setShowAllBlacklistedCompanies(true)}>
                  See All
                </Button>
              )}
              {showAllBlacklistedCompanies && (
                <Button variant="secondary" className="py-2" onClick={() => setShowAllBlacklistedCompanies(false)}>
                  Show Less
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Button className="ml-auto w-36" onClick={onSave}>
        Save filters
      </Button>

      <SubscriptionDialog
        isOpen={isSubscriptionDialogOpen}
        onCancel={() => onCloseSubscriptionDialog()}
        onSelectPlan={onSelectPlan}
      />
    </DefaultLayout>
  );
}

function SubscriptionDialog({
  isOpen,
  onCancel,
  onSelectPlan,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onSelectPlan: (_: { tier: SubscriptionTier; billingCycle: string }) => Promise<void>;
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent className="max-h-screen max-w-[80%] overflow-y-scroll">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-5 text-center text-2xl">
            Advanced matching is only available with a <b>PRO</b> plan
            <Cross2Icon className="absolute right-4 top-4 h-6 w-6 cursor-pointer" onClick={onCancel} />
          </AlertDialogTitle>
          <AlertDialogDescription className="">
            <PricingOptions onSelectPlan={onSelectPlan} disableBasic={true}></PricingOptions>
          </AlertDialogDescription>
          <AlertDialogDescription className="flex items-center"></AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
