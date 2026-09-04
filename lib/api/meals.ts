import { supabase } from "../supabase";
import type { MealType } from "../types";
import { messageFromError } from "./errors";

/**
 * Meals data layer: ingredients, recipes, grocery, and meal plan.
 *
 * Direct client queries under RLS (`is_home_member("homeId")`). Nutrition is
 * never stored on recipes — callers aggregate with `lib/recipe-nutrition`.
 */

export type Ingredient = {
  id: string;
  homeId: string;
  name: string;
  servingSizeGrams: string | null;
  calories: string | null;
  carbsGrams: string | null;
  fatsGrams: string | null;
  proteinGrams: string | null;
  createdAt: string;
};

export type Recipe = {
  id: string;
  homeId: string;
  name: string;
  createdAt: string;
};

export type RecipeIngredientLine = {
  id: string;
  recipeId: string;
  ingredientId: string;
  homeId: string;
  quantity: string;
  createdAt: string;
  ingredient: Ingredient;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredient: RecipeIngredientLine[];
};

export type GroceryItem = {
  id: string;
  homeId: string;
  name: string;
  isCompleted: boolean;
  weekStartDate: string;
  createdAt: string;
};

export type MealPlanEntry = {
  id: string;
  homeId: string;
  recipeId: string | null;
  customName: string | null;
  date: string;
  mealType: MealType;
  createdAt: string;
  recipe: { id: string; name: string } | null;
};

function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function numericOrNull(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return String(n);
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

export async function listIngredients(homeId: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from("ingredient")
    .select("*")
    .eq("homeId", homeId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load ingredients."));
  }
  return data as Ingredient[];
}

export async function searchIngredients(
  homeId: string,
  query: string,
): Promise<Ingredient[]> {
  const trimmed = query.trim();
  let request = supabase
    .from("ingredient")
    .select("*")
    .eq("homeId", homeId)
    .order("name", { ascending: true })
    .limit(20);

  if (trimmed) {
    request = request.ilike("name", `%${escapeIlike(trimmed)}%`);
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(messageFromError(error, "Could not search ingredients."));
  }
  return data as Ingredient[];
}

export async function createIngredient(input: {
  homeId: string;
  name: string;
  servingSizeGrams?: number | string | null;
  calories?: number | string | null;
  carbsGrams?: number | string | null;
  fatsGrams?: number | string | null;
  proteinGrams?: number | string | null;
}): Promise<Ingredient> {
  const { data, error } = await supabase
    .from("ingredient")
    .insert({
      homeId: input.homeId,
      name: input.name.trim(),
      servingSizeGrams: numericOrNull(input.servingSizeGrams),
      calories: numericOrNull(input.calories),
      carbsGrams: numericOrNull(input.carbsGrams),
      fatsGrams: numericOrNull(input.fatsGrams),
      proteinGrams: numericOrNull(input.proteinGrams),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not add ingredient."));
  }
  return data as Ingredient;
}

export async function updateIngredient(input: {
  homeId: string;
  ingredientId: string;
  name: string;
  servingSizeGrams?: number | string | null;
  calories?: number | string | null;
  carbsGrams?: number | string | null;
  fatsGrams?: number | string | null;
  proteinGrams?: number | string | null;
}): Promise<Ingredient> {
  const { data, error } = await supabase
    .from("ingredient")
    .update({
      name: input.name.trim(),
      servingSizeGrams: numericOrNull(input.servingSizeGrams),
      calories: numericOrNull(input.calories),
      carbsGrams: numericOrNull(input.carbsGrams),
      fatsGrams: numericOrNull(input.fatsGrams),
      proteinGrams: numericOrNull(input.proteinGrams),
    })
    .eq("id", input.ingredientId)
    .eq("homeId", input.homeId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not update ingredient."));
  }
  return data as Ingredient;
}

export async function countIngredientRecipeUses(input: {
  homeId: string;
  ingredientId: string;
}): Promise<number> {
  const { count, error } = await supabase
    .from("recipe_ingredient")
    .select("id", { count: "exact", head: true })
    .eq("homeId", input.homeId)
    .eq("ingredientId", input.ingredientId);

  if (error) {
    throw new Error(
      messageFromError(error, "Could not check ingredient usage."),
    );
  }
  return count ?? 0;
}

export async function deleteIngredient(input: {
  homeId: string;
  ingredientId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("ingredient")
    .delete()
    .eq("id", input.ingredientId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not delete ingredient."));
  }
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export async function listRecipesWithIngredients(
  homeId: string,
): Promise<RecipeWithIngredients[]> {
  const { data, error } = await supabase
    .from("recipe")
    .select(
      "*, recipe_ingredient(*, ingredient:ingredient(*))",
    )
    .eq("homeId", homeId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load recipes."));
  }
  return (data ?? []) as RecipeWithIngredients[];
}

export async function createRecipe(input: {
  homeId: string;
  name: string;
  lines: { ingredientId: string; quantity: number }[];
}): Promise<Recipe> {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipe")
    .insert({
      homeId: input.homeId,
      name: input.name.trim(),
    })
    .select("*")
    .single();

  if (recipeError || !recipe) {
    throw new Error(messageFromError(recipeError, "Could not create recipe."));
  }

  if (input.lines.length > 0) {
    const { error: linesError } = await supabase
      .from("recipe_ingredient")
      .insert(
        input.lines.map((line) => ({
          recipeId: recipe.id,
          ingredientId: line.ingredientId,
          homeId: input.homeId,
          quantity: String(line.quantity),
        })),
      );

    if (linesError) {
      // Best-effort cleanup so a failed junction insert does not leave an
      // empty recipe the user did not ask for.
      await supabase
        .from("recipe")
        .delete()
        .eq("id", recipe.id)
        .eq("homeId", input.homeId);
      throw new Error(
        messageFromError(linesError, "Could not save recipe ingredients."),
      );
    }
  }

  return recipe as Recipe;
}

export async function updateRecipe(input: {
  homeId: string;
  recipeId: string;
  name: string;
  lines: { ingredientId: string; quantity: number }[];
}): Promise<Recipe> {
  const { data: recipe, error: recipeError } = await supabase
    .from("recipe")
    .update({ name: input.name.trim() })
    .eq("id", input.recipeId)
    .eq("homeId", input.homeId)
    .select("*")
    .single();

  if (recipeError || !recipe) {
    throw new Error(messageFromError(recipeError, "Could not update recipe."));
  }

  const { error: deleteLinesError } = await supabase
    .from("recipe_ingredient")
    .delete()
    .eq("recipeId", input.recipeId)
    .eq("homeId", input.homeId);

  if (deleteLinesError) {
    throw new Error(
      messageFromError(
        deleteLinesError,
        "Could not update recipe ingredients.",
      ),
    );
  }

  if (input.lines.length > 0) {
    const { error: linesError } = await supabase.from("recipe_ingredient").insert(
      input.lines.map((line) => ({
        recipeId: input.recipeId,
        ingredientId: line.ingredientId,
        homeId: input.homeId,
        quantity: String(line.quantity),
      })),
    );

    if (linesError) {
      throw new Error(
        messageFromError(linesError, "Could not save recipe ingredients."),
      );
    }
  }

  return recipe as Recipe;
}

export async function deleteRecipe(input: {
  homeId: string;
  recipeId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("recipe")
    .delete()
    .eq("id", input.recipeId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not delete recipe."));
  }
}

export async function addRecipeToGrocery(input: {
  homeId: string;
  recipeId: string;
  weekStartDate: string;
}): Promise<number> {
  const { data, error } = await supabase
    .from("recipe_ingredient")
    .select("quantity, ingredient:ingredient(name)")
    .eq("recipeId", input.recipeId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(
      messageFromError(error, "Could not load recipe ingredients."),
    );
  }

  type Line = {
    quantity: string;
    ingredient: { name: string } | null;
  };
  const lines = (data ?? []) as Line[];
  if (lines.length === 0) {
    return 0;
  }

  const rows = lines
    .filter((line) => line.ingredient?.name)
    .map((line) => {
      const qty = Number(line.quantity);
      const name =
        Number.isFinite(qty) && qty !== 1
          ? `${line.ingredient!.name} × ${qty}`
          : line.ingredient!.name;
      return {
        homeId: input.homeId,
        name,
        weekStartDate: input.weekStartDate,
        isCompleted: false,
      };
    });

  if (rows.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase
    .from("grocery_item")
    .insert(rows);

  if (insertError) {
    throw new Error(
      messageFromError(insertError, "Could not add items to the grocery list."),
    );
  }

  return rows.length;
}

// ---------------------------------------------------------------------------
// Grocery
// ---------------------------------------------------------------------------

export async function listGroceryItems(
  homeId: string,
  weekStartDate: string,
): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from("grocery_item")
    .select("*")
    .eq("homeId", homeId)
    .eq("weekStartDate", weekStartDate)
    .order("createdAt", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load grocery list."));
  }
  return data as GroceryItem[];
}

export async function addGroceryItem(input: {
  homeId: string;
  name: string;
  weekStartDate: string;
}): Promise<GroceryItem> {
  const { data, error } = await supabase
    .from("grocery_item")
    .insert({
      homeId: input.homeId,
      name: input.name.trim(),
      weekStartDate: input.weekStartDate,
      isCompleted: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not add grocery item."));
  }
  return data as GroceryItem;
}

export async function setGroceryCompleted(input: {
  homeId: string;
  itemId: string;
  isCompleted: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("grocery_item")
    .update({ isCompleted: input.isCompleted })
    .eq("id", input.itemId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not update grocery item."));
  }
}

export async function deleteGroceryItem(input: {
  homeId: string;
  itemId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("grocery_item")
    .delete()
    .eq("id", input.itemId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not delete grocery item."));
  }
}

// ---------------------------------------------------------------------------
// Meal plan
// ---------------------------------------------------------------------------

export async function listMealPlanEntries(
  homeId: string,
  fromDate: string,
  toDate: string,
): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from("meal_plan_entry")
    .select("*, recipe:recipe(id, name)")
    .eq("homeId", homeId)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true })
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load meal plan."));
  }
  return (data ?? []) as MealPlanEntry[];
}

export async function addMealPlanEntry(input: {
  homeId: string;
  date: string;
  mealType: MealType;
  recipeId?: string | null;
  customName?: string | null;
}): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from("meal_plan_entry")
    .insert({
      homeId: input.homeId,
      date: input.date,
      mealType: input.mealType,
      recipeId: input.recipeId ?? null,
      customName: input.customName?.trim() || null,
    })
    .select("*, recipe:recipe(id, name)")
    .single();

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not add meal."));
  }
  return data as MealPlanEntry;
}

export async function deleteMealPlanEntry(input: {
  homeId: string;
  entryId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("meal_plan_entry")
    .delete()
    .eq("id", input.entryId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not remove meal."));
  }
}
