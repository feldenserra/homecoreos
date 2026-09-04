import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getHomeApp,
  getNonHomeApps,
  isHomeAppId,
  type HomeApp,
  type HomeAppId,
} from "./home-apps";

function storageKey(homeId: string): string {
  return `homecore:last-opened-app:${homeId}`;
}

/** Default right-slot app when nothing has been opened yet. */
export function defaultLastOpenedApp(): HomeApp {
  return getNonHomeApps()[0] ?? getHomeApp("tasks");
}

export async function getLastOpenedApp(homeId: string): Promise<HomeApp> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(homeId));
    if (raw && isHomeAppId(raw) && raw !== "index") {
      return getHomeApp(raw);
    }
  } catch {
    /* fall through to default */
  }
  return defaultLastOpenedApp();
}

/**
 * Persist the most recently opened non-Home app for the right bottom-bar slot.
 * Selecting Home must not overwrite the previous last app.
 */
export async function setLastOpenedApp(
  homeId: string,
  appId: HomeAppId,
): Promise<void> {
  if (appId === "index") {
    return;
  }
  try {
    await AsyncStorage.setItem(storageKey(homeId), appId);
  } catch {
    /* non-fatal */
  }
}
