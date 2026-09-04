import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GroceryView } from "../../../../../../components/meals/grocery-view";
import { IngredientsView } from "../../../../../../components/meals/ingredients-view";
import {
  MealsSubnav,
  type MealsTab,
} from "../../../../../../components/meals/meals-subnav";
import {
  MealsViewNav,
  type MealsView,
} from "../../../../../../components/meals/meals-view-nav";
import { PlanView } from "../../../../../../components/meals/plan-view";
import { RecipesView } from "../../../../../../components/meals/recipes-view";
import { useHome } from "../../../../../../lib/home-context";
import { mondayOf } from "../../../../../../lib/week";
import { colors, TOUCH_TARGET } from "../../../../../../theme/tokens";

function paramOne(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseTab(raw: string | undefined): MealsTab {
  if (raw === "grocery" || raw === "plan" || raw === "meals") {
    return raw;
  }
  if (raw === "recipes") {
    return "meals";
  }
  return "meals";
}

function parseView(raw: string | undefined): MealsView {
  if (raw === "ingredients" || raw === "recipes") {
    return raw;
  }
  return "recipes";
}

/**
 * Single Meals shell: top pills (Meals / Grocery / Plan) and secondary
 * Recipes | Ingredients stay mounted; views swap via query params.
 * Create/edit overlays are Expo Router modals under /meal/* (same as Settings).
 */
export default function MealsShellScreen() {
  const home = useHome();
  const router = useRouter();
  const params = useLocalSearchParams<{
    tab?: string | string[];
    view?: string | string[];
  }>();
  const tab = parseTab(paramOne(params.tab));
  const view = parseView(paramOne(params.view));

  const [weekStart, setWeekStart] = useState(() => mondayOf());

  const showHeaderPlus = tab === "meals";

  const onHeaderPlus = useCallback(() => {
    if (view === "ingredients") {
      router.push(`/home/${home.id}/meal/ingredient`);
    } else {
      router.push(`/home/${home.id}/meal/recipe`);
    }
  }, [home.id, router, view]);

  const headerRight = useMemo(() => {
    if (!showHeaderPlus) {
      return undefined;
    }
    return () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          view === "ingredients" ? "New ingredient" : "New recipe"
        }
        onPress={onHeaderPlus}
        style={styles.headerAction}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.muted} />
      </Pressable>
    );
  }, [onHeaderPlus, showHeaderPlus, view]);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: "Meals",
          headerRight,
        }}
      />

      <MealsSubnav active={tab} />
      {tab === "meals" ? <MealsViewNav active={view} /> : null}

      {tab === "meals" && view === "recipes" ? <RecipesView /> : null}
      {tab === "meals" && view === "ingredients" ? <IngredientsView /> : null}
      {tab === "grocery" ? (
        <GroceryView weekStart={weekStart} onWeekChange={setWeekStart} />
      ) : null}
      {tab === "plan" ? (
        <PlanView weekStart={weekStart} onWeekChange={setWeekStart} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerAction: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
