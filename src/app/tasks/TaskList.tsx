'use client';

import { useState } from 'react';
import { Stack, Paper, Group, Checkbox, Box, Text, Badge, ActionIcon, SegmentedControl } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Task, tasksRepository } from '@/lib/repositories/tasksRepository';
import { useRouter } from 'next/navigation';

interface TaskListProps {
    initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
    // We keep local state for immediate optimistic updates, 
    // but we accept initial data from the server
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [view, setView] = useState<'incomplete' | 'completed'>('incomplete');
    const router = useRouter();

    // Sync if server data changes (optional, but good for router.refresh)
    if (initialTasks !== tasks && initialTasks.length !== tasks.length) {
        // A simplistic way to update list when parent refreshes
        // In a real app we might use useEffect or a more robust sync
        // For this demo, we'll trust the component mount/remount or router.refresh causing re-render
    }

    const handleToggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = !task.is_complete;

        // Optimistic update
        setTasks(current =>
            current.map(t => t.id === id ? { ...t, is_complete: newStatus } : t)
        );

        await tasksRepository.toggleTask(id, task.is_complete);
        router.refresh(); // Sync server data (counts etc)
    };

    const handleDeleteTask = async (id: string) => {
        setTasks(current => current.filter(t => t.id !== id));
        await tasksRepository.deleteTask(id);
        router.refresh();
    };

    const filteredTasks = (initialTasks || tasks).filter(t =>
        view === 'completed' ? t.is_complete : !t.is_complete
    );

    return (
        <Stack>
            <SegmentedControl
                fullWidth
                value={view}
                onChange={(val) => setView(val as 'incomplete' | 'completed')}
                data={[
                    { label: 'To Do', value: 'incomplete' },
                    { label: 'Completed', value: 'completed' },
                ]}
            />

            {filteredTasks.length === 0 && (
                <Text c="dimmed" ta="center" py="xl">
                    {view === 'completed'
                        ? "No completed tasks yet. Get to work!"
                        : "All caught up! Nothing to do."}
                </Text>
            )}

            {filteredTasks.map((task) => (
                <Paper key={task.id} withBorder p="sm" radius="md">
                    <Group justify="space-between">
                        <Group gap="md">
                            <Checkbox
                                checked={task.is_complete}
                                onChange={() => handleToggleTask(task.id)}
                                size="md"
                                radius="xl"
                            />
                            <Box>
                                <Text
                                    fw={500}
                                    td={task.is_complete ? 'line-through' : 'none'}
                                    c={task.is_complete ? 'dimmed' : undefined}
                                >
                                    {task.title}
                                </Text>
                                <Badge size="xs" variant="dot" color={getCategoryColor(task.category)}>
                                    {task.category}
                                </Badge>
                            </Box>
                        </Group>
                        <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteTask(task.id)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                </Paper>
            ))}
        </Stack>
    );
}

function getCategoryColor(category: string) {
    switch (category.toLowerCase()) {
        case 'work': return 'blue';
        case 'personal': return 'green';
        case 'health': return 'red';
        case 'finance': return 'yellow';
        case 'shopping': return 'orange';
        default: return 'gray';
    }
}
