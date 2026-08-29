"use client";

import { useState } from "react";
import {
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  registerWithCredentials,
  signInWithCredentials,
  signInWithGitHub,
} from "./actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="login-form">
      <Stack gap="md">
        <div>
          <Title order={2} className="display-title" fw={550}>
            Sign in
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Email and password, or continue with GitHub.
          </Text>
        </div>

        <form
          action={async (formData) => {
            setError(null);
            const result = await signInWithCredentials(formData);
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
            {error ? (
              <Text c="red" size="sm">
                {error}
              </Text>
            ) : null}
            <Button type="submit">Sign in</Button>
            <Button
              type="submit"
              variant="light"
              formAction={async (formData) => {
                setError(null);
                const result = await registerWithCredentials(formData);
                if (result?.error) {
                  setError(result.error);
                }
              }}
            >
              Create account
            </Button>
          </Stack>
        </form>

        <Divider label="or" labelPosition="center" />

        <form action={signInWithGitHub}>
          <Button type="submit" variant="default" fullWidth>
            Continue with GitHub
          </Button>
        </form>
      </Stack>
    </div>
  );
}
