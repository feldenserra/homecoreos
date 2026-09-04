import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import {
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
} from "../ui";
import { useAsync } from "../../hooks/use-async";
import {
  addMealPlanEntry,
  deleteMealPlanEntry,
  listMealPlanEntries,
  listRecipesWithIngredients,
  type MealPlanEntry,
  type RecipeWithIngredients,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealType,
} from "../../lib/types";
import { sundayOf, weekDates, weekdayShort } from "../../lib/week";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
  TOUCH_TARGET,
} from "../../theme/tokens";
import { WeekNav } from "./week-nav";

type SlotTarget = { date: string; mealType: MealType };

type Props = {
  weekStart: string;
  onWeekChange: (next: string) => void;
};

/**
 * Weekly meal plan. Week state is owned by the meals shell.
 */
export function PlanView({ weekStart, onWeekChange }: Props) {
  const home = useHome();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotTarget | null>(null);
  const [customName, setCustomName] = useState("");
  const [pending, setPending] = useState(false);

  const weekEnd = sundayOf(weekStart);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);

  const planState = useAsync(
    async () => await listMealPlanEntries(home.id, weekStart, weekEnd),
    [home.id, weekStart, weekEnd],
  );
  const recipesState = useAsync(
    async () => await listRecipesWithIngredients(home.id),
    [home.id],
  );

  useFocusEffect(
    useCallback(() => {
      void planState.refresh();
      void recipesState.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id, weekStart]),
  );

  const byDay = useMemo(() => {
    const map = new Map<string, MealPlanEntry[]>();
    for (const day of days) {
      map.set(day, []);
    }
    for (const entry of planState.data ?? []) {
      const list = map.get(entry.date);
      if (list) {
        list.push(entry);
      }
    }
    return map;
  }, [days, planState.data]);

  const openAdd = useCallback((date: string, mealType: MealType) => {
    setError(null);
    setCustomName("");
    setSlot({ date, mealType });
  }, []);

  const closeAdd = useCallback(() => {
    setSlot(null);
    setCustomName("");
  }, []);

  const addRecipe = useCallback(
    async (recipe: RecipeWithIngredients) => {
      if (!slot) {
        return;
      }
      setError(null);
      setPending(true);
      try {
        const entry = await addMealPlanEntry({
          homeId: home.id,
          date: slot.date,
          mealType: slot.mealType,
          recipeId: recipe.id,
        });
        planState.setData([...(planState.data ?? []), entry]);
        closeAdd();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add meal.");
      } finally {
        setPending(false);
      }
    },
    [closeAdd, home.id, planState, slot],
  );

  const addCustom = useCallback(async () => {
    if (!slot || !customName.trim()) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const entry = await addMealPlanEntry({
        homeId: home.id,
        date: slot.date,
        mealType: slot.mealType,
        customName: customName.trim(),
      });
      planState.setData([...(planState.data ?? []), entry]);
      closeAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add meal.");
    } finally {
      setPending(false);
    }
  }, [closeAdd, customName, home.id, planState, slot]);

  const remove = useCallback(
    async (entry: MealPlanEntry) => {
      const previous = planState.data ?? [];
      setError(null);
      setBusyId(entry.id);
      planState.setData(previous.filter((row) => row.id !== entry.id));
      try {
        await deleteMealPlanEntry({ homeId: home.id, entryId: entry.id });
      } catch (err) {
        planState.setData(previous);
        setError(
          err instanceof Error ? err.message : "Could not remove meal.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [home.id, planState],
  );

  const confirmRemove = useCallback(
    (entry: MealPlanEntry) => {
      const label = entry.recipe?.name ?? entry.customName ?? "meal";
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        if (globalThis.confirm?.(`Remove "${label}"?`)) {
          void remove(entry);
        }
        return;
      }
      Alert.alert("Remove meal?", label, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void remove(entry),
        },
      ]);
    },
    [remove],
  );

  if (planState.loading && !planState.data) {
    return <LoadingScreen />;
  }

  const recipes = recipesState.data ?? [];

  return (
    <View style={styles.root}>
      <WeekNav weekStart={weekStart} onChange={onWeekChange} />

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorText>{planState.error ?? error}</ErrorText>

        {days.map((day) => {
          const entries = byDay.get(day) ?? [];
          return (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>
                {weekdayShort(day)} · {day.slice(5)}
              </Text>
              {MEAL_TYPES.map((mealType) => {
                const slotEntries = entries.filter(
                  (entry) => entry.mealType === mealType,
                );
                return (
                  <View key={mealType} style={styles.slot}>
                    <View style={styles.slotHeader}>
                      <MetaLabel>{MEAL_TYPE_LABELS[mealType]}</MetaLabel>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${MEAL_TYPE_LABELS[mealType]}`}
                        onPress={() => openAdd(day, mealType)}
                        hitSlop={8}
                        style={styles.slotAdd}
                      >
                        <MaterialCommunityIcons
                          name="plus"
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>
                    {slotEntries.length === 0 ? (
                      <Text style={styles.emptySlot}>—</Text>
                    ) : (
                      slotEntries.map((entry) => (
                        <Pressable
                          key={entry.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${entry.recipe?.name ?? entry.customName}`}
                          disabled={busyId === entry.id}
                          onPress={() => confirmRemove(entry)}
                          style={({ pressed }) => [
                            styles.entry,
                            pressed && styles.entryPressed,
                            busyId === entry.id && styles.entryBusy,
                          ]}
                        >
                          <Text style={styles.entryLabel} numberOfLines={2}>
                            {entry.recipe?.name ?? entry.customName}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Portal>
        <Modal
          visible={slot !== null}
          onDismiss={closeAdd}
          contentContainerStyle={styles.sheet}
        >
          {slot ? (
            <>
              <Text style={styles.sheetTitle}>
                Add · {MEAL_TYPE_LABELS[slot.mealType]} · {slot.date.slice(5)}
              </Text>

              <MetaLabel>From recipes</MetaLabel>
              <ScrollView
                style={styles.recipeList}
                keyboardShouldPersistTaps="handled"
              >
                {recipes.length === 0 ? (
                  <Muted>No recipes yet.</Muted>
                ) : (
                  recipes.map((recipe) => (
                    <Pressable
                      key={recipe.id}
                      accessibilityRole="button"
                      disabled={pending}
                      onPress={() => void addRecipe(recipe)}
                      style={({ pressed }) => [
                        styles.recipeRow,
                        pressed && styles.recipeRowPressed,
                      ]}
                    >
                      <Text style={styles.recipeName} numberOfLines={1}>
                        {recipe.name}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>

              <MetaLabel>Or custom name</MetaLabel>
              <TextInput
                mode="outlined"
                dense
                value={customName}
                onChangeText={setCustomName}
                placeholder="Leftovers"
                maxLength={120}
                style={styles.input}
              />
              <ErrorText>{error}</ErrorText>
              <Button
                mode="contained"
                loading={pending}
                disabled={pending || !customName.trim()}
                onPress={() => void addCustom()}
              >
                Add custom meal
              </Button>
              <Button mode="text" onPress={closeAdd}>
                Cancel
              </Button>
            </>
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  dayCard: {
    gap: 10,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadowLift,
  },
  dayTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  slot: {
    gap: 4,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotAdd: {
    minWidth: TOUCH_TARGET * 0.7,
    minHeight: TOUCH_TARGET * 0.7,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySlot: {
    color: colors.muted,
    fontSize: 13,
    paddingLeft: 2,
    opacity: 0.5,
  },
  entry: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.paper2,
  },
  entryPressed: {
    opacity: 0.7,
  },
  entryBusy: {
    opacity: 0.45,
  },
  entryLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  sheet: {
    marginHorizontal: 20,
    maxHeight: "85%",
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: 10,
    ...shadowLift,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  recipeList: {
    maxHeight: 180,
  },
  recipeRow: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 6,
    backgroundColor: colors.paper,
  },
  recipeRowPressed: {
    backgroundColor: colors.claySoft,
  },
  recipeName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
});
