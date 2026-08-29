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
    <Stack gap="xl" maw={420} w="100%" mx="auto">
      {homes.length > 0 ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed" tt="uppercase" fw={600} lts={0.6}>
            Your homes
          </Text>
          <Stack gap={6}>
            {homes.map((home) => (
              <UnstyledButton
                key={home.id}
                component={Link}
                href={`/app/${home.id}/home`}
                className="home-gate-link"
              >
                <Text fw={600} size="md">
                  {home.name}
                </Text>
                <Text size="xs" c="dimmed" ff="monospace">
                  {home.id}
                </Text>
              </UnstyledButton>
            ))}
          </Stack>
        </Stack>
      ) : null}

      <Stack gap="md" component="section">
        <div>
          <Title order={2} fz="h3" fw={600}>
            Create a home
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            Start a shared board. You&apos;ll get an 8-character code to invite
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
              size="md"
              radius="md"
            />
            {createError ? (
              <Text size="sm" c="red">
                {createError}
              </Text>
            ) : null}
            <Button type="submit" size="md" radius="md" loading={pending}>
              Create home
            </Button>
          </Stack>
        </form>
      </Stack>

      <Stack gap="md" component="section">
        <div>
          <Title order={2} fz="h3" fw={600}>
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
              size="md"
              radius="md"
              styles={{
                input: {
                  fontFamily: "var(--font-mono, ui-monospace, monospace)",
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
            <Button
              type="submit"
              variant="light"
              size="md"
              radius="md"
              loading={pending}
            >
              Join home
            </Button>
          </Stack>
        </form>
      </Stack>
    </Stack>
  );
}
