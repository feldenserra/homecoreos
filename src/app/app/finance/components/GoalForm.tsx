'use client';

import { useState } from 'react';
import { Modal, Button, TextInput, NumberInput, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { createGoal } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';

interface GoalFormProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function GoalForm({ opened, onClose, onSuccess }: GoalFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            title: '',
            target_amount: 0,
            deadline: null as Date | null,
        },
        validate: {
            title: (value) => (value.length < 1 ? 'Title is required' : null),
            target_amount: (value) => (value <= 0 ? 'Target amount must be greater than 0' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            await createGoal({
                title: values.title,
                target_amount: values.target_amount,
                deadline: values.deadline ? values.deadline.toISOString() : null,
            });
            notifications.show({
                title: 'Success',
                message: 'Goal created successfully',
                color: 'green',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to create goal',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create Savings Goal">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Goal Title"
                        placeholder="e.g. New Laptop"
                        required
                        {...form.getInputProps('title')}
                    />
                    <NumberInput
                        label="Target Amount"
                        placeholder="0.00"
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        required
                        {...form.getInputProps('target_amount')}
                    />
                    <DateInput
                        label="Deadline (Optional)"
                        placeholder="Target date"
                        valueFormat="MMM DD, YYYY"
                        {...form.getInputProps('deadline')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={loading}>Create Goal</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
