'use client'

import { Checkbox, Group, Text, ActionIcon, Paper, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react'; // Using IconX to replace the text "X"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as taskRepo from '../actions/tasks';
import { TaskModel } from '@/generated/prisma/models'; // Keeping your Prisma import

export default function TaskItem(task: TaskModel) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    try {
      await taskRepo.toggleStatus(task.id);
      router.refresh(); // Tells Next.js to re-fetch data and update UI
    } catch (e) {
      console.error("Failed to toggle task", e);
      // Optional: Add alert here if needed
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
      p="sm" 
      radius="md" 
      // This group class allows us to target children on hover (for the delete button)
      className="group hover:shadow-sm transition-all"
      style={{ opacity: isPending ? 0.5 : 1 }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        
        {/* Left Side: Checkbox + Text */}
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Checkbox 
            checked={task.done} 
            onChange={handleToggle} 
            radius="xl"
            mt={4} // Slight offset to align with text top
            size="md"
          />
          
          <Stack gap={2}>
            <Text 
              fw={500}
              td={task.done ? 'line-through' : undefined} 
              c={task.done ? 'dimmed' : undefined}
            >
              {task.name}
            </Text>
            
            <Group gap="xs">
                <Text size="xs" c="dimmed">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                </Text>
                
                {task.done && task.doneAt && (
                    <Text size="xs" c="green">
                        • Completed: {new Date(task.doneAt).toLocaleDateString()}
                    </Text>
                )}
            </Group>
          </Stack>
        </Group>

        {/* Right Side: Delete Button */}
        {/* 'opacity-0 group-hover:opacity-100' makes it hide until you hover the row */}
        <ActionIcon 
            variant="subtle" 
            color="red" 
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete task"
        >
          <IconX size={18} />
        </ActionIcon>

      </Group>
    </Paper>
  );
}