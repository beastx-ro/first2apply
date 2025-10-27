import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@first2apply/ui";
import { Tabs, TabsList, TabsTrigger } from "@first2apply/ui";
import { Button } from "@first2apply/ui";
import Link from "next/link";

import { QueryParamsLink } from "./queryParamsLink";

const tabs = ["Monthly", "Quarterly", "Biannually", "Yearly"] as const;
const plans = ["Basic", "Pro"] as const;
type Plan = (typeof plans)[number];
type BillingCycle = (typeof tabs)[number];

type PriceDetail = {
  pricePerMonth: number;
  total: number;
  discount: number;
  period: number;
};

type PricingPlan = {
  name: Plan;
  description?: string;
  monthly: PriceDetail;
  quarterly: PriceDetail;
  biannually: PriceDetail;
  yearly: PriceDetail;
  benefits: string[];
};

const stripeConfig: Record<Plan, Record<BillingCycle, string>> = {
  Basic: {
    Monthly: "https://buy.stripe.com/4gw5mv9vadTL5q0cMN",
    Quarterly: "https://buy.stripe.com/4gw6qz36MaHzbOofZ0",
    Biannually: "https://buy.stripe.com/4gw4ir8r63f7bOo3cf",
    Yearly: "https://buy.stripe.com/28oaGP7n24jb9Gg7sw",
  },
  Pro: {
    Monthly: "https://buy.stripe.com/cN25mv36Mg1T9GgaEN",
    Quarterly: "https://buy.stripe.com/4gw4irgXCbLDdWw7sD",
    Biannually: "https://buy.stripe.com/fZe3en22I8zrg4E5kw",
    Yearly: "https://buy.stripe.com/14k3enbDi8zr2dO6oB",
  },
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Basic",
    description: "Cheap as a beer",
    monthly: { pricePerMonth: 5, total: 5, discount: 0, period: 1 },
    quarterly: { pricePerMonth: 3.75, total: 11.25, discount: 0.25, period: 3 },
    biannually: { pricePerMonth: 3.25, total: 19.5, discount: 0.35, period: 6 },
    yearly: { pricePerMonth: 2.5, total: 30, discount: 0.5, period: 12 },
    benefits: ["Unlimited job site monitoring.", "Instant new job alerts.", "Application organization."],
  },
  {
    name: "Pro",
    description: "All you need to get hired",
    monthly: { pricePerMonth: 20, total: 20, discount: 0, period: 1 },
    quarterly: {
      pricePerMonth: 18.75,
      total: 56.25,
      discount: 0.25,
      period: 3,
    },
    biannually: {
      pricePerMonth: 18.25,
      total: 109.5,
      discount: 0.35,
      period: 6,
    },
    yearly: { pricePerMonth: 17.5, total: 210, discount: 0.5, period: 12 },
    benefits: ["Everything the basic plan offers.", "Blacklist companies.", "Advanced filtering using AI."],
  },
];

export function PricingSection() {
  const [selectedTab, setSelectedTab] = useState<BillingCycle>(tabs[0]);

  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 pt-[10vh] sm:px-10 md:pt-[20vh]">
      <h2 className="text-2xl font-semibold sm:text-4xl md:text-center lg:text-5xl">Pricing Plans</h2>
      <p className="mt-1 text-xs tracking-wide md:text-center">7 day trial included (no credit card required)</p>
      <p className="mb-3 mt-[3vh] text-center sm:mt-[5vh]">Billing Period</p>
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
        <div className="mt-[5vh] grid w-full gap-4 sm:mt-[10vh] sm:grid-cols-2 md:gap-10 lg:gap-20">
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
                  {selectedTab !== "Monthly" && (
                    <div className="relative ml-4 inline-block">
                      <span className="text-muted-foreground/30 text-2xl font-semibold md:text-3xl">$</span>
                      <span className="text-muted-foreground/30 text-4xl font-bold md:text-5xl">
                        {plan.monthly.pricePerMonth}
                      </span>
                      <span className="text-muted-foreground/30 text-sm">/month</span>
                      <div className="border-t-1 border-muted-foreground/30 dark:border-muted-foreground/60 absolute top-5 w-full rotate-12 border md:top-7"></div>
                    </div>
                  )}
                </p>
                <p className="text-muted-foreground mt-1 h-6 sm:mt-2">
                  {selectedTab !== "Monthly" && (
                    <>
                      Pay ${(plan[selectedTab.toLowerCase() as keyof PricingPlan] as PriceDetail).total}{" "}
                      {selectedTab.toLowerCase()}
                    </>
                  )}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start md:p-8 md:pt-0">
                <ul>
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircledIcon className="text-primary h-5 w-5" />
                      <span className="md:text-lg">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <QueryParamsLink baseUrl={`${stripeConfig[plan.name][selectedTab]}`} className="self-center">
                  <Button size="lg" className="mt-10 w-40">
                    Select
                  </Button>
                </QueryParamsLink>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Tabs>

      <p className="mt-[5vh] text-balance text-center text-xl font-medium sm:text-2xl">
        You get a 7 DAYS FREE trial. No credit card required.
      </p>

      <Link href="/download" className="flex justify-center">
        <Button size="lg" variant="secondary" className="xs:w-fit mt-6 w-full">
          Download for free
        </Button>
      </Link>
    </section>
  );
}
