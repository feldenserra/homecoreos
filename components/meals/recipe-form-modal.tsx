import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { ErrorText, MetaLabel, Muted } from "../ui";
import {
  createRecipe,
  searchIngredients,
  updateRecipe,
  type Ingredient,
  type RecipeWithIngredients,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import {
  aggregateNutrition,
  formatMacro,
} from "../../lib/recipe-nutrition";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
  TOUCH_TARGET,
} from "../../theme/tokens";
import { IngredientFormModal } from "./ingredient-form-modal";

type DraftLine = {
  key: string;
  ingredient: Ingredient;
  quantity: string;
};

type Props = {
  visible: boolean;
  /** When set, edits this recipe; otherwise creates. */
  recipe?: RecipeWithIngredients | null;
  onDismiss: () => void;
  onSaved: () => void;
};

/**
 * Paper modal for creating or editing a recipe with ingredient lines and
 * inline ingredient creation. Nested ingredient modal stacks above this one.
 */
export function RecipeFormModal({
  visible,
  recipe,
  onDismiss,
  onSaved,
}: Props) {
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const formKey = recipe
    ? `edit-${recipe.id}`
    : `new-${visible ? "open" : "closed"}`;
  const [activeFormKey, setActiveFormKey] = useState(formKey);
  if (activeFormKey !== formKey) {
    setActiveFormKey(formKey);
    if (ingredientOpen) {
      setIngredientOpen(false);
    }
  }

  const dismissRecipe = useCallback(() => {
    if (ingredientOpen) {
      return;
    }
    onDismiss();
  }, [ingredientOpen, onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={dismissRecipe}
        contentContainerStyle={styles.sheet}
        style={styles.portalRecipe}
      >
        {visible ? (
          <RecipeFormBody
            key={formKey}
            recipe={recipe ?? null}
            ingredientOpen={ingredientOpen}
            setIngredientOpen={setIngredientOpen}
            onDismiss={dismissRecipe}
            onSaved={onSaved}
          />
        ) : null}
      </Modal>
    </Portal>
  );
}

function RecipeFormBody({
  recipe,
  ingredientOpen,
  setIngredientOpen,
  onDismiss,
  onSaved,
}: {
  recipe: RecipeWithIngredients | null;
  ingredientOpen: boolean;
  setIngredientOpen: (open: boolean) => void;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const home = useHome();
  const editing = Boolean(recipe);
  const [name, setName] = useState(recipe?.name ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() =>
    (recipe?.recipe_ingredient ?? []).map((line) => ({
      key: line.id,
      ingredient: line.ingredient,
      quantity: String(line.quantity),
    })),
  );
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ingredientSeed, setIngredientSeed] = useState("");

  useEffect(() => {
    let active = true;
    const handle = setTimeout(() => {
      setSearching(true);
      void searchIngredients(home.id, query)
        .then((rows) => {
          if (active) {
            setMatches(rows);
          }
        })
        .catch((err) => {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not search ingredients.",
            );
          }
        })
        .finally(() => {
          if (active) {
            setSearching(false);
          }
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [home.id, query]);

  const nutrition = useMemo(
    () =>
      aggregateNutrition(
        lines.map((line) => ({
          quantity: Number(line.quantity) || 0,
          calories: line.ingredient.calories,
          carbsGrams: line.ingredient.carbsGrams,
          fatsGrams: line.ingredient.fatsGrams,
          proteinGrams: line.ingredient.proteinGrams,
        })),
      ),
    [lines],
  );

  const addLine = useCallback((ingredient: Ingredient) => {
    setLines((current) => {
      if (current.some((line) => line.ingredient.id === ingredient.id)) {
        return current;
      }
      return [
        ...current,
        {
          key: `${ingredient.id}-${Date.now()}`,
          ingredient,
          quantity: "1",
        },
      ];
    });
    setQuery("");
  }, []);

  const openCreateIngredient = useCallback(() => {
    setIngredientSeed(query.trim());
    setIngredientOpen(true);
  }, [query, setIngredientOpen]);

  const handleIngredientSaved = useCallback(
    (ingredient: Ingredient) => {
      setIngredientOpen(false);
      addLine(ingredient);
    },
    [addLine, setIngredientOpen],
  );

  const saveRecipe = useCallback(async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the recipe a name.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one ingredient.");
      return;
    }
    for (const line of lines) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        setError(`Quantity for ${line.ingredient.name} must be greater than 0.`);
        return;
      }
    }

    const payload = {
      homeId: home.id,
      name: trimmed,
      lines: lines.map((line) => ({
        ingredientId: line.ingredient.id,
        quantity: Number(line.quantity),
      })),
    };

    setPending(true);
    try {
      if (recipe) {
        await updateRecipe({ ...payload, recipeId: recipe.id });
      } else {
        await createRecipe(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recipe.");
    } finally {
      setPending(false);
    }
  }, [home.id, lines, name, onSaved, recipe]);

  const usedIds = useMemo(
    () => new Set(lines.map((line) => line.ingredient.id)),
    [lines],
  );
  const filteredMatches = matches.filter((row) => !usedIds.has(row.id));

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.sheetTitle}>
          {editing ? "Edit recipe" : "New recipe"}
        </Text>

        <MetaLabel>Recipe name</MetaLabel>
        <TextInput
          mode="outlined"
          dense
          value={name}
          onChangeText={setName}
          placeholder="Overnight oats"
          maxLength={120}
          style={styles.input}
        />

        <MetaLabel>Ingredients</MetaLabel>
        {lines.length === 0 ? (
          <Muted>Search below to add ingredients.</Muted>
        ) : (
          lines.map((line) => (
            <View key={line.key} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={2}>
                {line.ingredient.name}
              </Text>
              <TextInput
                mode="outlined"
                dense
                value={line.quantity}
                onChangeText={(value) =>
                  setLines((current) =>
                    current.map((entry) =>
                      entry.key === line.key
                        ? { ...entry, quantity: value }
                        : entry,
                    ),
                  )
                }
                keyboardType="decimal-pad"
                style={styles.qtyInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${line.ingredient.name}`}
                onPress={() =>
                  setLines((current) =>
                    current.filter((entry) => entry.key !== line.key),
                  )
                }
                style={styles.removeBtn}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          ))
        )}

        <Text style={styles.preview}>
          {formatMacro(nutrition.calories, "calories")} cal · C{" "}
          {formatMacro(nutrition.carbsGrams, "grams")} · F{" "}
          {formatMacro(nutrition.fatsGrams, "grams")} · P{" "}
          {formatMacro(nutrition.proteinGrams, "grams")}
        </Text>

        <MetaLabel>Add ingredient</MetaLabel>
        <TextInput
          mode="outlined"
          dense
          value={query}
          onChangeText={setQuery}
          placeholder="Search this home’s ingredients"
          style={styles.input}
        />

        {query.trim() ? (
          <View style={styles.matches}>
            {searching ? <Muted>Searching…</Muted> : null}
            {filteredMatches.map((ingredient) => (
              <Pressable
                key={ingredient.id}
                accessibilityRole="button"
                onPress={() => addLine(ingredient)}
                style={({ pressed }) => [
                  styles.matchRow,
                  pressed && styles.matchRowPressed,
                ]}
              >
                <Text style={styles.matchName}>{ingredient.name}</Text>
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={colors.clay}
                />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={openCreateIngredient}
              style={({ pressed }) => [
                styles.createRow,
                pressed && styles.matchRowPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="flask-plus-outline"
                size={18}
                color={colors.clay}
              />
              <Text style={styles.createLabel}>
                Create “{query.trim()}”
              </Text>
            </Pressable>
          </View>
        ) : null}

        <ErrorText>{error}</ErrorText>

        <Button
          mode="contained"
          loading={pending}
          disabled={pending}
          onPress={() => void saveRecipe()}
        >
          {editing ? "Save changes" : "Save recipe"}
        </Button>
        <Button mode="text" onPress={onDismiss}>
          Cancel
        </Button>
      </ScrollView>

      <IngredientFormModal
        visible={ingredientOpen}
        initialName={ingredientSeed}
        elevated
        onDismiss={() => setIngredientOpen(false)}
        onSaved={handleIngredientSaved}
      />
    </>
  );
}

const styles = StyleSheet.create({
  portalRecipe: {
    zIndex: 50,
  },
  sheet: {
    marginHorizontal: 16,
    maxHeight: "92%",
    padding: 0,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadowLift,
  },
  scroll: {
    padding: 20,
    gap: 10,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lineName: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  qtyInput: {
    width: 72,
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  removeBtn: {
    minWidth: TOUCH_TARGET * 0.7,
    minHeight: TOUCH_TARGET * 0.7,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  matches: {
    gap: 6,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  matchRowPressed: {
    backgroundColor: colors.paper2,
  },
  matchName: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.claySoft,
    borderWidth: 1,
    borderColor: colors.clay,
  },
  createLabel: {
    flex: 1,
    color: colors.clay,
    fontSize: 14,
    fontWeight: "700",
  },
});
