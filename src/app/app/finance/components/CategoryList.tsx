'use client';

import { useState, useEffect } from 'react';
import { Table, Button, NumberInput, Group, Text, ActionIcon, Modal, TextInput, Select, Stack } from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconPlus } from '@tabler/icons-react';
import { FinanceCategory, getFinanceCategories, updateCategoryLimit, createFinanceCategory } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

export function CategoryList() {
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLimit, setEditLimit] = useState<number | string>(0);
    const [createModalOpened, setCreateModalOpened] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const data = await getFinanceCategories();
        setCategories(data);
    };

    const startEdit = (category: FinanceCategory) => {
        setEditingId(category.id);
        setEditLimit(category.monthly_budget_limit || 0);
    };

    const saveLimit = async (id: string) => {
        try {
            await updateCategoryLimit(id, Number(editLimit));
            setEditingId(null);
            loadCategories();
            notifications.show({ title: 'Saved', message: 'Budget limit updated', color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to update limit', color: 'red' });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    // --- Create New Category Form ---
    const createForm = useForm({
        initialValues: {
            name: '',
            icon: '',
            type: 'expense',
            monthly_budget_limit: 0,
        },
        validate: {
            name: (val) => (val.length < 1 ? 'Name required' : null),
        },
    });

    const handleCreate = async (values: typeof createForm.values) => {
        try {
            await createFinanceCategory({
                name: values.name,
                icon: values.icon || null,
                type: values.type as 'income' | 'expense',
                monthly_budget_limit: values.monthly_budget_limit,
            });
            setCreateModalOpened(false);
            createForm.reset();
            loadCategories();
            notifications.show({ title: 'Created', message: 'Category created', color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to create category', color: 'red' });
        }
    };

    const rows = categories.map((c) => (
        <Table.Tr key={c.id}>
            <Table.Td>{c.icon}</Table.Td>
            <Table.Td>
                <Text fw={500}>{c.name}</Text>
                <Text size="xs" c="dimmed">{c.type}</Text>
            </Table.Td>
            <Table.Td>
                {editingId === c.id ? (
                    <Group gap="xs">
                        <NumberInput
                            value={editLimit}
                            onChange={(val) => setEditLimit(val)}
                            decimalScale={2}
                            fixedDecimalScale
                            prefix="$"
                            size="xs"
                            w={100}
                        />
                        <ActionIcon color="green" size="sm" onClick={() => saveLimit(c.id)}>
                            <IconCheck size={14} />
                        </ActionIcon>
                        <ActionIcon color="gray" size="sm" onClick={cancelEdit}>
                            <IconX size={14} />
                        </ActionIcon>
                    </Group>
                ) : (
                    <Group gap="xs">
                        <Text>${c.monthly_budget_limit?.toFixed(2) || '0.00'}</Text>
                        <ActionIcon variant="subtle" size="sm" onClick={() => startEdit(c)}>
                            <IconEdit size={14} />
                        </ActionIcon>
                    </Group>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Stack>
            <Group justify="space-between">
                <Text size="lg" fw={700}>Categories & Budgets</Text>
                <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setCreateModalOpened(true)}>
                    New Category
                </Button>
            </Group>

            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Icon</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Monthly Budget</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            <Modal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} title="New Category">
                <form onSubmit={createForm.onSubmit(handleCreate)}>
                    <Stack>
                        <TextInput label="Name" required {...createForm.getInputProps('name')} />
                        <TextInput label="Icon" placeholder="e.g. 🏠" {...createForm.getInputProps('icon')} />
                        <Select
                            label="Type"
                            data={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]}
                            required
                            {...createForm.getInputProps('type')}
                        />
                        <NumberInput
                            label="Monthly Budget Limit"
                            prefix="$"
                            decimalScale={2}
                            fixedDecimalScale
                            {...createForm.getInputProps('monthly_budget_limit')}
                        />
                        <Button type="submit" mt="md">Create</Button>
                    </Stack>
                </form>
            </Modal>
        </Stack>
    );
}
