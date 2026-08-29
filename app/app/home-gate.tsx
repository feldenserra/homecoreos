"use client";

import {
  Button,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createHome, joinHome } from "./actions";

type HomeSummary = {
  id: string;
  name: string;
  role: string;
};

export function HomeGate({ homes }: { homes: HomeSummary[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  return (
    <Stack gap="xl" w="100%">
      {homes.length > 0 ? (
        <Stack gap="sm">
          <Text className="meta-label">Your homes</Text>
          <Stack gap={8}>
            {homes.map((home) => (
              <UnstyledButton
                key={home.id}
                component={Link}
                href={`/app/${home.id}/home`}
                className="home-gate-link"
              >
                <Text fw={650} size="md">
                  {home.name}
                </Text>
                <Text size="xs" c="dimmed" ff="monospace" mt={2}>
                  {home.id}
                </Text>
              </UnstyledButton>
            ))}
          </Stack>
        </Stack>
      ) : null}

      <Stack gap="md" component="section">
        <div>
          <Title order={2} className="display-title" fz={22} fw={550}>
            Create a home
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            Start a shared space. You&apos;ll get an 8-character code to invite
            others.
          </Text>
        </div>
        <form
          action={(formData) => {
            setCreateError(null);
            startTransition(async () => {
              const result = await createHome(formData);
              if (result && "error" in result) {
                setCreateError(result.error);
              } else {
                router.refresh();
              }
            });
          }}
        >
          <Stack gap="sm">
            <TextInput
              name="name"
              label="Home name"
              placeholder="Serra household"
              required
              minLength={2}
              maxLength={64}
            />
            {createError ? (
              <Text size="sm" c="red">
                {createError}
              </Text>
            ) : null}
            <Button type="submit" loading={pending}>
              Create home
            </Button>
          </Stack>
        </form>
      </Stack>

      <Stack gap="md" component="section">
        <div>
          <Title order={2} className="display-title" fz={22} fw={550}>
            Join a home
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            Enter the code shared by someone who already has a home.
          </Text>
        </div>
        <form
          action={(formData) => {
            setJoinError(null);
            startTransition(async () => {
              const result = await joinHome(formData);
              if (result && "error" in result) {
                setJoinError(result.error);
              } else {
                router.refresh();
              }
            });
          }}
        >
          <Stack gap="sm">
            <TextInput
              name="code"
              label="Home code"
              placeholder="A7K2M9QX"
              required
              maxLength={8}
              styles={{
                input: {
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                },
              }}
            />
            {joinError ? (
              <Text size="sm" c="red">
                {joinError}
              </Text>
            ) : null}
            <Button type="submit" variant="light" loading={pending}>
              Join home
            </Button>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
}
