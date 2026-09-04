import { router, Tabs } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeBottomBar } from "../../../../../components/navigation/home-bottom-bar";
import { useHome } from "../../../../../lib/home-context";
import { navScreenOptions } from "../../../../../theme/paper-theme";
import { colors, TOUCH_TARGET } from "../../../../../theme/tokens";

/**
 * The household's destinations. Replaces components/home/home-shell.tsx.
 *
 * Routing still uses `<Tabs>`, but the chrome is a custom three-slot bar with a
 * semi-circular app switcher (Home | Switcher | Last app) instead of the
 * default tab icons.
 *
 * The rail's brand link ("Switch home") remains the header action.
 */
export default function HomeTabsLayout() {
  const home = useHome();

  return (
    <Tabs
      tabBar={(props) => <HomeBottomBar {...props} />}
      screenOptions={{
        ...navScreenOptions,
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
          title: home.name,
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarLabel: "Tasks",
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: "Chat",
          // The nested Stack draws its own header for the conversation title.
          headerShown: false,
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
