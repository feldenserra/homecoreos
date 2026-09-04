import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { ErrorText, MetaLabel } from "../ui";
import {
  createIngredient,
  updateIngredient,
  type Ingredient,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
} from "../../theme/tokens";

type Props = {
  visible: boolean;
  /** When set, the form edits this ingredient; otherwise creates. */
  ingredient?: Ingredient | null;
  /** Prefill name when creating (e.g. from recipe search query). */
  initialName?: string;
  /** Raise above a parent recipe modal when nested. */
  elevated?: boolean;
  onDismiss: () => void;
  onSaved: (ingredient: Ingredient) => void;
};

/**
 * Shared create/edit sheet for ingredients (name, serving g, macros).
 * Remounts form body via key when opened so fields reset without effects.
 */
export function IngredientFormModal({
  visible,
  ingredient,
  initialName = "",
  elevated = false,
  onDismiss,
  onSaved,
}: Props) {
  const formKey = ingredient
    ? `edit-${ingredient.id}`
    : `new-${initialName}-${visible ? "open" : "closed"}`;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.sheet,
          elevated && styles.sheetElevated,
        ]}
        style={elevated ? styles.portalElevated : undefined}
      >
        {visible ? (
          <IngredientFormBody
            key={formKey}
            ingredient={ingredient ?? null}
            initialName={initialName}
            onDismiss={onDismiss}
            onSaved={onSaved}
          />
        ) : null}
      </Modal>
    </Portal>
  );
}

function IngredientFormBody({
  ingredient,
  initialName,
  onDismiss,
  onSaved,
}: {
  ingredient: Ingredient | null;
  initialName: string;
  onDismiss: () => void;
  onSaved: (ingredient: Ingredient) => void;
}) {
  const home = useHome();
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
        homeId: home.id,
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
    home.id,
    ingredient,
    name,
    onSaved,
    protein,
    serving,
  ]);

  return (
    <>
      <Text style={styles.sheetTitle}>
        {editing ? "Edit ingredient" : "New ingredient"}
      </Text>
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
    </>
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
  portalElevated: {
    zIndex: 100,
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
  sheetElevated: {
    zIndex: 101,
    elevation: 24,
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
