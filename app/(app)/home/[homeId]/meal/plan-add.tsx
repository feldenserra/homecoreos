import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
} from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import {
  addMealPlanEntry,
  listRecipesWithIngredients,
  type RecipeWithIngredients,
} from "../../../../../lib/api/meals";
import { useHome } from "../../../../../lib/home-context";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealType,
} from "../../../../../lib/types";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  TOUCH_TARGET,
} from "../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Settings-style modal: add a recipe or custom meal to a plan slot. */
export default function MealPlanAddScreen() {
  const home = useHome();
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string | string[];
    mealType?: string | string[];
  }>();
  const date = paramOne(params.date);
  const mealType = paramOne(params.mealType) as MealType | undefined;

  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const recipesState = useAsync(
    async () => await listRecipesWithIngredients(home.id),
    [home.id],
  );

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  const addRecipe = useCallback(
    async (recipe: RecipeWithIngredients) => {
      if (!date || !mealType) {
        return;
      }
      setError(null);
      setPending(true);
      try {
        await addMealPlanEntry({
          homeId: home.id,
          date,
          mealType,
          recipeId: recipe.id,
        });
        router.back();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add meal.");
      } finally {
        setPending(false);
      }
    },
    [date, home.id, mealType, router],
  );

  const addCustom = useCallback(async () => {
    if (!date || !mealType || !customName.trim()) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      await addMealPlanEntry({
        homeId: home.id,
        date,
        mealType,
        customName: customName.trim(),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add meal.");
    } finally {
      setPending(false);
    }
  }, [customName, date, home.id, mealType, router]);

  const title =
    date && mealType
      ? `Add · ${MEAL_TYPE_LABELS[mealType]} · ${date.slice(5)}`
      : "Add meal";

  if (!date || !mealType || !MEAL_TYPES.includes(mealType)) {
    return (
      <>
        <Stack.Screen options={{ title: "Add meal" }} />
        <View style={styles.root}>
          <ErrorText>Missing plan slot.</ErrorText>
        </View>
      </>
    );
  }

  if (recipesState.loading && !recipesState.data) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <LoadingScreen />
      </>
    );
  }

  const recipes = recipesState.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <MetaLabel>From recipes</MetaLabel>
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
          <ErrorText>{error ?? recipesState.error}</ErrorText>
          <Button
            mode="contained"
            loading={pending}
            disabled={pending || !customName.trim()}
            onPress={() => void addCustom()}
          >
            Add custom meal
          </Button>
          <Button mode="text" onPress={dismiss}>
            Cancel
          </Button>
        </ScrollView>
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
    gap: 10,
    paddingBottom: 40,
  },
  recipeRow: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
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
