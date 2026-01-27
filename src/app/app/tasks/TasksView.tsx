'use client';

import { useState } from 'react';
import {
    Container,
    Title,
    Group,
    Paper,
    ThemeIcon,
    Box,
    Text,
    Tabs,
    ScrollArea,
    Stack
} from '@mantine/core';
import { IconTrophy, IconListCheck, IconCheck } from '@tabler/icons-react';
import { Task } from '@/lib/repositories/tasksRepository';
import { AddTaskForm } from './AddTaskForm';
import { TaskList } from './TaskList';

interface TasksViewProps {
    initialTasks: Task[];
    lifetimeCount: number;
}

export function TasksView({ initialTasks, lifetimeCount }: TasksViewProps) {
    const [activeTab, setActiveTab] = useState<string | null>('todo');

    return (
        <Container size="xl" py="xl" h="calc(100vh - 80px)">
            <Stack h="100%" gap="md">
                {/* Fixed Header */}
                <Group justify="space-between" align="center">
                    <Group>
                        <IconListCheck size={32} />
                        <Title order={1}>My Tasks</Title>
                    </Group>

                    <Paper withBorder p="xs" radius="md" bg="var(--mantine-color-blue-light)">
                        <Group gap="xs">
                            <ThemeIcon variant="light" color="blue" radius="xl">
                                <IconTrophy size={18} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" fw={700} tt="uppercase" c="blue">Lifetime Completed</Text>
                                <Text size="xl" fw={900} lh={1} c="blue">{lifetimeCount}</Text>
                            </Box>
                        </Group>
                    </Paper>
                </Group>

                {/* Tabs with independent scrolling panels */}
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    variant="outline"
                    radius="md"
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    <Tabs.List mb="md" style={{ flexShrink: 0 }}>
                        <Tabs.Tab value="todo" leftSection={<IconListCheck size={16} />}>
                            To Do
                        </Tabs.Tab>
                        <Tabs.Tab value="completed" leftSection={<IconCheck size={16} />}>
                            Completed
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="todo" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <AddTaskForm />
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                <Stack gap="lg">
                                    <TaskList initialTasks={initialTasks} filter="incomplete" />
                                </Stack>
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="completed" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                <TaskList initialTasks={initialTasks} filter="completed" />
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
