import type { Ingredient } from "./api/meals";

/**
 * One-shot bridge so meal/ingredient (opened from meal/recipe) can hand the
 * saved ingredient back to the still-mounted recipe form. Settings never needs
 * this; recipe → ingredient create does.
 */
type Listener = (ingredient: Ingredient) => void;

let listener: Listener | null = null;

export function setIngredientCreatedListener(next: Listener | null): void {
  listener = next;
}

export function notifyIngredientCreated(ingredient: Ingredient): void {
  listener?.(ingredient);
}
