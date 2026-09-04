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
  Card,
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
} from "../ui";
import { useAsync } from "../../hooks/use-async";
import {
  addMealPlanEntry,
  addRecipeToGrocery,
  deleteRecipe,
  listRecipesWithIngredients,
  type RecipeWithIngredients,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import {
  aggregateNutrition,
  formatMacro,
} from "../../lib/recipe-nutrition";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealType,
} from "../../lib/types";
import { formatDate, mondayOf } from "../../lib/week";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
} from "../../theme/tokens";

type SheetMode = "menu" | "plan";

type Props = {
  onEdit: (recipe: RecipeWithIngredients) => void;
  /** Bumps when the shell saves a recipe so this list refreshes. */
  refreshKey?: number;
};

/**
 * Recipe book list with grocery/plan action sheet. Create/edit are owned by
 * the meals shell modals.
 */
export function RecipesView({ onEdit, refreshKey = 0 }: Props) {
  const home = useHome();
  const [status, setStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [picked, setPicked] = useState<RecipeWithIngredients | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("menu");
  const [planDate, setPlanDate] = useState(formatDate(new Date()));
  const [planMealType, setPlanMealType] = useState<MealType>("dinner");

  const state = useAsync(
    async () => await listRecipesWithIngredients(home.id),
    [home.id, refreshKey],
  );

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id, refreshKey]),
  );

  const flash = useCallback((message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2500);
  }, []);

  const openSheet = useCallback((recipe: RecipeWithIngredients) => {
    setActionError(null);
    setPicked(recipe);
    setSheetMode("menu");
    setPlanDate(formatDate(new Date()));
    setPlanMealType("dinner");
  }, []);

  const closeSheet = useCallback(() => {
    setPicked(null);
    setSheetMode("menu");
  }, []);

  const addToGrocery = useCallback(async () => {
    if (!picked) {
      return;
    }
    setActionError(null);
    setBusyId(picked.id);
    try {
      const count = await addRecipeToGrocery({
        homeId: home.id,
        recipeId: picked.id,
        weekStartDate: mondayOf(),
      });
      closeSheet();
      flash(
        count === 0
          ? "Recipe has no ingredients to add."
          : `Added ${count} item${count === 1 ? "" : "s"} to this week’s list.`,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not add to grocery list.",
      );
    } finally {
      setBusyId(null);
    }
  }, [closeSheet, flash, home.id, picked]);

  const addToPlan = useCallback(async () => {
    if (!picked) {
      return;
    }
    setActionError(null);
    setBusyId(picked.id);
    try {
      await addMealPlanEntry({
        homeId: home.id,
        date: planDate.trim(),
        mealType: planMealType,
        recipeId: picked.id,
      });
      closeSheet();
      flash(`Added to ${MEAL_TYPE_LABELS[planMealType].toLowerCase()}.`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not add to meal plan.",
      );
    } finally {
      setBusyId(null);
    }
  }, [closeSheet, flash, home.id, picked, planDate, planMealType]);

  const remove = useCallback(
    async (recipe: RecipeWithIngredients) => {
      setActionError(null);
      setBusyId(recipe.id);
      try {
        await deleteRecipe({ homeId: home.id, recipeId: recipe.id });
        await state.refresh();
        flash("Recipe deleted.");
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not delete recipe.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [flash, home.id, state],
  );

  const confirmRemove = useCallback(
    (recipe: RecipeWithIngredients) => {
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        if (globalThis.confirm?.(`Delete "${recipe.name}"?`)) {
          void remove(recipe);
        }
        return;
      }
      Alert.alert("Delete recipe?", recipe.name, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove(recipe),
        },
      ]);
    },
    [remove],
  );

  const recipes = state.data ?? [];

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorText>{state.error ?? actionError}</ErrorText>
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {recipes.length === 0 ? (
          <Muted>No recipes yet. Tap + to add one.</Muted>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              busy={busyId === recipe.id}
              onEdit={() => onEdit(recipe)}
              onPlus={() => openSheet(recipe)}
              onDelete={() => confirmRemove(recipe)}
            />
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={picked !== null}
          onDismiss={closeSheet}
          contentContainerStyle={styles.sheet}
        >
          {picked ? (
            sheetMode === "menu" ? (
              <>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {picked.name}
                </Text>
                <ErrorText>{actionError}</ErrorText>
                <Button
                  mode="contained-tonal"
                  disabled={busyId === picked.id}
                  onPress={() => {
                    closeSheet();
                    onEdit(picked);
                  }}
                  style={styles.sheetBtn}
                >
                  Edit recipe
                </Button>
                <Button
                  mode="contained"
                  loading={busyId === picked.id}
                  disabled={busyId === picked.id}
                  onPress={() => void addToGrocery()}
                  style={styles.sheetBtn}
                >
                  Add to Grocery List
                </Button>
                <Button
                  mode="contained-tonal"
                  disabled={busyId === picked.id}
                  onPress={() => setSheetMode("plan")}
                  style={styles.sheetBtn}
                >
                  Add to Meal Plan
                </Button>
                <Button mode="text" onPress={closeSheet}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  Plan {picked.name}
                </Text>
                <MetaLabel>Date (YYYY-MM-DD)</MetaLabel>
                <TextInput
                  mode="outlined"
                  dense
                  value={planDate}
                  onChangeText={setPlanDate}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <MetaLabel>Meal</MetaLabel>
                <View style={styles.mealTypeRow}>
                  {MEAL_TYPES.map((type) => {
                    const selected = type === planMealType;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setPlanMealType(type)}
                        style={[
                          styles.mealChip,
                          selected && styles.mealChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.mealChipLabel,
                            selected && styles.mealChipLabelActive,
                          ]}
                        >
                          {MEAL_TYPE_LABELS[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <ErrorText>{actionError}</ErrorText>
                <Button
                  mode="contained"
                  loading={busyId === picked.id}
                  disabled={busyId === picked.id}
                  onPress={() => void addToPlan()}
                  style={styles.sheetBtn}
                >
                  Add to plan
                </Button>
                <Button mode="text" onPress={() => setSheetMode("menu")}>
                  Back
                </Button>
              </>
            )
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

function RecipeCard({
  recipe,
  busy,
  onEdit,
  onPlus,
  onDelete,
}: {
  recipe: RecipeWithIngredients;
  busy: boolean;
  onEdit: () => void;
  onPlus: () => void;
  onDelete: () => void;
}) {
  const nutrition = useMemo(
    () =>
      aggregateNutrition(
        (recipe.recipe_ingredient ?? []).map((line) => ({
          quantity: Number(line.quantity) || 0,
          calories: line.ingredient?.calories,
          carbsGrams: line.ingredient?.carbsGrams,
          fatsGrams: line.ingredient?.fatsGrams,
          proteinGrams: line.ingredient?.proteinGrams,
        })),
      ),
    [recipe.recipe_ingredient],
  );

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${recipe.name}`}
          onPress={onEdit}
          onLongPress={onDelete}
          delayLongPress={450}
          style={styles.cardTitleWrap}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Actions for ${recipe.name}`}
          disabled={busy}
          onPress={onPlus}
          style={({ pressed }) => [
            styles.plusBtn,
            pressed && styles.plusBtnPressed,
            busy && styles.plusBtnBusy,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={styles.macros}>
        {formatMacro(nutrition.calories, "calories")} cal · C{" "}
        {formatMacro(nutrition.carbsGrams, "grams")} · F{" "}
        {formatMacro(nutrition.fatsGrams, "grams")} · P{" "}
        {formatMacro(nutrition.proteinGrams, "grams")}
      </Text>
      <Text style={styles.hint}>Tap to edit · Long-press to delete</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  status: {
    color: colors.clay,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  plusBtnPressed: {
    opacity: 0.7,
  },
  plusBtnBusy: {
    opacity: 0.45,
  },
  macros: {
    color: colors.muted,
    fontSize: 13,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    opacity: 0.7,
  },
  sheet: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: 12,
    ...shadowLift,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  sheetBtn: {
    borderRadius: radius.md,
  },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  mealTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  mealChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mealChipActive: {
    backgroundColor: colors.claySoft,
    borderColor: colors.clay,
  },
  mealChipLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  mealChipLabelActive: {
    color: colors.clay,
  },
});
