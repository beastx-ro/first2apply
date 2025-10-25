import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import { SubscriptionTier } from '../../../../supabase/functions/_shared/types';
import { Button } from './ui/button';

const tabs = ['Monthly', 'Quarterly', 'Biannually', 'Yearly'];

type PriceDetail = {
  pricePerMonth: number;
  total: number;
  discount: number;
  period: number;
};

type PricingPlan = {
  name: string;
  description?: string;
  monthly: PriceDetail;
  quarterly: PriceDetail;
  biannually: PriceDetail;
  yearly: PriceDetail;
  benefits: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    name: 'Basic',
    description: 'Cheap as a beer',
    monthly: { pricePerMonth: 5, total: 5, discount: 0, period: 1 },
    quarterly: { pricePerMonth: 3.75, total: 11.25, discount: 0.25, period: 3 },
    biannually: { pricePerMonth: 3.25, total: 19.5, discount: 0.35, period: 6 },
    yearly: { pricePerMonth: 2.5, total: 30, discount: 0.5, period: 12 },
    benefits: ['Unlimited job site monitoring.', 'Instant new job alerts.', 'Application organization.'],
  },
  {
    name: 'Pro',
    description: 'All you need to get hired',
    monthly: { pricePerMonth: 20, total: 20, discount: 0, period: 1 },
    quarterly: { pricePerMonth: 18.75, total: 56.25, discount: 0.25, period: 3 },
    biannually: { pricePerMonth: 18.25, total: 109.5, discount: 0.35, period: 6 },
    yearly: { pricePerMonth: 17.5, total: 210, discount: 0.5, period: 12 },
    benefits: ['Everything the basic plan offers.', 'Blacklist companies.', 'Advanced filtering using AI.'],
  },
];

export function PricingOptions({
  disableBasic,
  onSelectPlan,
}: {
  disableBasic?: boolean;
  onSelectPlan: (_: { tier: SubscriptionTier; billingCycle: string }) => void;
}) {
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  return (
    <Tabs defaultValue={tabs[0]} className="flex flex-col items-center">
      <TabsList className="w-fit">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            onClick={() => {
              setSelectedTab(tab);
              console.log(tab);
            }}
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-10 grid w-full gap-6 md:gap-10 lg:grid-cols-2">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className="relative overflow-hidden">
            <CardHeader className="md:p-8">
              <CardTitle className="md:text-3xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="md:p-8 md:pt-2">
              <p>
                <span className="text-2xl font-semibold md:text-3xl">$</span>
                <span className="text-4xl font-bold md:text-5xl">
                  {(plan[selectedTab.toLowerCase() as keyof PricingPlan] as PriceDetail).pricePerMonth}
                </span>
                <span className="text-sm"> /month</span>
                {selectedTab !== 'Monthly' && (
                  <div className="relative ml-4 inline-block">
                    <span className="text-2xl font-semibold text-muted-foreground/30 md:text-3xl">$</span>
                    <span className="text-4xl font-bold text-muted-foreground/30 md:text-5xl">
                      {plan.monthly.pricePerMonth}
                    </span>
                    <span className="text-sm text-muted-foreground/30">/month</span>
                    <div className="border-t-1 absolute top-5 w-full rotate-12 border border-muted-foreground/30 dark:border-muted-foreground/60 md:top-7"></div>
                  </div>
                )}
              </p>
              <p className="mt-1 h-6 text-muted-foreground sm:mt-2">
                {selectedTab !== 'Monthly' && (
                  <>
                    Pay ${(plan[selectedTab.toLowerCase() as keyof PricingPlan] as PriceDetail).total}{' '}
                    {selectedTab.toLowerCase()}
                  </>
                )}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col items-start md:p-8 md:pt-0">
              <ul>
                {plan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircledIcon className="h-5 w-5 text-primary" />
                    <span className="md:text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                className="mt-10 w-40 self-center"
                disabled={plan.name === 'Basic' && disableBasic}
                onClick={() =>
                  onSelectPlan({
                    tier: plan.name.toLowerCase() as SubscriptionTier,
                    billingCycle: selectedTab.toLowerCase(),
                  })
                }
              >
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Tabs>
  );
}
