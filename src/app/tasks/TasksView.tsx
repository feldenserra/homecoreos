'use client';

import { useState } from 'react';
import {
    Container,
    Title,
    Paper,
    Stack,
    Group,
    SegmentedControl,
    TextInput,
    Button,
    Checkbox,
    Badge,
    Text,
    ThemeIcon,
    ActionIcon,
    Box,
    Flex,
    Select
} from '@mantine/core';
import { IconTrash, IconTrophy, IconPlus } from '@tabler/icons-react';
import { Task, tasksRepository } from '@/lib/repositories/tasksRepository';

interface TasksViewProps {
    initialTasks: Task[];
    initialCount: number;
}

export function TasksView({ initialTasks, initialCount }: TasksViewProps) {
    const [view, setView] = useState<'incomplete' | 'completed'>('incomplete');
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState<string | null>('Personal');
    const [lifetimeCount, setLifetimeCount] = useState(initialCount);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        const task = await tasksRepository.addTask(newTaskTitle, newTaskCategory || 'Uncategorized');
        if (task) setTasks([...tasks, task]);
        setNewTaskTitle('');
    };

    const handleToggleTask = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = !task.is_complete;

        setTasks(current =>
            current.map(t => t.id === id ? { ...t, is_complete: newStatus } : t)
        );

        if (newStatus) {
            setLifetimeCount(c => c + 1);
        } else {
            setLifetimeCount(c => Math.max(0, c - 1));
        }

        await tasksRepository.toggleTask(id, task.is_complete);
    };

    const handleDeleteTask = async (id: string) => {
        setTasks(current => current.filter(t => t.id !== id));
        await tasksRepository.deleteTask(id);
    };

    const filteredTasks = tasks.filter(t =>
        view === 'completed' ? t.is_complete : !t.is_complete
    );

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
                                <Text size="xl" fw={900} lh={1} c="blue.7">{lifetimeCount}</Text>
                            </Box>
                        </Group>
                    </Paper>
                </Group>

                <Paper withBorder p="md" radius="md" shadow="sm">
                    <Flex direction={{ base: 'column', sm: 'row' }} gap="md" align={{ base: 'stretch', sm: 'flex-end' }}>
                        <TextInput
                            label="New Task"
                            placeholder="What needs to be done?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.currentTarget.value)}
                            style={{ flex: 1 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTask();
                            }}
                        />
                        <Select
                            label="Category"
                            data={['Personal', 'Work', 'Health', 'Finance', 'Shopping']}
                            value={newTaskCategory}
                            onChange={setNewTaskCategory}
                            w={{ base: '100%', sm: 150 }}
                            allowDeselect={false}
                        />
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddTask}
                            disabled={!newTaskTitle.trim()}
                        >
                            Add
                        </Button>
                    </Flex>
                </Paper>

                <SegmentedControl
                    fullWidth
                    value={view}
                    onChange={(val) => setView(val as 'incomplete' | 'completed')}
                    data={[
                        { label: 'To Do', value: 'incomplete' },
                        { label: 'Completed', value: 'completed' },
                    ]}
                />

                <Stack>
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
            </Stack>
        </Container>
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
