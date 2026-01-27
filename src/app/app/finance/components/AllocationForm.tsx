'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, TextInput, NumberInput, Stack, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FinanceGoal, allocateToGoal } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';

interface AllocationFormProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal: FinanceGoal | null;
}

export function AllocationForm({ opened, onClose, onSuccess, goal }: AllocationFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            amount: 0,
            note: '',
        },
        validate: {
            amount: (value) => (value === 0 ? 'Amount cannot be 0' : null),
        },
    });

    useEffect(() => {
        if (opened) form.reset();
    }, [opened]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!goal) return;

        setLoading(true);
        try {
            await allocateToGoal({
                goal_id: goal.id,
                amount: values.amount,
                note: values.note,
            });
            notifications.show({
                title: 'Success',
                message: 'Funds allocated successfully',
                color: 'green',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to allocate funds',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!goal) return null;

    return (
        <Modal opened={opened} onClose={onClose} title={`Allocate to: ${goal.title}`}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <Text size="sm" c="dimmed">
                        Current Amount: ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                    </Text>
                    <NumberInput
                        label="Amount to Add (or Remove)"
                        description="Negative values withdraw from the goal"
                        placeholder="0.00"
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        required
                        {...form.getInputProps('amount')}
                    />
                    <TextInput
                        label="Note"
                        placeholder="e.g. Monthly contribution"
                        {...form.getInputProps('note')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={loading}>Save Allocation</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
