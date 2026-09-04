import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  ErrorText,
  LoadingScreen,
  MetaLabel,
} from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import {
  addMealPlanEntry,
  addRecipeToGrocery,
  getRecipeWithIngredients,
} from "../../../../../lib/api/meals";
import { useHome } from "../../../../../lib/home-context";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealType,
} from "../../../../../lib/types";
import { formatDate, mondayOf } from "../../../../../lib/week";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
} from "../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

type Mode = "menu" | "plan";

/** Settings-style modal: add recipe to grocery list or meal plan. */
export default function MealActionsScreen() {
  const home = useHome();
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId?: string | string[] }>();
  const recipeId = paramOne(params.recipeId);

  const [mode, setMode] = useState<Mode>("menu");
  const [planDate, setPlanDate] = useState(formatDate(new Date()));
  const [planMealType, setPlanMealType] = useState<MealType>("dinner");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const state = useAsync(
    async () =>
      recipeId ? await getRecipeWithIngredients(home.id, recipeId) : null,
    [home.id, recipeId],
  );

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  const addToGrocery = useCallback(async () => {
    if (!recipeId) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      await addRecipeToGrocery({
        homeId: home.id,
        recipeId,
        weekStartDate: mondayOf(),
      });
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add to grocery list.",
      );
    } finally {
      setPending(false);
    }
  }, [home.id, recipeId, router]);

  const addToPlan = useCallback(async () => {
    if (!recipeId) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      await addMealPlanEntry({
        homeId: home.id,
        date: planDate.trim(),
        mealType: planMealType,
        recipeId,
      });
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add to meal plan.",
      );
    } finally {
      setPending(false);
    }
  }, [home.id, planDate, planMealType, recipeId, router]);

  const title = state.data?.name ?? "Recipe";

  if (!recipeId) {
    return (
      <>
        <Stack.Screen options={{ title: "Recipe" }} />
        <View style={styles.root}>
          <ErrorText>Missing recipe.</ErrorText>
        </View>
      </>
    );
  }

  if (state.loading && !state.data) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <LoadingScreen />
      </>
    );
  }

  if (state.error || !state.data) {
    return (
      <>
        <Stack.Screen options={{ title: "Recipe" }} />
        <View style={styles.root}>
          <ErrorText>{state.error ?? "Recipe not found."}</ErrorText>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.root}>
        <View style={styles.body}>
          <ErrorText>{error}</ErrorText>
          {mode === "menu" ? (
            <>
              <Button
                mode="contained"
                loading={pending}
                disabled={pending}
                onPress={() => void addToGrocery()}
                style={styles.btn}
              >
                Add to Grocery List
              </Button>
              <Button
                mode="contained-tonal"
                disabled={pending}
                onPress={() => setMode("plan")}
                style={styles.btn}
              >
                Add to Meal Plan
              </Button>
              <Button mode="text" onPress={dismiss}>
                Cancel
              </Button>
            </>
          ) : (
            <>
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
              <Button
                mode="contained"
                loading={pending}
                disabled={pending}
                onPress={() => void addToPlan()}
                style={styles.btn}
              >
                Add to plan
              </Button>
              <Button mode="text" onPress={() => setMode("menu")}>
                Back
              </Button>
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  btn: {
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
