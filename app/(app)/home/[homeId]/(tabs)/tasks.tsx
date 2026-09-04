import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { KanbanBoard } from "../../../../../components/kanban/kanban-board";
import { SimpleTaskList } from "../../../../../components/kanban/simple-task-list";
import { ErrorText, LoadingScreen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import {
  listKanbanTasks,
  listOpenTasks,
  type Task,
} from "../../../../../lib/api/tasks";
import { useHome } from "../../../../../lib/home-context";
import {
  getTasksViewMode,
  type TasksViewMode,
} from "../../../../../lib/tasks-view";
import { colors } from "../../../../../theme/tokens";

/** Replaces app/app/[homeId]/home/tasks/page.tsx. */
export default function TasksScreen() {
  const home = useHome();
  const view = useAsync(
    async () => await getTasksViewMode(home.id),
    [home.id],
  );

  useFocusEffect(
    useCallback(() => {
      void view.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
  );

  // Do not mount the board until view mode is known — otherwise the tasks
  // loader used to resolve [] and freeze kanban pageState.hasMore as false.
  if (view.data === null) {
    return <LoadingScreen />;
  }

  return <TasksForView homeId={home.id} viewMode={view.data} />;
}

function TasksForView({
  homeId,
  viewMode,
}: {
  homeId: string;
  viewMode: TasksViewMode;
}) {
  const state = useAsync<Task[]>(
    async () => {
      if (viewMode === "simple") {
        return await listOpenTasks(homeId);
      }
      return await listKanbanTasks(homeId);
    },
    [homeId, viewMode],
  );

  // Housemates change the board from their own devices, so re-read whenever
  // this tab comes forward.
  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeId, viewMode]),
  );

  if (state.data === null) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.screen}>
      <ErrorText>{state.error}</ErrorText>
      {viewMode === "simple" ? (
        <SimpleTaskList
          key={homeId}
          homeId={homeId}
          tasks={state.data}
          onTasksChange={(next) => state.setData(next)}
        />
      ) : (
        <KanbanBoard
          key={homeId}
          homeId={homeId}
          tasks={state.data}
          onTasksChange={(next) => state.setData(next)}
        />
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
