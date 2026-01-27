'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, TextInput, NumberInput, Select, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { FinanceCategory, createTransaction, getFinanceCategories } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';

interface TransactionFormProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransactionForm({ opened, onClose, onSuccess }: TransactionFormProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<FinanceCategory[]>([]);

    const form = useForm({
        initialValues: {
            description: '',
            amount: 0,
            category_id: '',
            transaction_date: new Date(),
        },
        validate: {
            description: (value) => (value.length < 1 ? 'Description is required' : null),
            amount: (value) => (value <= 0 ? 'Amount must be greater than 0' : null),
            category_id: (value) => (!value ? 'Category is required' : null),
            transaction_date: (value) => (!value ? 'Date is required' : null),
        },
    });

    useEffect(() => {
        if (opened) {
            loadCategories();
            form.reset();
        }
    }, [opened]);

    const loadCategories = async () => {
        try {
            const data = await getFinanceCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            await createTransaction({
                description: values.description,
                amount: values.amount,
                category_id: values.category_id,
                transaction_date: values.transaction_date.toISOString(),
            });
            notifications.show({
                title: 'Success',
                message: 'Transaction added successfully',
                color: 'green',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to add transaction',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = categories.map((c) => ({
        value: c.id,
        label: `${c.icon || ''} ${c.name} (${c.type})`,
    }));

    return (
        <Modal opened={opened} onClose={onClose} title="Add Transaction">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <Select
                        label="Category"
                        placeholder="Select category"
                        data={categoryOptions}
                        searchable
                        required
                        {...form.getInputProps('category_id')}
                    />
                    <TextInput
                        label="Description"
                        placeholder="e.g. Walmart, Salary"
                        required
                        {...form.getInputProps('description')}
                    />
                    <NumberInput
                        label="Amount"
                        placeholder="0.00"
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="$"
                        required
                        {...form.getInputProps('amount')}
                    />
                    <DateInput
                        label="Date"
                        placeholder="Transaction date"
                        valueFormat="MMM DD, YYYY"
                        required
                        {...form.getInputProps('transaction_date')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={loading}>Save</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
