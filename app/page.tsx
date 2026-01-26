import {
  Title, Text, Badge, Paper, Group, ThemeIcon, Box, Center,
  Stack
} from '@mantine/core';
import { IconCheck, IconInbox } from '@tabler/icons-react';
import * as taskRepo from './actions/tasks';

import NewTaskForm from './components/NewTaskForm';
import TaskItem from './components/TaskItem';
import FilterToggle from './components/FilterToggle';

export default async function Dashboard(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || 'active';
  const showCompleted = filter === 'done';

  const data = await taskRepo.getAll(showCompleted);
  const visibleTasks = data.tasks.filter(x => x.done === showCompleted);

  return (
    <Box>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* --- LEFT SIDEBAR (Controls) --- */}
        <div className="md:col-span-4 lg:col-span-3">
          <Stack gap="lg">

            <Paper p="lg" radius="lg">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                View
              </Text>
              <FilterToggle />
            </Paper>

            <Paper p="lg" radius="lg">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Add New
              </Text>
              <NewTaskForm />
            </Paper>

            <Paper p="lg" radius="lg">
              <Group justify="space-between" align="center">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Lifetime Tasks
                </Text>
                <ThemeIcon variant="light" color="gray" radius="xl">
                  <IconInbox size={16} />
                </ThemeIcon>
              </Group>
              <Group align="flex-end" gap="xs" mt="xs">
                <Text fw={700} size="xl" lh={1} style={{ fontSize: '2rem' }}>{data.total}</Text>
                <Text size="sm" c="dimmed" mb={4}>total</Text>
              </Group>
            </Paper>

          </Stack>
        </div>


        {/* --- MAIN CONTENT (Tasks) --- */}
        <div className="md:col-span-8 lg:col-span-9">

          <Group justify="space-between" align="flex-end" mb="xl">
            <Stack gap={0}>
              <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
                {showCompleted ? 'Archive' : 'My Tasks'}
              </Title>
              <Text c="dimmed">
                {showCompleted ? 'View your completed history' : `You have ${visibleTasks.length} pending items`}
              </Text>
            </Stack>
            <Badge size="lg" variant="light" color="gray" radius="md">
              {visibleTasks.length}
            </Badge>
          </Group>

          <Stack gap="sm">
            {visibleTasks.map((task) => (
              <Box key={task.id}>
                <TaskItem {...task} />
              </Box>
            ))}

            {visibleTasks.length === 0 && (
              <Paper withBorder p="xl" radius="lg" mt="xl" style={{ borderStyle: 'dashed' }}>
                <Center py="xl">
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                      <IconCheck size={30} />
                    </ThemeIcon>
                    <Title order={3} mt="sm">All caught up</Title>
                    <Text c="dimmed" ta="center" maw={300}>
                      {showCompleted
                        ? "No archived tasks found in your history."
                        : "You have no pending tasks. Enjoy your day!"}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Stack>

        </div>
      </div>
    </Box>
  );
}