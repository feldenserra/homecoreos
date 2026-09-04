import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GroceryView } from "../../../../../../components/meals/grocery-view";
import { IngredientFormModal } from "../../../../../../components/meals/ingredient-form-modal";
import { IngredientsView } from "../../../../../../components/meals/ingredients-view";
import {
  MealsSubnav,
  type MealsTab,
} from "../../../../../../components/meals/meals-subnav";
import {
  MealsViewNav,
  type MealsView,
} from "../../../../../../components/meals/meals-view-nav";
import { PlanView } from "../../../../../../components/meals/plan-view";
import { RecipeFormModal } from "../../../../../../components/meals/recipe-form-modal";
import { RecipesView } from "../../../../../../components/meals/recipes-view";
import type {
  Ingredient,
  RecipeWithIngredients,
} from "../../../../../../lib/api/meals";
import { mondayOf } from "../../../../../../lib/week";
import { colors, TOUCH_TARGET } from "../../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseTab(raw: string | undefined): MealsTab {
  if (raw === "grocery" || raw === "plan" || raw === "meals") {
    return raw;
  }
  // Legacy deep link used "recipes" as the first section id.
  if (raw === "recipes") {
    return "meals";
  }
  return "meals";
}

function parseView(raw: string | undefined): MealsView {
  if (raw === "ingredients" || raw === "recipes") {
    return raw;
  }
  return "recipes";
}

/**
 * Single Meals shell: top pills (Meals / Grocery / Plan) and secondary
 * Recipes | Ingredients stay mounted; views swap via query params.
 */
export default function MealsShellScreen() {
  const params = useLocalSearchParams<{
    tab?: string | string[];
    view?: string | string[];
  }>();
  const tab = parseTab(paramOne(params.tab));
  const view = parseView(paramOne(params.view));

  const [weekStart, setWeekStart] = useState(() => mondayOf());
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<Ingredient | null>(null);
  const [recipesRefreshKey, setRecipesRefreshKey] = useState(0);
  const [ingredientsRefreshKey, setIngredientsRefreshKey] = useState(0);

  const showHeaderPlus = tab === "meals";

  const openCreateRecipe = useCallback(() => {
    setEditingRecipe(null);
    setRecipeOpen(true);
  }, []);

  const openEditRecipe = useCallback((recipe: RecipeWithIngredients) => {
    setEditingRecipe(recipe);
    setRecipeOpen(true);
  }, []);

  const openCreateIngredient = useCallback(() => {
    setEditingIngredient(null);
    setIngredientOpen(true);
  }, []);

  const openEditIngredient = useCallback((ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientOpen(true);
  }, []);

  const onHeaderPlus = useCallback(() => {
    if (view === "ingredients") {
      openCreateIngredient();
    } else {
      openCreateRecipe();
    }
  }, [openCreateIngredient, openCreateRecipe, view]);

  const headerRight = useMemo(() => {
    if (!showHeaderPlus) {
      return undefined;
    }
    return () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          view === "ingredients" ? "New ingredient" : "New recipe"
        }
        onPress={onHeaderPlus}
        style={styles.headerAction}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.muted} />
      </Pressable>
    );
  }, [onHeaderPlus, showHeaderPlus, view]);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "Meals",
          headerRight,
        }}
      />

      <MealsSubnav active={tab} />
      {tab === "meals" ? <MealsViewNav active={view} /> : null}

      {tab === "meals" && view === "recipes" ? (
        <RecipesView
          onEdit={openEditRecipe}
          refreshKey={recipesRefreshKey}
        />
      ) : null}
      {tab === "meals" && view === "ingredients" ? (
        <IngredientsView
          onEdit={openEditIngredient}
          refreshKey={ingredientsRefreshKey}
        />
      ) : null}
      {tab === "grocery" ? (
        <GroceryView weekStart={weekStart} onWeekChange={setWeekStart} />
      ) : null}
      {tab === "plan" ? (
        <PlanView weekStart={weekStart} onWeekChange={setWeekStart} />
      ) : null}

      <RecipeFormModal
        visible={recipeOpen}
        recipe={editingRecipe}
        onDismiss={() => {
          setRecipeOpen(false);
          setEditingRecipe(null);
        }}
        onSaved={() => {
          setRecipeOpen(false);
          setEditingRecipe(null);
          setRecipesRefreshKey((n) => n + 1);
          setIngredientsRefreshKey((n) => n + 1);
        }}
      />

      {/* Standalone ingredient create/edit (Ingredients tab). Nested create
          from the recipe form is owned by RecipeFormModal. */}
      <IngredientFormModal
        visible={ingredientOpen}
        ingredient={editingIngredient}
        onDismiss={() => {
          setIngredientOpen(false);
          setEditingIngredient(null);
        }}
        onSaved={() => {
          setIngredientOpen(false);
          setEditingIngredient(null);
          setIngredientsRefreshKey((n) => n + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerAction: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
