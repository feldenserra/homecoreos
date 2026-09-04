import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useHome } from "../../lib/home-context";
import { colors, radius } from "../../theme/tokens";

export type MealsSection = "recipes" | "grocery" | "plan";

const SECTIONS: { id: MealsSection; label: string; path: string }[] = [
  { id: "recipes", label: "Recipes", path: "" },
  { id: "grocery", label: "Grocery", path: "/grocery" },
  { id: "plan", label: "Plan", path: "/plan" },
];

/**
 * Segmented control for the three Meals views. Uses replace so Recipes /
 * Grocery / Plan do not stack on the nested Stack.
 */
export function MealsSubnav({ active }: { active: MealsSection }) {
  const home = useHome();

  return (
    <View style={styles.row}>
      {SECTIONS.map((section) => {
        const selected = section.id === active;
        return (
          <Pressable
            key={section.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) {
                return;
              }
              router.replace(`/home/${home.id}/meals${section.path}`);
            }}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>
              {section.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    borderRadius: radius.md,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.claySoft,
    borderColor: colors.clay,
  },
  chipPressed: {
    opacity: 0.75,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.clay,
  },
});
