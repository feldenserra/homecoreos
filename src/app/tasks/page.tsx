import { getTasks, getLifetimeCompletedCount } from '@/lib/repositories/tasksRepository';
import { AddTaskForm } from './AddTaskForm';
import { TaskList } from './TaskList';
import { Container, Title, Stack, Group, Paper, ThemeIcon, Box, Text } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const [tasks, count] = await Promise.all([
        getTasks(),
        getLifetimeCompletedCount()
    ]);

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={1}>My Tasks</Title>

                    <Paper withBorder p="xs" radius="md" bg="var(--mantine-color-blue-light)">
                        <Group gap="xs">
                            <ThemeIcon variant="light" color="blue" radius="xl">
                                <IconTrophy size={18} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" fw={700} tt="uppercase" c="blue.9">Lifetime Completed</Text>
                                <Text size="xl" fw={900} lh={1} c="blue.7">{count}</Text>
                            </Box>
                        </Group>
                    </Paper>
                </Group>

                <AddTaskForm />

                <TaskList initialTasks={tasks} />
            </Stack>
        </Container>
    );
}
