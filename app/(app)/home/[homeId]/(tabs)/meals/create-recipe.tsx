import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import {
  Card,
  ErrorText,
  MetaLabel,
  Muted,
  Screen,
} from "../../../../../../components/ui";
import {
  createIngredient,
  createRecipe,
  searchIngredients,
  type Ingredient,
} from "../../../../../../lib/api/meals";
import { useHome } from "../../../../../../lib/home-context";
import {
  aggregateNutrition,
  formatMacro,
} from "../../../../../../lib/recipe-nutrition";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
  TOUCH_TARGET,
} from "../../../../../../theme/tokens";

type DraftLine = {
  key: string;
  ingredient: Ingredient;
  quantity: string;
};

/**
 * Step-by-step recipe form: name, then home-scoped ingredient search with
 * inline creation, quantity multipliers, and a live nutrition preview.
 */
export default function CreateRecipeScreen() {
  const home = useHome();
  const [name, setName] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newServing, setNewServing] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [creatingIngredient, setCreatingIngredient] = useState(false);

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
    setNewName(query.trim());
    setNewServing("");
    setNewCalories("");
    setNewCarbs("");
    setNewFats("");
    setNewProtein("");
    setCreateOpen(true);
  }, [query]);

  const saveIngredient = useCallback(async () => {
    setError(null);
    setCreatingIngredient(true);
    try {
      const ingredient = await createIngredient({
        homeId: home.id,
        name: newName,
        servingSizeGrams: newServing || null,
        calories: newCalories || null,
        carbsGrams: newCarbs || null,
        fatsGrams: newFats || null,
        proteinGrams: newProtein || null,
      });
      setCreateOpen(false);
      addLine(ingredient);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create ingredient.",
      );
    } finally {
      setCreatingIngredient(false);
    }
  }, [
    addLine,
    home.id,
    newCalories,
    newCarbs,
    newFats,
    newName,
    newProtein,
    newServing,
  ]);

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

    setPending(true);
    try {
      await createRecipe({
        homeId: home.id,
        name: trimmed,
        lines: lines.map((line) => ({
          ingredientId: line.ingredient.id,
          quantity: Number(line.quantity),
        })),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recipe.");
    } finally {
      setPending(false);
    }
  }, [home.id, lines, name]);

  const usedIds = useMemo(
    () => new Set(lines.map((line) => line.ingredient.id)),
    [lines],
  );
  const filteredMatches = matches.filter((row) => !usedIds.has(row.id));

  return (
    <Screen scroll style={styles.screen}>
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

      <Card>
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
      </Card>

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
        Save recipe
      </Button>

      <Portal>
        <Modal
          visible={createOpen}
          onDismiss={() => setCreateOpen(false)}
          contentContainerStyle={styles.sheet}
        >
          <Text style={styles.sheetTitle}>New ingredient</Text>
          <MetaLabel>Name</MetaLabel>
          <TextInput
            mode="outlined"
            dense
            value={newName}
            onChangeText={setNewName}
            maxLength={80}
            style={styles.input}
          />
          <MetaLabel>Serving size (g, optional)</MetaLabel>
          <TextInput
            mode="outlined"
            dense
            value={newServing}
            onChangeText={setNewServing}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <View style={styles.macroGrid}>
            <MacroField label="Calories" value={newCalories} onChange={setNewCalories} />
            <MacroField label="Carbs g" value={newCarbs} onChange={setNewCarbs} />
            <MacroField label="Fats g" value={newFats} onChange={setNewFats} />
            <MacroField
              label="Protein g"
              value={newProtein}
              onChange={setNewProtein}
            />
          </View>
          <ErrorText>{error}</ErrorText>
          <Button
            mode="contained"
            loading={creatingIngredient}
            disabled={creatingIngredient || !newName.trim()}
            onPress={() => void saveIngredient()}
          >
            Add ingredient
          </Button>
          <Button mode="text" onPress={() => setCreateOpen(false)}>
            Cancel
          </Button>
        </Modal>
      </Portal>
    </Screen>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.macroField}>
      <MetaLabel>{label}</MetaLabel>
      <TextInput
        mode="outlined"
        dense
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 12,
    paddingBottom: 40,
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
  sheet: {
    marginHorizontal: 20,
    maxHeight: "90%",
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: 10,
    ...shadowLift,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  macroField: {
    width: "47%",
    gap: 4,
  },
});
