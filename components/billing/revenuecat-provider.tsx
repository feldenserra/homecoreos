"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Text } from "@mantine/core";
import { ensurePurchasesConfigured } from "../../lib/revenuecat/browser";

export function RevenueCatProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    ensurePurchasesConfigured(userId)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Could not start billing. Check the RevenueCat public API key.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <Text c="red" size="sm">
        {error}
      </Text>
    );
  }

  if (!ready) {
    return (
      <Text c="dimmed" size="sm">
        Loading billing…
      </Text>
    );
  }

  return <>{children}</>;
}
