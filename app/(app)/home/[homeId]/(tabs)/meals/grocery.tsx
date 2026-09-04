import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Legacy `/meals/grocery` → shell with `?tab=grocery`.
 */
export default function MealsGroceryRedirect() {
  const params = useLocalSearchParams<{ homeId: string | string[] }>();
  const homeId = Array.isArray(params.homeId)
    ? params.homeId[0]
    : params.homeId;
  return <Redirect href={`/home/${homeId}/meals?tab=grocery`} />;
}
