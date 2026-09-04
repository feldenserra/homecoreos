import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatWeekRange, mondayOf, shiftWeek } from "../../lib/week";
import { colors, TOUCH_TARGET } from "../../theme/tokens";

/**
 * Shared Monday–Sunday week chrome for Grocery and Meal Plan.
 */
export function WeekNav({
  weekStart,
  onChange,
}: {
  weekStart: string;
  onChange: (next: string) => void;
}) {
  const thisWeek = mondayOf();
  const isCurrent = weekStart === thisWeek;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        onPress={() => onChange(shiftWeek(weekStart, -1))}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Text style={styles.btnLabel}>‹</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.range}>{formatWeekRange(weekStart)}</Text>
        {!isCurrent ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(thisWeek)}
            hitSlop={6}
          >
            <Text style={styles.currentLink}>This week</Text>
          </Pressable>
        ) : (
          <Text style={styles.currentHint}>This week</Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next week"
        onPress={() => onChange(shiftWeek(weekStart, 1))}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Text style={styles.btnLabel}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btn: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  pressed: {
    opacity: 0.55,
  },
  center: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  range: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  currentHint: {
    color: colors.muted,
    fontSize: 12,
  },
  currentLink: {
    color: colors.clay,
    fontSize: 12,
    fontWeight: "700",
  },
});
