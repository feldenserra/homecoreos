import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { MealsSubnav } from "../../../../../../components/meals/meals-subnav";
import { WeekNav } from "../../../../../../components/meals/week-nav";
import { ErrorText, LoadingScreen, Muted } from "../../../../../../components/ui";
import { useAsync } from "../../../../../../hooks/use-async";
import {
  addGroceryItem,
  deleteGroceryItem,
  listGroceryItems,
  setGroceryCompleted,
  type GroceryItem,
} from "../../../../../../lib/api/meals";
import { useHome } from "../../../../../../lib/home-context";
import { mondayOf } from "../../../../../../lib/week";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  TOUCH_TARGET,
} from "../../../../../../theme/tokens";

/**
 * Weekly grocery list. Items are partitioned by Monday week_start_date;
 * checked rows move into an expandable Completed section.
 */
export default function MealsGroceryScreen() {
  const home = useHome();
  const [weekStart, setWeekStart] = useState(() => mondayOf());
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [pendingAdd, setPendingAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  const state = useAsync(
    async () => await listGroceryItems(home.id, weekStart),
    [home.id, weekStart],
  );

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id, weekStart]),
  );

  const { active, completed } = useMemo(() => {
    const rows = state.data ?? [];
    return {
      active: rows.filter((row) => !row.isCompleted),
      completed: rows.filter((row) => row.isCompleted),
    };
  }, [state.data]);

  const add = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setError(null);
    setPendingAdd(true);
    try {
      const item = await addGroceryItem({
        homeId: home.id,
        name: trimmed,
        weekStartDate: weekStart,
      });
      state.setData([...(state.data ?? []), item]);
      setTitle("");
      setComposing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setPendingAdd(false);
    }
  }, [home.id, state, title, weekStart]);

  const toggle = useCallback(
    async (item: GroceryItem) => {
      const nextCompleted = !item.isCompleted;
      const previous = state.data ?? [];
      setError(null);
      setBusyId(item.id);
      state.setData(
        previous.map((row) =>
          row.id === item.id ? { ...row, isCompleted: nextCompleted } : row,
        ),
      );
      if (nextCompleted) {
        setCompletedOpen(true);
      }
      try {
        await setGroceryCompleted({
          homeId: home.id,
          itemId: item.id,
          isCompleted: nextCompleted,
        });
      } catch (err) {
        state.setData(previous);
        setError(
          err instanceof Error ? err.message : "Could not update item.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [home.id, state],
  );

  const remove = useCallback(
    async (item: GroceryItem) => {
      const previous = state.data ?? [];
      setError(null);
      setBusyId(item.id);
      state.setData(previous.filter((row) => row.id !== item.id));
      try {
        await deleteGroceryItem({ homeId: home.id, itemId: item.id });
      } catch (err) {
        state.setData(previous);
        setError(
          err instanceof Error ? err.message : "Could not delete item.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [home.id, state],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.root}>
      <MealsSubnav active="grocery" />
      <WeekNav weekStart={weekStart} onChange={setWeekStart} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        <ErrorText>{state.error ?? error}</ErrorText>

        {composing ? (
          <View style={styles.composeCard}>
            <TextInput
              mode="outlined"
              dense
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="Milk, eggs…"
              maxLength={120}
              onSubmitEditing={() => void add()}
              style={styles.composeInput}
            />
            <View style={styles.composeActions}>
              <Button
                mode="text"
                textColor={colors.muted}
                disabled={pendingAdd}
                onPress={() => {
                  setComposing(false);
                  setTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                mode="text"
                textColor={colors.clay}
                loading={pendingAdd}
                disabled={pendingAdd || !title.trim()}
                onPress={() => void add()}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add grocery item"
            onPress={() => setComposing(true)}
            style={({ pressed }) => [
              styles.addTrigger,
              pressed && styles.addTriggerPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.muted}
            />
            <Text style={styles.addTriggerLabel}>Add item</Text>
          </Pressable>
        )}

        {active.length === 0 && !composing ? (
          <Muted>Nothing on the list for this week.</Muted>
        ) : (
          active.map((item) => (
            <GroceryRow
              key={item.id}
              item={item}
              done={false}
              busy={busyId === item.id}
              onToggle={() => void toggle(item)}
              onDelete={() => void remove(item)}
            />
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: completedOpen }}
          onPress={() => setCompletedOpen((open) => !open)}
          style={({ pressed }) => [
            styles.completedToggle,
            pressed && styles.completedTogglePressed,
          ]}
        >
          <MaterialCommunityIcons
            name={completedOpen ? "chevron-down" : "chevron-right"}
            size={20}
            color={colors.muted}
          />
          <Text style={styles.completedToggleLabel}>
            Completed ({completed.length})
          </Text>
        </Pressable>

        {completedOpen
          ? completed.map((item) => (
              <GroceryRow
                key={item.id}
                item={item}
                done
                busy={busyId === item.id}
                onToggle={() => void toggle(item)}
                onDelete={() => void remove(item)}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

function GroceryRow({
  item,
  done,
  busy,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  done: boolean;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.row, done && styles.rowDone, busy && styles.rowBusy]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: busy }}
        disabled={busy}
        onPress={onToggle}
        style={styles.rowMain}
      >
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done ? (
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={colors.muted}
            />
          ) : null}
        </View>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={3}>
          {item.name}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  list: { flex: 1 },
  listContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  addTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 12,
    opacity: 0.55,
  },
  addTriggerPressed: {
    opacity: 0.35,
  },
  addTriggerLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  composeCard: {
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  composeInput: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  composeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: TOUCH_TARGET,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowDone: {
    backgroundColor: colors.paper2,
    opacity: 0.75,
  },
  rowBusy: {
    opacity: 0.55,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxDone: {
    borderColor: colors.muted,
    backgroundColor: colors.paper2,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  titleDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  deleteBtn: {
    minWidth: TOUCH_TARGET * 0.8,
    minHeight: TOUCH_TARGET * 0.8,
    alignItems: "center",
    justifyContent: "center",
  },
  completedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: TOUCH_TARGET,
    marginTop: 8,
  },
  completedTogglePressed: {
    opacity: 0.7,
  },
  completedToggleLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
