'use client';

import { useState } from 'react';
import { Paper, Flex, TextInput, Select, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { tasksRepository } from '@/lib/repositories/tasksRepository';
import { useRouter } from 'next/navigation';

export function AddTaskForm() {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string | null>('Personal');
    const router = useRouter();

    const handleAddTask = async () => {
        if (!title.trim()) return;
        await tasksRepository.addTask(title, category || 'Uncategorized');
        setTitle('');
        // Refresh the server page to show new data
        router.refresh();
    };

    return (
        <Paper withBorder p="md" radius="md" shadow="sm">
            <Flex direction={{ base: 'column', sm: 'row' }} gap="md" align={{ base: 'stretch', sm: 'flex-end' }}>
                <TextInput
                    label="New Task"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                    }}
                />
                <Select
                    label="Category"
                    data={['Personal', 'Work', 'Health', 'Finance', 'Shopping']}
                    value={category}
                    onChange={setCategory}
                    w={{ base: '100%', sm: 150 }}
                    allowDeselect={false}
                />
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddTask}
                    disabled={!title.trim()}
                >
                    Add
                </Button>
            </Flex>
        </Paper>
    );
}
