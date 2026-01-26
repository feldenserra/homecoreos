'use client';

import { useForm } from '@mantine/form';
import { TextInput, Button, Group } from '@mantine/core';
import * as taskRepo from '../actions/tasks';
import { IconPlus } from '@tabler/icons-react';

export default function NewTaskForm() {
  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Name is required' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await taskRepo.create(values.name, 'Personal');
    form.reset();
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Group align="flex-start" gap="xs">
        <TextInput
          placeholder="New Task..."
          style={{ flex: 1 }}
          {...form.getInputProps('name')}
        />
        <Button
          type="submit"
          variant="filled"
          color="black"
          radius="md"
          loading={form.submitting}
        >
          <IconPlus size={18} />
        </Button>
      </Group>
    </form>
  );
}