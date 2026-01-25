export const dynamic = 'force-dynamic';
import { CorePage } from "../components/CorePage";
import { RecipeForm } from "../components/RecipeForm";
import * as recipeRepo from '../actions/recipes';
import { CoreStack } from "../components/CoreStack";
import { CoreItem } from "../components/CoreItem";


export default async function Recipes(props: { searchParams: Promise<{ filter?: string }> }) {

    const ingredients = await recipeRepo.getIngredients();
    const recipes = await recipeRepo.getAll();

    return (
        <CorePage>
            <CoreStack spacing={3}>
                <CoreItem>
                    <h1 className="text-2xl font-bold">Recipes</h1>
                </CoreItem>

                <CoreItem>
                    <RecipeForm availableIngredients={ingredients} />
                </CoreItem>

                <CoreItem>
                    <CoreStack spacing={2}>
                        <CoreItem>
                            <h2 className="text-xl font-semibold">All Recipes ({recipes.length})</h2>
                        </CoreItem>

                        {recipes.length === 0 ? (
                            <CoreItem>
                                <div className="border rounded-lg p-4 bg-base-100 text-center">
                                    <p className="text-base-content/60">No recipes found. Create one above!</p>
                                </div>
                            </CoreItem>
                        ) : (
                            <CoreStack spacing={2}>
                                {recipes.map((recipe) => (
                                    <CoreItem key={recipe.id}>
                                        <div className="border border-base-300 rounded-lg p-3 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                                            <CoreStack spacing={2}>
                                                <CoreItem>
                                                    <h3 className="text-lg font-bold">{recipe.name}</h3>
                                                </CoreItem>

                                                <CoreItem>
                                                    <p className="text-sm text-base-content/80">{recipe.instructions}</p>
                                                </CoreItem>
                                                <CoreItem>
                                                    <p className="text-xs italic text-base-content/60">Cook Type: {recipe.cookType}</p>
                                                </CoreItem>
                                                <CoreItem>
                                                    <CoreStack spacing={1}>
                                                        <CoreItem>
                                                            <h4 className="font-semibold text-xs uppercase tracking-wide text-base-content/70">Ingredients</h4>
                                                        </CoreItem>
                                                        <CoreItem>
                                                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                                                {recipe.ingredients.map((ri) => (
                                                                    <li key={ri.id}>
                                                                        {ri.quantity} {ri.uom} {ri.ingredient.name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CoreItem>
                                                    </CoreStack>
                                                </CoreItem>

                                                {recipe.nutritionFacts && (
                                                    <CoreItem>
                                                        <CoreStack spacing={1}>
                                                            <CoreItem>
                                                                <h4 className="font-semibold text-xs uppercase tracking-wide text-base-content/70">Nutrition Facts</h4>
                                                            </CoreItem>
                                                            <CoreItem>
                                                                <CoreStack row spacing={3} wrap>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Calories:</span> {recipe.nutritionFacts.calories}
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Protein:</span> {recipe.nutritionFacts.protein}g
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Carbs:</span> {recipe.nutritionFacts.carbs}g
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Fat:</span> {recipe.nutritionFacts.fats}g
                                                                    </CoreItem>
                                                                </CoreStack>
                                                            </CoreItem>
                                                        </CoreStack>
                                                    </CoreItem>
                                                )}
                                            </CoreStack>
                                        </div>
                                    </CoreItem>
                                ))}
                            </CoreStack>
                        )}
                    </CoreStack>
                </CoreItem>
            </CoreStack>
        </CorePage>
    );
}