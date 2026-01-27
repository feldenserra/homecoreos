'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, TextInput, NumberInput, Select, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { FinanceCategory, FinanceTransaction, createTransaction, updateTransaction, getFinanceCategories } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';

interface TransactionFormProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transaction?: FinanceTransaction | null;
}

export function TransactionForm({ opened, onClose, onSuccess, transaction }: TransactionFormProps) {
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
            if (transaction) {
                form.setValues({
                    description: transaction.description || '',
                    amount: transaction.amount,
                    category_id: transaction.category_id || '',
                    transaction_date: new Date(transaction.transaction_date),
                });
            } else {
                form.reset();
            }
        }
    }, [opened, transaction]);

    const loadCategories = async () => {
        try {
            const data = await getFinanceCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const payload = {
                description: values.description,
                amount: values.amount,
                category_id: values.category_id,
                transaction_date: values.transaction_date.toISOString(),
            };

            if (transaction) {
                await updateTransaction(transaction.id, payload);
                notifications.show({ title: 'Success', message: 'Transaction updated', color: 'green' });
            } else {
                await createTransaction(payload);
                notifications.show({ title: 'Success', message: 'Transaction added', color: 'green' });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to save transaction',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = useMemo(() => {
        if (!categories || !Array.isArray(categories)) return [];

        const expenses = categories
            .filter(c => c.type === 'expense')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({ value: String(c.id), label: `${c.icon || ''} ${c.name}`.trim() }));

        const income = categories
            .filter(c => c.type === 'income')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({ value: String(c.id), label: `${c.icon || ''} ${c.name}`.trim() }));

        const options = [];

        if (expenses.length > 0) {
            options.push({ value: 'header-expense', label: '--- Expenses ---', disabled: true });
            options.push(...expenses);
        }

        if (income.length > 0) {
            options.push({ value: 'header-income', label: '--- Income ---', disabled: true });
            options.push(...income);
        }

        return options;
    }, [categories]);

    return (
        <Modal opened={opened} onClose={onClose} title={transaction ? "Edit Transaction" : "Add Transaction"}>
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
                        <Button type="submit" loading={loading}>{transaction ? 'Update' : 'Save'}</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
