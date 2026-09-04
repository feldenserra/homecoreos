/**
 * Client-side recipe nutrition. Totals are never stored on the recipe row —
 * each load sums ingredient macros × quantity (null/missing → 0).
 */

export type NutritionMacros = {
  calories: number;
  carbsGrams: number;
  fatsGrams: number;
  proteinGrams: number;
};

export type NutritionLine = {
  quantity: number;
  calories?: number | string | null;
  carbsGrams?: number | string | null;
  fatsGrams?: number | string | null;
  proteinGrams?: number | string | null;
};

function asNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") {
    return 0;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function emptyNutrition(): NutritionMacros {
  return { calories: 0, carbsGrams: 0, fatsGrams: 0, proteinGrams: 0 };
}

export function aggregateNutrition(
  lines: readonly NutritionLine[],
): NutritionMacros {
  const total = emptyNutrition();
  for (const line of lines) {
    const qty = asNumber(line.quantity);
    total.calories += asNumber(line.calories) * qty;
    total.carbsGrams += asNumber(line.carbsGrams) * qty;
    total.fatsGrams += asNumber(line.fatsGrams) * qty;
    total.proteinGrams += asNumber(line.proteinGrams) * qty;
  }
  return total;
}

/** Round for display: calories whole, macros one decimal. */
export function formatMacro(value: number, kind: "calories" | "grams"): string {
  if (kind === "calories") {
    return String(Math.round(value));
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
