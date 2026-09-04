import { Stack } from "expo-router";
import { navScreenOptions } from "../../../../../../theme/paper-theme";

/**
 * Meals is a single shell screen under the Meals tab. Grocery / Plan /
 * create-recipe file routes redirect into query params on index.
 */
export default function MealsLayout() {
  return (
    <Stack screenOptions={{ ...navScreenOptions, headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Meals" }} />
      <Stack.Screen name="grocery" options={{ headerShown: false }} />
      <Stack.Screen name="plan" options={{ headerShown: false }} />
      <Stack.Screen name="create-recipe" options={{ headerShown: false }} />
    </Stack>
  );
}
