import { 
  Title, Text, Badge, Paper, Group, ThemeIcon, Box, Center, 
  Stack // 👈 Re-introducing Stack
} from '@mantine/core';
import { IconCheck, IconInbox } from '@tabler/icons-react';
import * as taskRepo from './actions/tasks';

import NewTaskForm from './components/NewTaskForm';
import TaskItem from './components/TaskItem';
import FilterToggle from './components/FilterToggle';

export default async function Dashboard(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || 'active';
  const showCompleted = filter === 'done';

  const data = await taskRepo.getAll(showCompleted);
  const visibleTasks = data.tasks.filter(x => x.done === showCompleted);
  
  return (
    // 1. Re-introduced <Box> (Replaces div className="p-6")
    <Box p="md">
      
      {/* ⚠️ KEEPING TAILWIND GRID FOR SAFETY (Just for this step) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* --- LEFT SIDEBAR --- */}
        <div className="md:col-span-3">
          
          {/* 2. Re-introduced <Stack> (Replaces flex flex-col) */}
          <Stack gap="md">
            
            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                View
              </Text>
              <FilterToggle />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Add New
              </Text>
              <NewTaskForm />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Lifetime Tasks
                </Text>
                <ThemeIcon variant="light" color="blue" radius="xl">
                   <IconInbox size={16} />
                </ThemeIcon>
              </Group>
              <Group align="flex-end" gap="xs" mt="xs">
                <Text fw={700} size="xl" lh={1}>{data.total}</Text>
                <Text size="sm" c="dimmed" mb={2}>total</Text>
              </Group>
            </Paper>

          </Stack>
        </div>


        {/* --- MAIN CONTENT --- */}
        <div className="md:col-span-9">
          
          <Group justify="space-between" align="flex-end" mb="lg">
            <Title order={2}>
              {showCompleted ? 'Archive' : 'My Tasks'}
            </Title>
            <Badge size="lg" variant="dot" color={showCompleted ? 'gray' : 'blue'}>
              {visibleTasks.length} items
            </Badge>
          </Group>

          {/* 3. Re-introduced <Stack> here too */}
          <Stack gap="sm">
            {visibleTasks.map((task) => (
              <Box key={task.id}>
                <TaskItem {...task} />
              </Box>
            ))}

            {visibleTasks.length === 0 && (
              <Paper withBorder p="xl" radius="md" mt="xl">
                <Center>
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                      <IconCheck size={30} />
                    </ThemeIcon>
                    <Title order={3} mt="sm">All caught up</Title>
                    <Text c="dimmed">
                      {showCompleted 
                        ? "No archived tasks found." 
                        : "You have no pending tasks."}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Stack>

        </div>
      </div>
    </Box>
  );
}