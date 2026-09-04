import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { IngredientForm } from "../../../../../components/meals/ingredient-form";
import { ErrorText, LoadingScreen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import {
  getIngredient,
  type Ingredient,
} from "../../../../../lib/api/meals";
import { useHome } from "../../../../../lib/home-context";
import { notifyIngredientCreated } from "../../../../../lib/meal-form-bridge";
import { colors } from "../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Settings-style modal: create or edit an ingredient. */
export default function MealIngredientScreen() {
  const home = useHome();
  const router = useRouter();
  const params = useLocalSearchParams<{
    ingredientId?: string | string[];
    initialName?: string | string[];
    from?: string | string[];
  }>();
  const ingredientId = paramOne(params.ingredientId);
  const initialName = paramOne(params.initialName) ?? "";
  const fromRecipe = paramOne(params.from) === "recipe";

  const state = useAsync(
    async () =>
      ingredientId ? await getIngredient(home.id, ingredientId) : null,
    [home.id, ingredientId],
  );

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onSaved = useCallback(
    (ingredient: Ingredient) => {
      if (fromRecipe) {
        notifyIngredientCreated(ingredient);
      }
      router.back();
    },
    [fromRecipe, router],
  );

  const title = ingredientId ? "Edit ingredient" : "New ingredient";

  if (ingredientId && state.loading && !state.data) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <LoadingScreen />
      </>
    );
  }

  if (ingredientId && (state.error || !state.data)) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <View style={styles.root}>
          <ErrorText>{state.error ?? "Ingredient not found."}</ErrorText>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <View style={styles.root}>
        <IngredientForm
          homeId={home.id}
          ingredient={state.data}
          initialName={initialName}
          onDismiss={dismiss}
          onSaved={onSaved}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
});
