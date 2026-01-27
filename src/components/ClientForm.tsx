'use client';

import { useForm } from '@mantine/form';
import { Box, Code, Paper, Stack, Group, Title, Text } from '@mantine/core';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { PasswordInput } from '@/components/PasswordInput';
import { Select } from '@/components/Select';
import { Checkbox } from '@/components/Checkbox';

export function ClientForm() {
    const form = useForm({
        initialValues: {
            email: '',
            username: '',
            password: '',
            role: '',
            terms: false,
        },

        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            username: (value) => (value.length < 2 ? 'Username must have at least 2 letters' : null),
            password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
            role: (value) => (value ? null : 'Please select a role'),
            terms: (value) => (value ? null : 'You must accept terms and conditions'),
        },
    });

    return (
        <Paper withBorder p="lg" radius="md" shadow="sm">
            <Title order={5} mb="md">Interactive Register Form</Title>
            <form onSubmit={form.onSubmit((values) => console.log(values))}>
                <Stack gap="md">
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        required
                        {...form.getInputProps('email')}
                    />

                    <TextInput
                        label="Username"
                        placeholder="johndoe"
                        required
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        {...form.getInputProps('password')}
                    />

                    <Select
                        label="Role"
                        placeholder="Pick one"
                        data={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'user', label: 'User' },
                            { value: 'guest', label: 'Guest' },
                        ]}
                        required
                        {...form.getInputProps('role')}
                    />

                    <Checkbox
                        label="I agree to terms and conditions"
                        {...form.getInputProps('terms', { type: 'checkbox' })}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button type="submit">Register</Button>
                    </Group>
                </Stack>
            </form>

            <Box mt="lg">
                <Text size="xs" fw={500} mb={5}>Real-time State (Client-side):</Text>
                <Code block>{JSON.stringify(form.values, null, 2)}</Code>
            </Box>
        </Paper>
    );
}
