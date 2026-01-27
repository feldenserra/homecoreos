'use client';

import { Paper, Text, Group, ActionIcon, rem } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { PlannerTaskRow } from '@/lib/repositories/plannerRepository';
import { useState } from 'react';

interface PlannerTaskProps {
    task: PlannerTaskRow;
    onDelete: (taskId: string) => Promise<void>;
}

export function PlannerTask({ task, onDelete }: PlannerTaskProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(task.id);
        setIsDeleting(false); // In case it fails or optimistic update reverts
    };

    return (
        <Paper
            shadow="xs"
            p="xs"
            radius="md"
            withBorder
            style={{
                cursor: 'grab',
                backgroundColor: 'var(--mantine-color-body)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-xs)';
            }}
        >
            <Group justify="space-between" align="start" wrap="nowrap">
                <Text size="sm" style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                    {task.content}
                </Text>
                <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={handleDelete}
                    loading={isDeleting}
                    aria-label="Delete task"
                >
                    <IconTrash style={{ width: rem(14), height: rem(14) }} />
                </ActionIcon>
            </Group>
        </Paper>
    );
}
