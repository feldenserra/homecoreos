'use client';

import { useState, useEffect } from 'react';
import { Card, Text, Group, Badge, Progress, Button, Collapse, ScrollArea, Stack, ThemeIcon, Timeline, Modal } from '@mantine/core';
import { IconHistory, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { FinanceGoal, FinanceGoalAllocation, getGoalAllocations } from '@/lib/repositories/financeRepository';
import dayjs from 'dayjs';

interface GoalCardProps {
    goal: FinanceGoal;
    onAllocate: (goal: FinanceGoal) => void;
    onDelete?: () => void;
}

export function GoalCard({ goal, onAllocate, onDelete }: GoalCardProps) {
    const [opened, setOpened] = useState(false);
    const [history, setHistory] = useState<FinanceGoalAllocation[]>([]);
    const [loading, setLoading] = useState(false);

    // Refresh history if goal amount changes (e.g. after allocation)
    useEffect(() => {
        if (history.length > 0 || opened) {
            getGoalAllocations(goal.id).then(setHistory);
        }
    }, [goal.current_amount, goal.id]);

    const toggleHistory = async () => {
        if (!opened && history.length === 0) {
            setLoading(true);
            try {
                const data = await getGoalAllocations(goal.id);
                setHistory(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        setOpened((o) => !o);
    };

    const percent = (parseInt(goal.current_amount.toString()) / parseInt(goal.target_amount.toString())) * 100;

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { deleteGoal } = await import('@/lib/repositories/financeRepository');
            await deleteGoal(goal.id);
            // Notify user about returned funds
            const { notifications } = await import('@mantine/notifications');
            notifications.show({
                title: 'Goal Deleted',
                message: `Goal deleted. $${goal.current_amount.toFixed(2)} has been returned to your Net Savings.`,
                color: 'blue',
            });
            onDelete && onDelete();
        } catch (error) {
            console.error(error);
            const { notifications } = await import('@mantine/notifications');
            notifications.show({
                title: 'Error',
                message: 'Failed to delete goal',
                color: 'red',
            });
        } finally {
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    return (
        <>
            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Goal" centered>
                <Text size="sm" mb="lg">
                    Are you sure you want to delete <b>{goal.title}</b>?
                    <br /><br />
                    This will delete the goal and its history.
                    Any funds allocated to this goal (<b>${goal.current_amount.toFixed(2)}</b>) will naturally return to your Net Savings calculation.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={handleDelete} loading={deleting}>Delete Goal</Button>
                </Group>
            </Modal>

            <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" mb="xs">
                    <Text fw={700} truncate>{goal.title}</Text>
                    <Group gap="xs">
                        <Badge variant="light" color={goal.is_achieved ? 'green' : 'blue'}>
                            {percent.toFixed(0)}%
                        </Badge>
                        {goal.deadline && (
                            <Badge variant="outline" color="gray">
                                Due {dayjs(goal.deadline).format('MMM YYYY')}
                            </Badge>
                        )}
                    </Group>
                </Group>

                <Text size="2xl" fw={700} my="md" ta="center">
                    ${parseInt(goal.current_amount.toString()).toLocaleString()}
                    <Text span size="sm" c="dimmed" fw={400}> / ${parseInt(goal.target_amount.toString()).toLocaleString()}</Text>
                </Text>

                <Progress
                    value={percent}
                    size="xl"
                    radius="xl"
                    mb="md"
                    color={goal.is_achieved ? 'green' : 'blue'}
                />

                <Stack gap="xs">
                    <Group grow>
                        <Button variant="light" onClick={() => onAllocate(goal)}>
                            Allocate
                        </Button>
                        <Button variant="subtle" leftSection={<IconHistory size={16} />} onClick={toggleHistory}>
                            {opened ? 'Hide' : 'History'}
                        </Button>
                    </Group>
                    <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => setDeleteModalOpen(true)}
                    >
                        Delete Goal
                    </Button>
                </Stack>

                <Collapse in={opened}>
                    <Text size="sm" fw={500} mb="xs" c="dimmed" mt="md">Allocation History</Text>
                    <ScrollArea h={200} type="always" offsetScrollbars>
                        {loading ? (
                            <Text size="xs" ta="center" c="dimmed">Loading...</Text>
                        ) : history.length === 0 ? (
                            <Text size="xs" ta="center" c="dimmed">No history found.</Text>
                        ) : (
                            <Timeline active={history.length} bulletSize={24} lineWidth={2} mt="xs">
                                {history.map((item) => (
                                    <Timeline.Item
                                        key={item.id}
                                        bullet={
                                            <ThemeIcon
                                                size={22}
                                                variant="light"
                                                radius="xl"
                                                color={item.amount >= 0 ? 'green' : 'red'}
                                            >
                                                {item.amount >= 0 ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
                                            </ThemeIcon>
                                        }
                                        title={dayjs(item.allocated_at).format('MMM D, YYYY')}
                                    >
                                        <Text size="sm" fw={500}>
                                            {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toLocaleString()}
                                        </Text>
                                        {item.note && <Text size="xs" c="dimmed">{item.note}</Text>}
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        )}
                    </ScrollArea>
                </Collapse>
            </Card>
        </>
    );
}
