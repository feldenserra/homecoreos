'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type RecipeRow = Database['public']['Tables']['recipes']['Row'];

export interface RecipeIngredientInput {
    ingredientId: string;
    quantity: number;
    uom: string;
}

export interface RecipeInput {
    title: string;
    cook_method?: string;
    instructions?: string;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
    ingredients: RecipeIngredientInput[];
}

export const getAllIngredients = async (): Promise<Ingredient[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true })
        .limit(1000);

    if (error) {
        console.error('Error fetching ingredients:', error);
        return [];
    }

    return data || [];
};

export const searchIngredients = async (query: string): Promise<Ingredient[]> => {
    // Keep this for backward compatibility or server-side needs, but we will use client-side filtering mostly.
    const supabase = await createClient();

    if (!query) return [];

    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching ingredients:', error);
        return [];
    }

    return data || [];
};

export const createIngredient = async (name: string): Promise<Ingredient | null> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        console.error('User not authenticated');
        return null;
    }

    const { data, error } = await supabase
        .from('ingredients')
        .insert({
            name: name,
            user_id: userData.user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating ingredient:', error);
        return null;
    }

    return data;
};

export const saveRecipe = async (recipe: RecipeInput): Promise<string | null> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        throw new Error('User not authenticated');
    }

    // 1. Insert Recipe
    const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            user_id: userData.user.id,
            title: recipe.title,
            cook_method: recipe.cook_method,
            instructions: recipe.instructions,
            calories: recipe.macros.calories,
            protein_g: recipe.macros.protein,
            carbs_g: recipe.macros.carbs,
            fat_g: recipe.macros.fats,
        })
        .select()
        .single();

    if (recipeError || !recipeData) {
        console.error('Error saving recipe:', recipeError);
        throw new Error('Failed to save recipe');
    }

    // 2. Insert Ingredients
    if (recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map(ing => ({
            recipe_id: recipeData.id,
            ingredient_id: ing.ingredientId,
            quantity: ing.quantity,
            uom: ing.uom
        }));

        const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsToInsert);

        if (ingredientsError) {
            console.error('Error saving recipe ingredients:', ingredientsError);
            // Ideally we would rollback here, but Supabase HTTP API doesn't support transactions easily.
            // For now we assume optimistic success or manual cleanup if needed.
            throw new Error('Failed to save recipe ingredients');
        }
    }

    return recipeData.id;
};

export const updateRecipe = async (id: string, recipe: RecipeInput): Promise<boolean> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        throw new Error('User not authenticated');
    }

    // 1. Update Recipe Details
    const { error: recipeError } = await supabase
        .from('recipes')
        .update({
            title: recipe.title,
            cook_method: recipe.cook_method,
            instructions: recipe.instructions,
            calories: recipe.macros.calories,
            protein_g: recipe.macros.protein,
            carbs_g: recipe.macros.carbs,
            fat_g: recipe.macros.fats,
        })
        .eq('id', id)
        .eq('user_id', userData.user.id);

    if (recipeError) {
        console.error('Error updating recipe:', recipeError);
        throw new Error('Failed to update recipe');
    }

    // 2. Reconcile Ingredients (Delete all and re-insert)
    // First, delete existing ingredients for this recipe
    const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

    if (deleteError) {
        console.error('Error deleting old ingredients:', deleteError);
        throw new Error('Failed to update recipe ingredients');
    }

    // Then, insert new ingredients
    if (recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map(ing => ({
            recipe_id: id,
            ingredient_id: ing.ingredientId,
            quantity: ing.quantity,
            uom: ing.uom
        }));

        const { error: insertError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsToInsert);

        if (insertError) {
            console.error('Error inserting new ingredients:', insertError);
            throw new Error('Failed to update recipe ingredients');
        }
    }

    return true;
};

export interface ProcessedRecipe extends RecipeRow {
    ingredients: {
        id: string;
        name: string;
        quantity: number;
        uom: string;
    }[];
}

export const getRecipes = async (): Promise<ProcessedRecipe[]> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return [];

    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            recipe_ingredients (
                quantity,
                uom,
                ingredients (
                    id,
                    name
                )
            )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }

    // Transform data to flat structure
    return data.map((recipe: any) => ({
        ...recipe,
        ingredients: recipe.recipe_ingredients.map((ri: any) => ({
            id: ri.ingredients?.id,
            name: ri.ingredients?.name,
            quantity: ri.quantity,
            uom: ri.uom
        })).filter((i: any) => i.id && i.name) // Filter out any broken links
    }));
};

export const deleteRecipe = async (id: string): Promise<boolean> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting recipe:', error);
        return false;
    }
    return true;
};

