import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { ErrorText, MetaLabel } from "../ui";
import {
  createIngredient,
  updateIngredient,
  type Ingredient,
} from "../../lib/api/meals";
import { colors, INPUT_FONT_SIZE } from "../../theme/tokens";

type Props = {
  homeId: string;
  /** When set, the form edits this ingredient; otherwise creates. */
  ingredient?: Ingredient | null;
  /** Prefill name when creating (e.g. from recipe search query). */
  initialName?: string;
  onDismiss: () => void;
  onSaved: (ingredient: Ingredient) => void;
};

/**
 * Ingredient create/edit form body for the meal/ingredient modal route.
 */
export function IngredientForm({
  homeId,
  ingredient = null,
  initialName = "",
  onDismiss,
  onSaved,
}: Props) {
  const editing = Boolean(ingredient);
  const [name, setName] = useState(ingredient?.name ?? initialName);
  const [serving, setServing] = useState(ingredient?.servingSizeGrams ?? "");
  const [calories, setCalories] = useState(ingredient?.calories ?? "");
  const [carbs, setCarbs] = useState(ingredient?.carbsGrams ?? "");
  const [fats, setFats] = useState(ingredient?.fatsGrams ?? "");
  const [protein, setProtein] = useState(ingredient?.proteinGrams ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the ingredient a name.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const payload = {
        homeId,
        name: trimmed,
        servingSizeGrams: serving || null,
        calories: calories || null,
        carbsGrams: carbs || null,
        fatsGrams: fats || null,
        proteinGrams: protein || null,
      };
      const saved = ingredient
        ? await updateIngredient({
            ...payload,
            ingredientId: ingredient.id,
          })
        : await createIngredient(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save ingredient.",
      );
    } finally {
      setPending(false);
    }
  }, [
    calories,
    carbs,
    fats,
    homeId,
    ingredient,
    name,
    onSaved,
    protein,
    serving,
  ]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scroll}
    >
      <MetaLabel>Name</MetaLabel>
      <TextInput
        mode="outlined"
        dense
        value={name}
        onChangeText={setName}
        maxLength={80}
        style={styles.input}
      />
      <MetaLabel>Serving size (g, optional)</MetaLabel>
      <TextInput
        mode="outlined"
        dense
        value={serving}
        onChangeText={setServing}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <View style={styles.macroGrid}>
        <MacroField label="Calories" value={calories} onChange={setCalories} />
        <MacroField label="Carbs g" value={carbs} onChange={setCarbs} />
        <MacroField label="Fats g" value={fats} onChange={setFats} />
        <MacroField label="Protein g" value={protein} onChange={setProtein} />
      </View>
      <ErrorText>{error}</ErrorText>
      <Button
        mode="contained"
        loading={pending}
        disabled={pending || !name.trim()}
        onPress={() => void save()}
      >
        {editing ? "Save changes" : "Add ingredient"}
      </Button>
      <Button mode="text" onPress={onDismiss}>
        Cancel
      </Button>
    </ScrollView>
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
  scroll: {
    padding: 20,
    gap: 10,
    paddingBottom: 40,
  },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
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
