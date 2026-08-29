import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { KanbanBoard } from "../../../../../components/kanban/kanban-board";
import { isValidHomeId, normalizeHomeId } from "../../../../../lib/home-id";
import type { TaskStatus } from "../../../../../lib/types";
import { getHomeForMember, getTasksForHome } from "../../../actions";

export default async function HomeTasksPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId: raw } = await params;
  const homeId = normalizeHomeId(raw);
  if (!isValidHomeId(homeId)) {
    redirect("/app");
  }

  const [home, taskRows] = await Promise.all([
    getHomeForMember(session.user.id, homeId),
    getTasksForHome(session.user.id, homeId),
  ]);

  if (!home) {
    redirect("/app");
  }

  const initialTasks = taskRows.map((t) => ({
    id: t.id,
    homeId: t.homeId,
    title: t.title,
    description: t.description,
    status: t.status as TaskStatus,
    position: t.position,
  }));

  return (
    <main className="tasks-page">
      <KanbanBoard homeId={home.id} initialTasks={initialTasks} />
    </main>
  );
}
