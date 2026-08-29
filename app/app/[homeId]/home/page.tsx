import { Stack, Text, Title } from "@mantine/core";
import { IconLayoutKanban, IconMessage } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { isValidHomeId, normalizeHomeId } from "../../../../lib/home-id";
import type { TaskStatus } from "../../../../lib/types";
import { getHomeForMember, getTasksForHome } from "../../actions";

export default async function HomeDashboardPage({
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

  const counts: Record<TaskStatus, number> = {
    not_started: 0,
    in_progress: 0,
    stuck: 0,
    complete: 0,
  };
  for (const t of taskRows) {
    const status = t.status as TaskStatus;
    if (status in counts) {
      counts[status] += 1;
    }
  }
  const openCount =
    counts.not_started + counts.in_progress + counts.stuck;

  const firstName =
    session.user.name?.split(/\s+/)[0] ??
    session.user.email?.split("@")[0] ??
    "there";

  const snapshot =
    openCount === 0
      ? "Nothing open"
      : counts.stuck > 0
        ? `${openCount} open · ${counts.stuck} stuck`
        : `${openCount} open`;

  const taskMeta =
    openCount === 0
      ? "Nothing open"
      : `${openCount} open · ${counts.complete} done`;

  return (
    <main className="dashboard-page">
      <Stack gap="xl" maw={720} mx="auto" w="100%">
        <Stack gap={8}>
          <Title
            order={1}
            className="display-title"
            fz={{ base: 34, sm: 42 }}
            fw={550}
            lh={1.1}
          >
            Hey {firstName}
          </Title>
          <Text size="md" c="dimmed">
            {snapshot}
          </Text>
        </Stack>

        <div className="app-grid">
          <Link href={`/app/${home.id}/home/tasks`} className="app-tile">
            <span className="app-tile-icon">
              <IconLayoutKanban size={22} stroke={1.7} />
            </span>
            <span className="app-tile-name">Tasks</span>
            <span className="app-tile-meta">{taskMeta}</span>
          </Link>

          <Link href={`/app/${home.id}/home/chat`} className="app-tile">
            <span className="app-tile-icon">
              <IconMessage size={22} stroke={1.7} />
            </span>
            <span className="app-tile-name">Chat</span>
            <span className="app-tile-meta">Ask the house</span>
          </Link>
        </div>
      </Stack>
    </main>
  );
}
