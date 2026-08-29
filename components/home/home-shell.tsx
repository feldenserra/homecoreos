"use client";

import { Group, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { segment: "home", label: "Home", exact: true },
  { segment: "tasks", label: "Tasks", exact: false },
  { segment: "chat", label: "Chat", exact: false },
] as const;

export function HomeShell({
  homeId,
  homeName,
  children,
}: {
  homeId: string;
  homeName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/app/${homeId}/home`;

  function isActive(segment: (typeof NAV)[number]["segment"], exact: boolean) {
    if (segment === "home" && exact) {
      return pathname === base || pathname === `${base}/`;
    }
    return pathname.startsWith(`${base}/${segment}`);
  }

  return (
    <div className="home-shell">
      <header className="home-shell-header">
        <Group justify="space-between" wrap="nowrap" gap="md" align="center">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Text
              component={Link}
              href="/app"
              size="xs"
              c="dimmed"
              td="none"
              className="brand-mark"
              fw={600}
              tt="uppercase"
            >
              HomeCore
            </Text>
            <Text size="sm" fw={600} lineClamp={1} style={{ minWidth: 0 }}>
              {homeName}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace" visibleFrom="sm">
              {homeId}
            </Text>
          </Group>

          <nav className="home-shell-nav" aria-label="Home">
            {NAV.map((item) => {
              const href =
                item.segment === "home" ? base : `${base}/${item.segment}`;
              const active = isActive(item.segment, item.exact);
              return (
                <UnstyledButton
                  key={item.segment}
                  component={Link}
                  href={href}
                  className={`home-shell-nav-link${active ? " home-shell-nav-link--active" : ""}`}
                >
                  {item.label}
                </UnstyledButton>
              );
            })}
          </nav>
        </Group>
      </header>
      <div className="home-shell-body">{children}</div>
    </div>
  );
}
