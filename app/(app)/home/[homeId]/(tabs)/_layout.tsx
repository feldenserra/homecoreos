import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useHome } from "../../../../../lib/home-context";
import {
  navScreenOptions,
  tabBarOptions,
} from "../../../../../theme/paper-theme";
import { colors, TOUCH_TARGET } from "../../../../../theme/tokens";

/**
 * The household's three destinations. Replaces components/home/home-shell.tsx.
 *
 * That component rendered the same NAV array twice — a 220px left rail shown at
 * min-width 48em, and a bottom tab bar below it. Only the tab bar survives:
 * `<Tabs>` is the native idiom on both platforms, and a desktop-only sidebar
 * would be a web-only branch maintained for one breakpoint. On a wide web
 * viewport the tab bar simply sits at the bottom.
 *
 * The rail's brand link ("Switch home") becomes the header action.
 */
export default function HomeTabsLayout() {
  const home = useHome();

  return (
    <Tabs
      screenOptions={{
        ...navScreenOptions,
        ...tabBarOptions,
        headerShown: true,
        title: home.name,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch home"
            onPress={() => router.replace("/homes")}
            style={styles.headerAction}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={22}
              color={colors.muted}
            />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarLabel: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-column"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: "Chat",
          // The nested Stack draws its own header for the conversation title.
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
