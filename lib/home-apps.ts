import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * The household apps reachable from the custom bottom bar / arc switcher.
 * Tab route names match expo-router file routes under (tabs)/.
 */
export type HomeAppId = "index" | "tasks" | "chat";

export type HomeApp = {
  id: HomeAppId;
  label: string;
  icon: IconName;
  /** True for the dedicated left-slot Home shortcut. */
  isHome: boolean;
};

export const HOME_APPS: readonly HomeApp[] = [
  { id: "index", label: "Home", icon: "home", isHome: true },
  { id: "tasks", label: "Tasks", icon: "view-column", isHome: false },
  { id: "chat", label: "Chat", icon: "message", isHome: false },
] as const;

export function getHomeApp(id: HomeAppId): HomeApp {
  const app = HOME_APPS.find((entry) => entry.id === id);
  if (!app) {
    throw new Error(`Unknown home app: ${id}`);
  }
  return app;
}

export function getNonHomeApps(): HomeApp[] {
  return HOME_APPS.filter((app) => !app.isHome);
}

export function isHomeAppId(value: string): value is HomeAppId {
  return HOME_APPS.some((app) => app.id === value);
}
