import { StripeConfig } from "@/lib/supabase/types";

const devConfig: StripeConfig = {
  customerPortalLink:
    "https://billing.stripe.com/p/login/test_3csbLi9tW6AH48wfYY",
  plans: [
    {
      tier: "basic",
      monthlyCheckoutLink: "https://buy.stripe.com/test_4gwdTQfF44jdf726oo",
      quarterlyCheckoutLink: "https://buy.stripe.com/test_9AQ6ro8cC1712kgdQR",
      biannuallyCheckoutLink: "https://buy.stripe.com/test_dR66ro1Oe4jdbUQ8wy",
      yearlyCheckoutLink: "https://buy.stripe.com/test_5kA8zweB0g1V6AwbIL",
    },
    {
      tier: "pro",
      monthlyCheckoutLink: "https://buy.stripe.com/test_00gdTQ8cCbLF1gcfZ6",
      quarterlyCheckoutLink: "https://buy.stripe.com/test_6oEdTQfF402Xgb6cMV",
      biannuallyCheckoutLink: "https://buy.stripe.com/test_5kA030csS5nh3okdR0",
      yearlyCheckoutLink: "https://buy.stripe.com/test_dR64jgfF402Xf725kv",
    },
  ],
};

const prodConfig: StripeConfig = {
  customerPortalLink: "https://billing.stripe.com/p/login/9AQ01k3mt1h8aaI5kk",
  plans: [
    {
      tier: "basic",
      monthlyCheckoutLink: "https://buy.stripe.com/4gw5mv9vadTL5q0cMN",
      quarterlyCheckoutLink: "https://buy.stripe.com/4gw6qz36MaHzbOofZ0",
      biannuallyCheckoutLink: "https://buy.stripe.com/4gw4ir8r63f7bOo3cf",
      yearlyCheckoutLink: "https://buy.stripe.com/28oaGP7n24jb9Gg7sw",
    },
    {
      tier: "pro",
      monthlyCheckoutLink: "https://buy.stripe.com/cN25mv36Mg1T9GgaEN",
      quarterlyCheckoutLink: "https://buy.stripe.com/4gw4irgXCbLDdWw7sD",
      biannuallyCheckoutLink: "https://buy.stripe.com/fZe3en22I8zrg4E5kw",
      yearlyCheckoutLink: "https://buy.stripe.com/14k3enbDi8zr2dO6oB",
    },
  ],
};

export function getStripeConfig(nodeEnv: string) {
  return nodeEnv === "production" ? prodConfig : devConfig;
}
