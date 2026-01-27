'use client';

import { useState, useEffect } from 'react';
import { Stack, Paper, Group, Checkbox, Box, Text, Badge, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Task, toggleTask, deleteTask } from '@/lib/repositories/tasksRepository';
import { useRouter } from 'next/navigation';

interface TaskListProps {
    initialTasks: Task[];
    filter: 'incomplete' | 'completed';
}

export function TaskList({ initialTasks, filter }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [animatingState, setAnimatingState] = useState<Map<string, boolean>>(new Map());
    const router = useRouter();

    useEffect(() => {
        setTasks(initialTasks);

        // Clean up animating state ONLY for tasks that have verified updates or are gone
        setAnimatingState(prev => {
            const next = new Map(prev);
            let changed = false;

            for (const [id, targetStatus] of prev.entries()) {
                const serverTask = initialTasks.find(t => t.id === id);
                // If task is missing (deleted) or status matches target -> animation done
                if (!serverTask || serverTask.is_complete === targetStatus) {
                    next.delete(id);
                    changed = true;
                }
            }

            return changed ? next : prev;
        });
    }, [initialTasks]);

    const handleToggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = !task.is_complete;

        // 1. Set explicit visual state (triggers UI feedback)
        setAnimatingState(prev => new Map(prev).set(id, newStatus));

        // 2. Sync with server
        await toggleTask(id, task.is_complete);

        // 3. Trigger refresh (Server Component will re-render with new data)
        router.refresh();
    };

    const handleDeleteTask = async (id: string) => {
        setTasks(current => current.filter(t => t.id !== id));
        await deleteTask(id);
        router.refresh();
    };

    // Filter Logic:
    const filteredTasks = (initialTasks || tasks).filter(t => {
        const matchesView = filter === 'completed' ? t.is_complete : !t.is_complete;
        // If animating, we generally want to remove it when the animation is done.
        // While animating, we still want it in the list so we can see the animation.
        // Since we delay the `setTasks` update, `matchesView` stays TRUE during the animation.
        // Once `setTasks` updates, `matchesView` becomes FALSE, and it disappears.
        // Perfect.
        return matchesView;
    });


    const isChecked = (task: Task) => {
        if (animatingState.has(task.id)) {
            // Return the explicit target state stored in the map
            return animatingState.get(task.id)!;
        }
        return task.is_complete;
    };

    return (
        <Stack>
            {filteredTasks.length === 0 && (
                <Text c="dimmed" ta="center" py="xl">
                    {filter === 'completed'
                        ? "No completed tasks yet. Get to work!"
                        : "All caught up! Nothing to do."}
                </Text>
            )}

            {filteredTasks.map((task) => (
                <Paper
                    key={task.id}
                    withBorder
                    p="sm"
                    radius="md"
                    style={{
                        transition: 'all 0.2s ease',
                        opacity: animatingState.has(task.id) ? 0.5 : 1,
                        transform: animatingState.has(task.id) ? 'scale(0.98)' : 'scale(1)'
                    }}
                >
                    <Group justify="space-between">
                        <Group gap="md">
                            <Checkbox
                                checked={isChecked(task)}
                                onChange={() => handleToggleTask(task.id)}
                                size="md"
                                radius="xl"
                                style={{ cursor: 'pointer' }}
                                disabled={animatingState.has(task.id)}
                            />
                            <Box>
                                <Text
                                    fw={500}
                                    td={isChecked(task) ? 'line-through' : 'none'}
                                    c={isChecked(task) ? 'dimmed' : undefined}
                                    style={{ transition: 'all 0.3s ease' }}
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
