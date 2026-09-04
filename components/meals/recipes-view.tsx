import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Card,
  ErrorText,
  LoadingScreen,
  Muted,
} from "../ui";
import { useAsync } from "../../hooks/use-async";
import {
  listRecipesWithIngredients,
  type RecipeWithIngredients,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import {
  aggregateNutrition,
  formatMacro,
} from "../../lib/recipe-nutrition";
import { colors } from "../../theme/tokens";

/**
 * Recipe book list. Create/edit and grocery/plan actions open Settings-style
 * Expo Router modal screens under /meal/*.
 */
export function RecipesView() {
  const home = useHome();
  const router = useRouter();

  const state = useAsync(
    async () => await listRecipesWithIngredients(home.id),
    [home.id],
  );

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
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
        <ErrorText>{state.error}</ErrorText>

        {recipes.length === 0 ? (
          <Muted>No recipes yet. Tap + to add one.</Muted>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() =>
                router.push(
                  `/home/${home.id}/meal/recipe?recipeId=${recipe.id}`,
                )
              }
              onPlus={() =>
                router.push(
                  `/home/${home.id}/meal/actions?recipeId=${recipe.id}`,
                )
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RecipeCard({
  recipe,
  onEdit,
  onPlus,
}: {
  recipe: RecipeWithIngredients;
  onEdit: () => void;
  onPlus: () => void;
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
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${recipe.name} to grocery or meal plan`}
          onPress={onPlus}
          style={({ pressed }) => [
            styles.plusBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.muted} />
        </Pressable>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.macros}>
          {formatMacro(nutrition.calories, "calories")} cal · C{" "}
          {formatMacro(nutrition.carbsGrams, "grams")} · F{" "}
          {formatMacro(nutrition.fatsGrams, "grams")} · P{" "}
          {formatMacro(nutrition.proteinGrams, "grams")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${recipe.name}`}
          onPress={onEdit}
          style={({ pressed }) => [
            styles.pencilBtn,
            pressed && styles.iconBtnPressed,
          ]}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color={colors.muted}
          />
        </Pressable>
      </View>
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
  card: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
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
  pencilBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconBtnPressed: {
    opacity: 0.7,
  },
  macros: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
});
