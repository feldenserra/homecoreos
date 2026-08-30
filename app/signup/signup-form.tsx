"use client";

import { useState } from "react";
import {
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { PlanRadios } from "../../components/billing/plan-radios";
import type { SubscriptionPlan } from "../../lib/revenuecat/constants";
import { registerWithPlan } from "./actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>("yearly");

  return (
    <div className="login-form">
      <Stack gap="md">
        <div>
          <Title order={2} className="display-title" fw={550}>
            Create account
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Choose a plan, then pay to unlock HomeCore.
          </Text>
        </div>

        <form
          action={async (formData) => {
            setError(null);
            formData.set("plan", plan);
            const result = await registerWithPlan(formData);
            if (result?.error) {
              setError(result.error);
            }
          }}
        >
          <Stack gap="sm">
            <TextInput
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <PasswordInput
              name="password"
              label="Password"
              placeholder="At least 8 characters"
              required
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirm password"
              placeholder="Repeat your password"
              required
            />
            <PlanRadios value={plan} onChange={setPlan} />
            {error ? (
              <Text c="red" size="sm">
                {error}
              </Text>
            ) : null}
            <Button type="submit">Continue to payment</Button>
          </Stack>
        </form>

        <Text size="sm" c="dimmed" ta="center">
          Already have an account?{" "}
          <Anchor component={Link} href="/login" fw={600} size="sm">
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </div>
  );
}
