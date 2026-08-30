"use client";

import { Text } from "@mantine/core";
import {
  IconHome,
  IconLayoutKanban,
  IconMessage,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HouseMark } from "../house-mark";
import { ManageSubscriptionButton } from "../billing/manage-subscription-button";

const NAV = [
  { segment: "home", label: "Home", exact: true, Icon: IconHome },
  { segment: "tasks", label: "Tasks", exact: false, Icon: IconLayoutKanban },
  { segment: "chat", label: "Chat", exact: false, Icon: IconMessage },
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
      <aside className="home-shell-rail" aria-label="Apps">
        <Link href="/app" className="home-shell-rail-brand">
          <HouseMark />
          <Text className="wordmark" fz="md" c="inherit">
            HomeCore
          </Text>
        </Link>
        <nav className="home-shell-rail-nav">
          {NAV.map((item) => {
            const href =
              item.segment === "home" ? base : `${base}/${item.segment}`;
            const active = isActive(item.segment, item.exact);
            return (
              <Link
                key={item.segment}
                href={href}
                className={`home-shell-rail-link${active ? " home-shell-rail-link--active" : ""}`}
              >
                <item.Icon size={20} stroke={1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="home-shell-main">
        <header className="home-shell-header">
          <Link href="/app" className="home-shell-switch" aria-label="Switch home">
            <HouseMark />
            <span className="home-shell-home-name">{homeName}</span>
          </Link>
          <ManageSubscriptionButton />
        </header>

        <div className="home-shell-body">{children}</div>

        <nav className="home-shell-tabs" aria-label="Home">
          {NAV.map((item) => {
            const href =
              item.segment === "home" ? base : `${base}/${item.segment}`;
            const active = isActive(item.segment, item.exact);
            return (
              <Link
                key={item.segment}
                href={href}
                className={`home-shell-tab${active ? " home-shell-tab--active" : ""}`}
              >
                <item.Icon size={22} stroke={1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
