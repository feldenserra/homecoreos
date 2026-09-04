import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { RecipeForm } from "../../../../../components/meals/recipe-form";
import { ErrorText, LoadingScreen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import { getRecipeWithIngredients } from "../../../../../lib/api/meals";
import { useHome } from "../../../../../lib/home-context";
import { colors } from "../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Settings-style modal: create or edit a recipe. */
export default function MealRecipeScreen() {
  const home = useHome();
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipeId?: string | string[];
  }>();
  const recipeId = paramOne(params.recipeId);

  const state = useAsync(
    async () =>
      recipeId ? await getRecipeWithIngredients(home.id, recipeId) : null,
    [home.id, recipeId],
  );

  const dismiss = useCallback(() => {
    router.back();
  }, [router]);

  const title = recipeId ? "Edit recipe" : "New recipe";

  if (recipeId && state.loading && !state.data) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <LoadingScreen />
      </>
    );
  }

  if (recipeId && (state.error || !state.data)) {
    return (
      <>
        <Stack.Screen options={{ title }} />
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
        <RecipeForm
          homeId={home.id}
          recipe={state.data}
          onDismiss={dismiss}
          onSaved={dismiss}
          onDeleted={dismiss}
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
