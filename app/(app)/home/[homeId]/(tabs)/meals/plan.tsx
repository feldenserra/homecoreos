import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Legacy `/meals/plan` → shell with `?tab=plan`.
 */
export default function MealsPlanRedirect() {
  const params = useLocalSearchParams<{ homeId: string | string[] }>();
  const homeId = Array.isArray(params.homeId)
    ? params.homeId[0]
    : params.homeId;
  return <Redirect href={`/home/${homeId}/meals?tab=plan`} />;
}
