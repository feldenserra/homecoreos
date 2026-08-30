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
import { registerWithCredentials } from "./actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="login-form">
      <Stack gap="md">
        <div>
          <Title order={2} className="display-title" fw={550}>
            Create account
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Name, email, and password to get started.
          </Text>
        </div>

        <form
          action={async (formData) => {
            setError(null);
            const result = await registerWithCredentials(formData);
            if (result?.error) {
              setError(result.error);
            }
          }}
        >
          <Stack gap="sm">
            <TextInput
              name="name"
              label="Name"
              placeholder="Alex Serra"
              autoComplete="name"
              required
              minLength={2}
              maxLength={64}
            />
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
            {error ? (
              <Text c="red" size="sm">
                {error}
              </Text>
            ) : null}
            <Button type="submit">Create account</Button>
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
