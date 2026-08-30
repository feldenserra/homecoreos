export const ENTITLEMENT_ID = "homecoreos_unlimited";

export const SUBSCRIPTION_PLANS = ["monthly", "yearly", "lifetime"] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
};

export const PLAN_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  monthly: "Billed every month. Cancel anytime.",
  yearly: "Billed once a year. Best value for most households.",
  lifetime: "Pay once. Access never expires.",
};

export const ENTITLEMENT_CACHE_TTL_MS = 15 * 60 * 1000;

export function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return (SUBSCRIPTION_PLANS as readonly string[]).includes(value);
}
