import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { KanbanBoard } from "../../../../../components/kanban/kanban-board";
import { ErrorText, LoadingScreen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import { listTasks, type Task } from "../../../../../lib/api/tasks";
import { useHome } from "../../../../../lib/home-context";
import { colors } from "../../../../../theme/tokens";

/** Replaces app/app/[homeId]/home/tasks/page.tsx. */
export default function TasksScreen() {
  const home = useHome();
  const state = useAsync<Task[]>(
    async () => await listTasks(home.id),
    [home.id],
  );

  // Housemates change the board from their own devices, so re-read whenever
  // this tab comes forward. There is no Realtime subscription; the web app had
  // no live updates either.
  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <ErrorText>{state.error}</ErrorText>
      <KanbanBoard
        homeId={home.id}
        tasks={state.data ?? []}
        onTasksChange={(next) => state.setData(next)}
        onRefresh={state.refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 12,
    backgroundColor: colors.paper,
  },
});
