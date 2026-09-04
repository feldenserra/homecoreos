import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../theme/tokens";

export type MealsView = "recipes" | "ingredients";

const VIEWS: { id: MealsView; label: string }[] = [
  { id: "recipes", label: "Recipes" },
  { id: "ingredients", label: "Ingredients" },
];

/**
 * Secondary pills under the Meals tab: Recipes | Ingredients.
 */
export function MealsViewNav({ active }: { active: MealsView }) {
  return (
    <View style={styles.row}>
      {VIEWS.map((view) => {
        const selected = view.id === active;
        return (
          <Pressable
            key={view.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) {
                return;
              }
              router.setParams({ tab: "meals", view: view.id });
            }}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>
              {view.label}
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
    paddingTop: 4,
    paddingBottom: 4,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
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
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.clay,
  },
});
