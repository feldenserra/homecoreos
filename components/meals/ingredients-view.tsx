import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import {
  Card,
  ErrorText,
  LoadingScreen,
  Muted,
} from "../ui";
import { useAsync } from "../../hooks/use-async";
import {
  countIngredientRecipeUses,
  deleteIngredient,
  listIngredients,
  type Ingredient,
} from "../../lib/api/meals";
import { useHome } from "../../lib/home-context";
import { formatMacro } from "../../lib/recipe-nutrition";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  TOUCH_TARGET,
} from "../../theme/tokens";

type Props = {
  onEdit: (ingredient: Ingredient) => void;
  /** Bumps when the shell saves an ingredient so this list refreshes. */
  refreshKey?: number;
};

/**
 * Standalone ingredient manager: filter, edit, delete with usage warning.
 */
export function IngredientsView({ onEdit, refreshKey = 0 }: Props) {
  const home = useHome();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const state = useAsync(
    async () => await listIngredients(home.id),
    [home.id, refreshKey],
  );

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id, refreshKey]),
  );

  const flash = useCallback((message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(null), 2500);
  }, []);

  const filtered = useMemo(() => {
    const rows = state.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [filter, state.data]);

  const remove = useCallback(
    async (ingredient: Ingredient) => {
      setActionError(null);
      setBusyId(ingredient.id);
      try {
        await deleteIngredient({
          homeId: home.id,
          ingredientId: ingredient.id,
        });
        await state.refresh();
        flash("Ingredient deleted.");
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not delete ingredient.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [flash, home.id, state],
  );

  const confirmRemove = useCallback(
    async (ingredient: Ingredient) => {
      setActionError(null);
      let uses = 0;
      try {
        uses = await countIngredientRecipeUses({
          homeId: home.id,
          ingredientId: ingredient.id,
        });
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Could not check ingredient usage.",
        );
        return;
      }

      const warn =
        uses > 0
          ? `"${ingredient.name}" is used in ${uses} recipe${uses === 1 ? "" : "s"} and will be removed from them. Delete anyway?`
          : `Delete "${ingredient.name}"?`;

      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        if (globalThis.confirm?.(warn)) {
          void remove(ingredient);
        }
        return;
      }
      Alert.alert("Delete ingredient?", warn, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void remove(ingredient),
        },
      ]);
    },
    [home.id, remove],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.filterWrap}>
        <TextInput
          mode="outlined"
          dense
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter ingredients"
          style={styles.filter}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorText>{state.error ?? actionError}</ErrorText>
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {filtered.length === 0 ? (
          <Muted>
            {(state.data ?? []).length === 0
              ? "No ingredients yet. Tap + to add one."
              : "No ingredients match that filter."}
          </Muted>
        ) : (
          filtered.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              busy={busyId === ingredient.id}
              onEdit={() => onEdit(ingredient)}
              onDelete={() => void confirmRemove(ingredient)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function asMacroNumber(value: string | null | undefined): number {
  if (value == null || value === "") {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function IngredientCard({
  ingredient,
  busy,
  onEdit,
  onDelete,
}: {
  ingredient: Ingredient;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const servingGrams = asMacroNumber(ingredient.servingSizeGrams);
  const serving =
    ingredient.servingSizeGrams != null && ingredient.servingSizeGrams !== ""
      ? `${formatMacro(servingGrams, "grams")} g serving`
      : null;

  return (
    <Card style={[styles.card, busy && styles.cardBusy]}>
      <View style={styles.cardHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${ingredient.name}`}
          onPress={onEdit}
          style={styles.cardTitleWrap}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {ingredient.name}
          </Text>
          {serving ? <Text style={styles.serving}>{serving}</Text> : null}
          <Text style={styles.macros}>
            {formatMacro(asMacroNumber(ingredient.calories), "calories")} cal ·
            C {formatMacro(asMacroNumber(ingredient.carbsGrams), "grams")} · F{" "}
            {formatMacro(asMacroNumber(ingredient.fatsGrams), "grams")} · P{" "}
            {formatMacro(asMacroNumber(ingredient.proteinGrams), "grams")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${ingredient.name}`}
          disabled={busy}
          onPress={onDelete}
          hitSlop={8}
          style={styles.deleteBtn}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  filterWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filter: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  status: {
    color: colors.clay,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    gap: 4,
  },
  cardBusy: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  serving: {
    color: colors.muted,
    fontSize: 12,
  },
  macros: {
    color: colors.muted,
    fontSize: 13,
  },
  deleteBtn: {
    minWidth: TOUCH_TARGET * 0.8,
    minHeight: TOUCH_TARGET * 0.8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
});
