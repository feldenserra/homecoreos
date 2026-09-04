import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { KanbanBoard } from "../../../../../components/kanban/kanban-board";
import { SimpleTaskList } from "../../../../../components/kanban/simple-task-list";
import { ErrorText, LoadingScreen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import { listTasks, type Task } from "../../../../../lib/api/tasks";
import { useHome } from "../../../../../lib/home-context";
import { getTasksViewMode } from "../../../../../lib/tasks-view";
import { colors } from "../../../../../theme/tokens";

/** Replaces app/app/[homeId]/home/tasks/page.tsx. */
export default function TasksScreen() {
  const home = useHome();
  const state = useAsync<Task[]>(
    async () => await listTasks(home.id),
    [home.id],
  );
  const view = useAsync(
    async () => await getTasksViewMode(home.id),
    [home.id],
  );

  // Housemates change the board from their own devices, so re-read whenever
  // this tab comes forward. The view mode is a local preference and is
  // re-read so returning from settings picks up a change.
  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      void view.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
  );

  if ((state.loading && !state.data) || (view.loading && !view.data)) {
    return <LoadingScreen />;
  }

  const shared = {
    homeId: home.id,
    tasks: state.data ?? [],
    onTasksChange: (next: Task[]) => state.setData(next),
    onRefresh: state.refresh,
  };

  return (
    <View style={styles.screen}>
      <ErrorText>{state.error}</ErrorText>
      {view.data === "simple" ? (
        <SimpleTaskList {...shared} />
      ) : (
        <KanbanBoard {...shared} />
      )}
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
