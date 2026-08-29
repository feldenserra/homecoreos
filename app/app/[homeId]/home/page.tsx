import { Group, Stack, Text, Title } from "@mantine/core";
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

  return (
    <main className="app-shell dashboard-page">
      <Stack gap="xl" maw={720} mx="auto" w="100%" px="md" py="xl">
        <Stack gap={8}>
          <Text
            size="xs"
            tt="uppercase"
            fw={600}
            lts={1.2}
            c="dimmed"
            className="brand-mark"
          >
            Welcome back
          </Text>
          <Title order={1} fz={{ base: 32, sm: 40 }} fw={650} lh={1.1}>
            Hey {firstName}
          </Title>
          <Text size="md" c="dimmed" maw={420}>
            {home.name} is ready. Pick a place to start.
          </Text>
        </Stack>

        <div className="dashboard-tiles">
          <Link
            href={`/app/${home.id}/home/tasks`}
            className="dashboard-tile dashboard-tile--tasks"
          >
            <Text size="xs" fw={600} tt="uppercase" lts={0.8} c="dimmed">
              Board
            </Text>
            <Text fw={650} fz={22} mt={6}>
              Tasks
            </Text>
            <Text size="sm" c="dimmed" mt={8}>
              {openCount === 0
                ? "Nothing open — add something when you’re ready."
                : `${openCount} open · ${counts.complete} done`}
            </Text>
            <Group gap={8} mt="md">
              <span className="dashboard-pill">
                {counts.in_progress} in progress
              </span>
              {counts.stuck > 0 ? (
                <span className="dashboard-pill dashboard-pill--warn">
                  {counts.stuck} stuck
                </span>
              ) : null}
            </Group>
          </Link>

          <Link
            href={`/app/${home.id}/home/chat`}
            className="dashboard-tile dashboard-tile--chat"
          >
            <Text size="xs" fw={600} tt="uppercase" lts={0.8} c="dimmed">
              Assistant
            </Text>
            <Text fw={650} fz={22} mt={6}>
              Chat
            </Text>
            <Text size="sm" c="dimmed" mt={8}>
              Ask anything about the house — lists, ideas, next steps.
            </Text>
          </Link>
        </div>
      </Stack>
    </main>
  );
}
