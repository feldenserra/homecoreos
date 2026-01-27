'use client';

import { Paper, Title, Stack, TextInput, ActionIcon, ScrollArea } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { PlannerDayWithTasks } from '@/lib/repositories/plannerRepository';
import { PlannerTask } from './PlannerTask';
import { useState, useRef } from 'react';

interface DayColumnProps {
    day: PlannerDayWithTasks;
    onAddTask: (dayId: string, content: string) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
}

export function DayColumn({ day, onAddTask, onDeleteTask }: DayColumnProps) {
    const [newTaskContent, setNewTaskContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newTaskContent.trim()) return;

        setIsAdding(true);
        try {
            await onAddTask(day.id, newTaskContent);
            setNewTaskContent('');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Paper
            h="100%"
            p="sm"
            radius="md"
            bg="var(--mantine-color-gray-0)"
            style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--mantine-color-gray-2)',
                minWidth: 280
            }}
        >
            <Title order={4} mb="md" ta="center" c="dimmed" tt="uppercase" lts={1}>
                {day.day_name}
            </Title>

            <ScrollArea flex={1} mb="sm" offsetScrollbars>
                <Stack gap="xs">
                    {day.planner_tasks.map((task) => (
                        <PlannerTask
                            key={task.id}
                            task={task}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </Stack>
            </ScrollArea>

            <TextInput
                placeholder="Add a task..."
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                }}
                disabled={isAdding}
                rightSection={
                    <ActionIcon
                        size="sm"
                        variant="filled"
                        color="indigo"
                        onClick={handleAdd}
                        loading={isAdding}
                        disabled={!newTaskContent.trim()}
                    >
                        <IconPlus size={12} />
                    </ActionIcon>
                }
            />
        </Paper>
    );
}
