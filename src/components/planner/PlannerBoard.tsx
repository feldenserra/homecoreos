'use client';

import { SimpleGrid, Container, Title, Text, Group } from '@mantine/core';
import { useOptimistic } from 'react';
import { PlannerDayWithTasks, PlannerTaskRow } from '@/lib/repositories/plannerRepository';
import { DayColumn } from './DayColumn';
import { addPlannerTaskAction, deletePlannerTaskAction } from '@/app/app/planner/actions';

interface PlannerBoardProps {
    initialData: PlannerDayWithTasks[];
}

export function PlannerBoard({ initialData }: PlannerBoardProps) {
    const [optimisticDays, addOptimisticTask] = useOptimistic(
        initialData,
        (state: PlannerDayWithTasks[], action:
            | { type: 'add', dayId: string, task: PlannerTaskRow }
            | { type: 'delete', taskId: string }
        ) => {
            if (action.type === 'add') {
                return state.map(day => {
                    if (day.id === action.dayId) {
                        return {
                            ...day,
                            planner_tasks: [...day.planner_tasks, action.task]
                        };
                    }
                    return day;
                });
            } else if (action.type === 'delete') {
                return state.map(day => ({
                    ...day,
                    planner_tasks: day.planner_tasks.filter(t => t.id !== action.taskId)
                }));
            }
            return state;
        }
    );

    const handleAddTask = async (dayId: string, content: string) => {
        // Optimistic update
        const tempId = crypto.randomUUID();
        const tempTask: PlannerTaskRow = {
            id: tempId,
            planner_day_id: dayId,
            content,
            position: 9999, // Should be last
            created_at: new Date().toISOString(),
        };

        addOptimisticTask({ type: 'add', dayId, task: tempTask });

        // Server action
        await addPlannerTaskAction(dayId, content);
    };

    const handleDeleteTask = async (taskId: string) => {
        addOptimisticTask({ type: 'delete', taskId });
        await deletePlannerTaskAction(taskId);
    };

    return (
        <Container fluid h="calc(100vh - 80px)">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Weekly Planner</Title>
                    <Text c="dimmed">Plan your week effectively.</Text>
                </div>
            </Group>

            <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                height: 'calc(100% - 80px)',
                paddingBottom: '1rem'
            }}>
                {optimisticDays.map((day) => (
                    <div key={day.id} style={{ flexShrink: 0, width: 300, height: '100%' }}>
                        <DayColumn
                            day={day}
                            onAddTask={handleAddTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    </div>
                ))}
            </div>
        </Container>
    );
}
