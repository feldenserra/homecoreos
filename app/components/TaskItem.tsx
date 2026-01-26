'use client';

import { Checkbox, Group, Text, ActionIcon, Paper, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as taskRepo from '../actions/tasks';
import { TaskModel } from '@/generated/prisma/models';

export default function TaskItem(task: TaskModel) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    try {
      await taskRepo.toggleStatus(task.id);
      router.refresh();
    } catch (e) {
      console.error("Failed to toggle task", e);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsPending(true);
    try {
      await taskRepo.deleteTask(task.id);
      router.refresh();
    } catch (e) {
      console.error("Failed to delete task", e);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      className="group transition-all hover:bg-gray-50"
      style={{ opacity: isPending ? 0.6 : 1, transition: 'background-color 0.2s, opacity 0.2s' }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">

        <Group align="center" wrap="nowrap" gap="md">
          <Checkbox
            checked={task.done}
            onChange={handleToggle}
            radius="xl"
            size="md"
            color="dark"
          />

          <Stack gap={0}>
            <Text
              fw={500}
              size="sm"
              td={task.done ? 'line-through' : undefined}
              c={task.done ? 'dimmed' : 'dark'}
            >
              {task.name}
            </Text>

            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {new Date(task.createdAt).toLocaleDateString()}
              </Text>
            </Group>
          </Stack>
        </Group>

        <ActionIcon
          variant="transparent"
          color="gray"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete task"
        >
          <IconX size={16} />
        </ActionIcon>

      </Group>
    </Paper>
  );
}