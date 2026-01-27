'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Tabs, Grid, Paper, Text, Group, Button, Stack, Progress, Badge, Card, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconCurrencyDollar, IconTrendingUp, IconTrendingDown, IconTarget, IconPlus, IconReceipt } from '@tabler/icons-react';
import { getFinanceCategories, getTransactions, getGoals, getRecentAllocations, FinanceTransaction, FinanceGoal, FinanceCategory, FinanceGoalAllocation } from '@/lib/repositories/financeRepository';
import { GoalCard } from './components/GoalCard';
import { TransactionForm } from './components/TransactionForm';
import { GoalForm } from './components/GoalForm';
import { AllocationForm } from './components/AllocationForm';
import { CategoryList } from './components/CategoryList';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState<string | null>('overview');

    // Data State
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [goals, setGoals] = useState<FinanceGoal[]>([]);
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [allocations, setAllocations] = useState<FinanceGoalAllocation[]>([]);

    // Modal State
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [allocationModalOpen, setAllocationModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<FinanceGoal | null>(null);

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        dayjs().startOf('month').toDate(),
        dayjs().endOf('month').toDate(),
    ]);

    const loadData = useCallback(async () => {
        const [start, end] = dateRange;
        // Safely handle dates, ensuring we don't call methods on null/undefined
        // or invalid objects. dayjs handles various inputs robustly.
        const startDate = start ? dayjs(start).toISOString() : undefined;
        const endDate = end ? dayjs(end).toISOString() : undefined;

        const [txData, goalData, catData, allocData] = await Promise.all([
            getTransactions(100, startDate, endDate),
            getGoals(),
            getFinanceCategories(),
            getRecentAllocations(100, startDate, endDate)
        ]);
        setTransactions(txData);
        setGoals(goalData);
        setCategories(catData);
        setAllocations(allocData);
    }, [dateRange]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGoalClick = (goal: FinanceGoal) => {
        setSelectedGoal(goal);
        setAllocationModalOpen(true);
    };

    const setPresetRange = (months: number) => {
        const end = dayjs().endOf('day').toDate();
        const start = dayjs().subtract(months, 'month').startOf('day').toDate();
        setDateRange([start, end]);
    };

    const setThisMonth = () => {
        setDateRange([
            dayjs().startOf('month').toDate(),
            dayjs().endOf('month').toDate(),
        ]);
    };

    // --- Calculations ---
    const totalIncome = transactions
        .filter(t => t.finance_categories?.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
        .filter(t => t.finance_categories?.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalAllocated = allocations
        .reduce((sum, a) => sum + Number(a.amount), 0);

    const netSavings = totalIncome - totalExpenses - totalAllocated;

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <Title order={2}>Finance Dashboard</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setTransactionModalOpen(true)}>
                    Add Transaction
                </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconCurrencyDollar size={16} />}>Overview</Tabs.Tab>
                    <Tabs.Tab value="transactions" leftSection={<IconReceipt size={16} />}>Transactions</Tabs.Tab>
                    <Tabs.Tab value="goals" leftSection={<IconTarget size={16} />}>Goals</Tabs.Tab>
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>

                {/* --- OVERVIEW TAB --- */}
                <Tabs.Panel value="overview" pt="xl">
                    {/* Date Filters */}
                    <Paper withBorder p="md" mb="md" radius="md">
                        <Group justify="space-between">
                            <Group>
                                <Button variant="default" size="xs" onClick={setThisMonth}>This Month</Button>
                                <Button variant="default" size="xs" onClick={() => setPresetRange(3)}>Last 3 Months</Button>
                                <Button variant="default" size="xs" onClick={() => setPresetRange(6)}>Last 6 Months</Button>
                                <Button variant="default" size="xs" onClick={() => setPresetRange(12)}>Last Year</Button>
                            </Group>
                            <DatePickerInput
                                type="range"
                                placeholder="Pick dates range"
                                value={dateRange}
                                onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                                w={250}
                                clearable
                            />
                        </Group>
                    </Paper>

                    <Grid>
                        {/* Summary Cards */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">Income</Text>
                                    <ThemeIcon color="green" variant="light" radius="xl"><IconTrendingUp size={16} /></ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl" mt="xs">${totalIncome.toFixed(2)}</Text>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">Expenses</Text>
                                    <ThemeIcon color="red" variant="light" radius="xl"><IconTrendingDown size={16} /></ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl" mt="xs">${totalExpenses.toFixed(2)}</Text>
                            </Paper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Paper withBorder p="md" radius="md">
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">Net Savings</Text>
                                    <ThemeIcon color="blue" variant="light" radius="xl"><IconCurrencyDollar size={16} /></ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl" mt="xs" c={netSavings >= 0 ? "teal" : "red"}>${netSavings.toFixed(2)}</Text>
                            </Paper>
                        </Grid.Col>

                        {/* Recent Transactions */}
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Title order={4} mb="md">Recent Transactions</Title>
                            <Stack gap="xs">
                                {transactions.slice(0, 5).map((t) => (
                                    <Paper key={t.id} withBorder p="sm" radius="md">
                                        <Group justify="space-between">
                                            <Group>
                                                <ThemeIcon size="lg" radius="md" variant="light" color={t.finance_categories?.type === 'income' ? 'green' : 'red'}>
                                                    {t.finance_categories?.type === 'income' ? <IconTrendingUp size={20} /> : <IconTrendingDown size={20} />}
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={500}>{t.description}</Text>
                                                    <Text size="xs" c="dimmed">{t.finance_categories?.name} • {dayjs(t.transaction_date).format('MMM D')}</Text>
                                                </div>
                                            </Group>
                                            <Text fw={600} c={t.finance_categories?.type === 'income' ? 'green' : 'red'}>
                                                {t.finance_categories?.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                            </Text>
                                        </Group>
                                    </Paper>
                                ))}
                                {transactions.length === 0 && <Text c="dimmed" ta="center">No transactions yet.</Text>}
                            </Stack>
                        </Grid.Col>

                        {/* Goal Progress */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Title order={4} mb="md">Goals Snapshot</Title>
                            <Stack>
                                {goals.slice(0, 3).map((goal) => (
                                    <Paper key={goal.id} withBorder p="sm" radius="md">
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={500} size="sm">{goal.title}</Text>
                                            <Badge size="sm" variant="light" color={goal.is_achieved ? 'green' : 'blue'}>
                                                {((parseInt(goal.current_amount.toString()) / parseInt(goal.target_amount.toString())) * 100).toFixed(0)}%
                                            </Badge>
                                        </Group>
                                        <Progress
                                            value={(parseInt(goal.current_amount.toString()) / parseInt(goal.target_amount.toString())) * 100}
                                            color={goal.is_achieved ? 'green' : 'blue'}
                                            size="md"
                                            radius="xl"
                                        />
                                        <Group justify="space-between" mt={5}>
                                            <Text size="xs" c="dimmed">${parseInt(goal.current_amount.toString()).toLocaleString()} / ${parseInt(goal.target_amount.toString()).toLocaleString()}</Text>
                                            <Button size="compact-xs" variant="light" onClick={() => handleGoalClick(goal)}>Allocate</Button>
                                        </Group>
                                    </Paper>
                                ))}
                                {goals.length === 0 && <Text c="dimmed" ta="center">No goals set.</Text>}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>

                {/* --- TRANSACTIONS TAB --- */}
                <Tabs.Panel value="transactions" pt="xl">
                    <Stack>
                        {transactions.map((t) => (
                            <Paper key={t.id} withBorder p="md" radius="md">
                                <Group justify="space-between">
                                    <Group>
                                        <ThemeIcon size="lg" radius="md" variant="light" color={t.finance_categories?.type === 'income' ? 'green' : 'red'}>
                                            <Text size="lg">{t.finance_categories?.icon || (t.finance_categories?.type === 'income' ? '💵' : '💳')}</Text>
                                        </ThemeIcon>
                                        <div>
                                            <Text fw={600}>{t.description}</Text>
                                            <Text size="xs" c="dimmed">
                                                {dayjs(t.transaction_date).format('MMM D, YYYY h:mm A')} • {t.finance_categories?.name}
                                            </Text>
                                        </div>
                                    </Group>
                                    <Text fw={700} c={t.finance_categories?.type === 'income' ? 'green' : 'red'}>
                                        {t.finance_categories?.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                    </Text>
                                </Group>
                            </Paper>
                        ))}
                        {transactions.length === 0 && <Text c="dimmed" ta="center" py="xl">No transactions found.</Text>}
                    </Stack>
                </Tabs.Panel>

                {/* --- GOALS TAB --- */}
                <Tabs.Panel value="goals" pt="xl">
                    <Stack>
                        <Button variant="outline" leftSection={<IconPlus size={16} />} onClick={() => setGoalModalOpen(true)} maw={200}>
                            Add New Goal
                        </Button>
                        <Grid>
                            {goals.map((goal) => (
                                <Grid.Col key={goal.id} span={{ base: 12, sm: 6, md: 4 }}>
                                    <GoalCard goal={goal} onAllocate={handleGoalClick} />
                                </Grid.Col>
                            ))}
                        </Grid>
                    </Stack>
                </Tabs.Panel>

                {/* --- SETTINGS TAB --- */}
                <Tabs.Panel value="settings" pt="xl">
                    <CategoryList />
                </Tabs.Panel>
            </Tabs>

            {/* --- MODALS --- */}
            <TransactionForm
                opened={transactionModalOpen}
                onClose={() => setTransactionModalOpen(false)}
                onSuccess={loadData}
            />
            <GoalForm
                opened={goalModalOpen}
                onClose={() => setGoalModalOpen(false)}
                onSuccess={loadData}
            />
            <AllocationForm
                opened={allocationModalOpen}
                onClose={() => setAllocationModalOpen(false)}
                onSuccess={loadData}
                goal={selectedGoal}
            />
        </Stack>
    );
}
