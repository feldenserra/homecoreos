"use client";

import { Radio, Stack, Text } from "@mantine/core";
import {
  PLAN_DESCRIPTIONS,
  PLAN_LABELS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "../../lib/revenuecat/constants";

export function PlanRadios({
  name = "plan",
  defaultValue = "yearly",
  value,
  onChange,
}: {
  name?: string;
  defaultValue?: SubscriptionPlan;
  value?: SubscriptionPlan;
  onChange?: (plan: SubscriptionPlan) => void;
}) {
  return (
    <Radio.Group
      name={name}
      label="Subscription"
      description="Choose how you want to pay."
      required
      {...(value !== undefined
        ? {
            value,
            onChange: (next: string) => onChange?.(next as SubscriptionPlan),
          }
        : {
            defaultValue,
            onChange: onChange
              ? (next: string) => onChange(next as SubscriptionPlan)
              : undefined,
          })}
    >
      <Stack gap="xs" mt="xs">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Radio
            key={plan}
            value={plan}
            label={
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {PLAN_LABELS[plan]}
                </Text>
                <Text size="xs" c="dimmed">
                  {PLAN_DESCRIPTIONS[plan]}
                </Text>
              </Stack>
            }
          />
        ))}
      </Stack>
    </Radio.Group>
  );
}
