import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Portal } from "react-native-paper";
import {
  getHomeApp,
  isHomeAppId,
  type HomeApp,
  type HomeAppId,
} from "../../lib/home-apps";
import { useHome } from "../../lib/home-context";
import {
  defaultLastOpenedApp,
  getLastOpenedApp,
  setLastOpenedApp,
} from "../../lib/last-opened-app";
import { colors, radius, shadowLift, TOUCH_TARGET } from "../../theme/tokens";
import { AppSwitcherArc } from "./app-switcher-arc";

const SWITCHER_SIZE = 56;
const SLOT_SIZE = 44;

/**
 * Custom three-slot bottom bar: Home | Arc switcher toggle | Last opened app.
 * Replaces the default expo-router Tabs chrome while keeping Tabs for routing.
 */
export function HomeBottomBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const home = useHome();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [lastApp, setLastApp] = useState<HomeApp>(() => defaultLastOpenedApp());
  const [seenActiveId, setSeenActiveId] = useState<HomeAppId | null>(null);

  const activeRouteName = state.routes[state.index]?.name ?? "index";
  const activeAppId: HomeAppId = isHomeAppId(activeRouteName)
    ? activeRouteName
    : "index";

  // Adjust last-app when the active tab changes (render-time sync, not an effect).
  if (activeAppId !== "index" && activeAppId !== seenActiveId) {
    setSeenActiveId(activeAppId);
    setLastApp(getHomeApp(activeAppId));
  } else if (activeAppId === "index" && seenActiveId !== "index") {
    setSeenActiveId("index");
  }

  useEffect(() => {
    let active = true;
    void getLastOpenedApp(home.id).then((app) => {
      if (active) {
        setLastApp(app);
      }
    });
    return () => {
      active = false;
    };
  }, [home.id]);

  useEffect(() => {
    if (activeAppId === "index") {
      return;
    }
    void setLastOpenedApp(home.id, activeAppId);
  }, [activeAppId, home.id]);

  const navigateToApp = useCallback(
    (app: HomeApp) => {
      const route = state.routes.find((entry) => entry.name === app.id);
      if (!route) {
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(app.id);
      }

      if (!app.isHome) {
        setLastApp(app);
        void setLastOpenedApp(home.id, app.id);
      }

      setSwitcherOpen(false);
    },
    [home.id, navigation, state.routes],
  );

  const bottomPad = Math.max(insets.bottom, 10);

  const homeActive = activeAppId === "index";
  const lastActive = activeAppId === lastApp.id;

  const lastAccessibilityLabel = useMemo(
    () => `Open ${lastApp.label}`,
    [lastApp.label],
  );

  return (
    <View style={styles.wrap}>
      <Portal>
        <AppSwitcherArc
          open={switcherOpen}
          activeAppId={activeAppId}
          bottomInset={64 + bottomPad}
          onSelect={navigateToApp}
          onDismiss={() => setSwitcherOpen(false)}
        />
      </Portal>

      <View
        style={[
          styles.bar,
          { paddingBottom: bottomPad, height: 64 + bottomPad },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home"
          accessibilityState={{ selected: homeActive }}
          onPress={() => navigateToApp(getHomeApp("index"))}
          style={({ pressed }) => [
            styles.slot,
            homeActive && styles.slotActive,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="home"
            size={24}
            color={homeActive ? colors.clay : colors.muted}
          />
          <Text style={[styles.slotLabel, homeActive && styles.slotLabelActive]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            switcherOpen ? "Close app switcher" : "Open app switcher"
          }
          accessibilityState={{ expanded: switcherOpen }}
          onPress={() => setSwitcherOpen((open) => !open)}
          style={({ pressed }) => [
            styles.switcher,
            switcherOpen && styles.switcherOpen,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={switcherOpen ? "close" : "apps"}
            size={26}
            color="#ffffff"
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={lastAccessibilityLabel}
          accessibilityState={{ selected: lastActive }}
          onPress={() => navigateToApp(lastApp)}
          style={({ pressed }) => [
            styles.slot,
            lastActive && styles.slotActive,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={lastApp.icon}
            size={24}
            color={lastActive ? colors.clay : colors.muted}
          />
          <Text style={[styles.slotLabel, lastActive && styles.slotLabelActive]}>
            {lastApp.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  slot: {
    width: SLOT_SIZE + 28,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: radius.md,
  },
  slotActive: {
    backgroundColor: colors.claySoft,
  },
  slotLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  slotLabelActive: {
    color: colors.clay,
  },
  switcher: {
    width: SWITCHER_SIZE,
    height: SWITCHER_SIZE,
    marginTop: -18,
    borderRadius: SWITCHER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.clay,
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadowLift,
  },
  switcherOpen: {
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.75,
  },
});
