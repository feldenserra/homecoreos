'use client';

import { useState } from 'react';
import { Card, Text, Group, Badge, Progress, Button, Collapse, ScrollArea, Stack, ThemeIcon, Timeline } from '@mantine/core';
import { IconHistory, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { FinanceGoal, FinanceGoalAllocation, getGoalAllocations } from '@/lib/repositories/financeRepository';
import dayjs from 'dayjs';

interface GoalCardProps {
    goal: FinanceGoal;
    onAllocate: (goal: FinanceGoal) => void;
}

export function GoalCard({ goal, onAllocate }: GoalCardProps) {
    const [opened, setOpened] = useState(false);
    const [history, setHistory] = useState<FinanceGoalAllocation[]>([]);
    const [loading, setLoading] = useState(false);

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

    return (
        <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="xs">
                <Text fw={700}>{goal.title}</Text>
                {goal.deadline && (
                    <Badge variant="outline" color="gray">
                        Due {dayjs(goal.deadline).format('MMM YYYY')}
                    </Badge>
                )}
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

            <Group grow mb="md">
                <Button variant="light" onClick={() => onAllocate(goal)}>
                    Manage / Allocate
                </Button>
                <Button variant="subtle" leftSection={<IconHistory size={16} />} onClick={toggleHistory}>
                    {opened ? 'Hide History' : 'View History'}
                </Button>
            </Group>

            <Collapse in={opened}>
                <Text size="sm" fw={500} mb="xs" c="dimmed">Allocation History</Text>
                <ScrollArea h={200} type="always" offsetScrollbars>
                    {loading ? (
                        <Text size="xs" ta="center" c="dimmed">Loading...</Text>
                    ) : history.length === 0 ? (
                        <Text size="xs" ta="center" c="dimmed">No history found.</Text>
                    ) : (
                        <Timeline active={history.length} bulletSize={24} lineWidth={2}>
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
    );
}
