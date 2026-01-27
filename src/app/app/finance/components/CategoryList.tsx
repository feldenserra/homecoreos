'use client';

import { useState, useEffect } from 'react';
import { Table, Button, NumberInput, Group, Text, ActionIcon, Modal, TextInput, Select, Stack, ThemeIcon } from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconPlus } from '@tabler/icons-react';
import { FinanceCategory, getFinanceCategories, updateCategoryLimit, createFinanceCategory } from '@/lib/repositories/financeRepository';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

interface CategoryListProps {
    onUpdate?: () => void;
}

export function CategoryList({ onUpdate }: CategoryListProps) {
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
            if (onUpdate) onUpdate();
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
        } catch (error: any) {
            if (error.code === '23505' || error.message?.includes('unique')) {
                notifications.show({ title: 'Error', message: 'Category name already exists', color: 'red' });
            } else {
                notifications.show({ title: 'Error', message: 'Failed to create category', color: 'red' });
            }
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);

    const openDeleteModal = (category: FinanceCategory) => {
        if (category.name.toLowerCase().includes('default')) {
            notifications.show({ title: 'Cannot Delete', message: 'Default categories cannot be deleted.', color: 'red' });
            return;
        }
        setCategoryToDelete(category);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        try {
            const { deleteCategory } = await import('@/lib/repositories/financeRepository');
            await deleteCategory(categoryToDelete.id, categoryToDelete.type);
            notifications.show({
                title: 'Category Deleted',
                message: `Category deleted. Transactions were reassigned to default ${categoryToDelete.type}.`,
                color: 'blue'
            });
            setDeleteModalOpen(false);
            setCategoryToDelete(null);
            setCategoryToDelete(null);
            loadCategories();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Failed to delete category', color: 'red' });
        }
    };

    const rows = categories.map((c) => (
        <Table.Tr key={c.id}>
            <Table.Td>
                {c.icon ? (
                    <Text size="xl">{c.icon}</Text>
                ) : (
                    <ThemeIcon color={c.type === 'income' ? 'green' : 'red'} variant="light" radius="xl">
                        {c.type === 'income' ? <IconCheck size={16} /> : <IconX size={16} />}
                    </ThemeIcon>
                )}
            </Table.Td>
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
                        {!c.name.toLowerCase().includes('default') && (
                            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => openDeleteModal(c)}>
                                <IconX size={14} />
                            </ActionIcon>
                        )}
                    </Group>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Stack>
            <Button variant="outline" leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpened(true)} maw={200}>
                New Category
            </Button>

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

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Category" centered>
                <Text size="sm" mb="lg">
                    Are you sure you want to delete <b>{categoryToDelete?.name}</b>?
                    <br /><br />
                    Any transactions associated with this category will be automatically reassigned to
                    <b> default {categoryToDelete?.type}</b>.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={handleDelete}>Delete & Reassign</Button>
                </Group>
            </Modal>
        </Stack>
    );
}
