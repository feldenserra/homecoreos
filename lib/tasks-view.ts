import AsyncStorage from "@react-native-async-storage/async-storage";

export const TASKS_VIEW_MODES = ["simple", "advanced"] as const;
export type TasksViewMode = (typeof TASKS_VIEW_MODES)[number];

const DEFAULT_MODE: TasksViewMode = "advanced";

function storageKey(homeId: string): string {
  return `homecore:tasks-view:${homeId}`;
}

function isTasksViewMode(value: string): value is TasksViewMode {
  return (TASKS_VIEW_MODES as readonly string[]).includes(value);
}

/** Presentation preference for the Tasks app. Default is the kanban board. */
export async function getTasksViewMode(homeId: string): Promise<TasksViewMode> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(homeId));
    if (raw && isTasksViewMode(raw)) {
      return raw;
    }
  } catch {
    /* fall through to default */
  }
  return DEFAULT_MODE;
}

export async function setTasksViewMode(
  homeId: string,
  mode: TasksViewMode,
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(homeId), mode);
  } catch {
    /* non-fatal */
  }
}
