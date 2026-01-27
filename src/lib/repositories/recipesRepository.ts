export interface Ingredient {
    id: string;
    name: string;
    calories: number; // per 100g
}

export interface RecipeIngredient {
    ingredientId: string;
    name: string; // denormalized for display
    amount: number;
    unit: string;
}

export interface Recipe {
    id?: string;
    title: string;
    ingredients: RecipeIngredient[];
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    };
}

// Simulated ingredients database
const ingredientsDb: Ingredient[] = [
    { id: 'ing_1', name: 'Chicken Breast', calories: 165 },
    { id: 'ing_2', name: 'Rice', calories: 130 },
    { id: 'ing_3', name: 'Broccoli', calories: 55 },
    { id: 'ing_4', name: 'Olive Oil', calories: 884 },
    { id: 'ing_5', name: 'Salt', calories: 0 },
    { id: 'ing_6', name: 'Pepper', calories: 0 },
    { id: 'ing_7', name: 'Garlic', calories: 149 },
    { id: 'ing_8', name: 'Onion', calories: 40 },
];

export const recipesRepository = {
    searchIngredients: async (query: string): Promise<Ingredient[]> => {
        console.log(`[REPO] Searching ingredients for: "${query}"`);
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!query) return [];

        return ingredientsDb.filter(ing =>
            ing.name.toLowerCase().includes(query.toLowerCase())
        );
    },

    saveRecipe: async (recipe: Recipe): Promise<void> => {
        console.log('[REPO] Saving recipe...', recipe);
        console.log('[REPO] Recipe details:', {
            title: recipe.title,
            ingredientCount: recipe.ingredients.length,
            macros: recipe.macros
        });
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('[REPO] Recipe saved successfully to database.');
    }
};
