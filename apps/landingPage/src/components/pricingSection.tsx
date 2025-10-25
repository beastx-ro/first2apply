import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
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
    benefits: [
      "Unlimited job site monitoring.",
      "Instant new job alerts.",
      "Application organization.",
    ],
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
    benefits: [
      "Everything the basic plan offers.",
      "Blacklist companies.",
      "Advanced filtering using AI.",
    ],
  },
];

export function PricingSection() {
  const [selectedTab, setSelectedTab] = useState<BillingCycle>(tabs[0]);

  return (
    <section
      id="pricing"
      className="max-w-5xl mx-auto px-6 sm:px-10 pt-[10vh] md:pt-[20vh]"
    >
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
        Pricing Plans
      </h2>
      <p className="mt-1 text-xs tracking-wide md:text-center">
        7 day trial included (no credit card required)
      </p>
      <p className="mt-[3vh] sm:mt-[5vh] mb-3 text-center">Billing Period</p>
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
        <div className="mt-[5vh] sm:mt-[10vh] w-full grid sm:grid-cols-2 gap-4 md:gap-10 lg:gap-20">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className="relative overflow-hidden">
              <CardHeader className="md:p-8">
                <CardTitle className="md:text-3xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="md:p-8 md:pt-2">
                <p>
                  <span className="text-2xl md:text-3xl font-semibold">$</span>
                  <span className="text-4xl md:text-5xl font-bold">
                    {
                      (
                        plan[
                          selectedTab.toLowerCase() as keyof PricingPlan
                        ] as PriceDetail
                      ).pricePerMonth
                    }
                  </span>
                  <span className="text-sm"> /month</span>
                  {selectedTab !== "Monthly" && (
                    <div className="ml-4 inline-block relative">
                      <span className="text-2xl md:text-3xl text-muted-foreground/30 font-semibold">
                        $
                      </span>
                      <span className="text-4xl md:text-5xl text-muted-foreground/30 font-bold">
                        {plan.monthly.pricePerMonth}
                      </span>
                      <span className="text-sm text-muted-foreground/30">
                        /month
                      </span>
                      <div className="absolute top-5 md:top-7 w-full border border-t-1 border-muted-foreground/30 dark:border-muted-foreground/60 rotate-12"></div>
                    </div>
                  )}
                </p>
                <p className="mt-1 sm:mt-2 h-6 text-muted-foreground">
                  {selectedTab !== "Monthly" && (
                    <>
                      Pay $
                      {
                        (
                          plan[
                            selectedTab.toLowerCase() as keyof PricingPlan
                          ] as PriceDetail
                        ).total
                      }{" "}
                      {selectedTab.toLowerCase()}
                    </>
                  )}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start md:p-8 md:pt-0">
                <ul>
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircledIcon className="w-5 h-5 text-primary" />
                      <span className="md:text-lg">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <QueryParamsLink
                  baseUrl={`${stripeConfig[plan.name][selectedTab]}`}
                  className="self-center"
                >
                  <Button size="lg" className="mt-10 w-40">
                    Select
                  </Button>
                </QueryParamsLink>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Tabs>

      <p className="mt-[5vh] text-xl sm:text-2xl font-medium text-center text-balance">
        You get a 7 DAYS FREE trial. No credit card required.
      </p>

      <Link href="/download" className="flex justify-center">
        <Button size="lg" variant="secondary" className="w-full xs:w-fit mt-6">
          Download for free
        </Button>
      </Link>
    </section>
  );
}
