import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Legacy `/meals/create-recipe` → shell Recipes view (create via header +).
 */
export default function MealsCreateRecipeRedirect() {
  const params = useLocalSearchParams<{ homeId: string | string[] }>();
  const homeId = Array.isArray(params.homeId)
    ? params.homeId[0]
    : params.homeId;
  return (
    <Redirect href={`/home/${homeId}/meals?tab=meals&view=recipes`} />
  );
}
