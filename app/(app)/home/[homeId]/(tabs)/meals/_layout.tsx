import { Stack } from "expo-router";
import { navScreenOptions } from "../../../../../../theme/paper-theme";

/**
 * Meals is a stack inside the Meals tab: Recipes / Grocery / Plan share the
 * tab bar, and create-recipe is a modal over Recipes.
 */
export default function MealsLayout() {
  return (
    <Stack screenOptions={{ ...navScreenOptions, headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Meals" }} />
      <Stack.Screen name="grocery" options={{ title: "Grocery" }} />
      <Stack.Screen name="plan" options={{ title: "Meal plan" }} />
      <Stack.Screen
        name="create-recipe"
        options={{ title: "New recipe", presentation: "modal" }}
      />
    </Stack>
  );
}
