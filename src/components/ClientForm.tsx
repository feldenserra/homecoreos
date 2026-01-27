'use client';

import { useForm } from '@mantine/form';
import {
    Box,
    Code,
    Paper,
    Stack,
    Group,
    Title,
    Text,
    Button,
    TextInput,
    PasswordInput,
    Select,
    Checkbox,
    NumberInput,
    Textarea,
    Divider,
    Grid,
    Switch,
    SegmentedControl
} from '@mantine/core';
import { IconUser, IconLock, IconBriefcase, IconSettings } from '@tabler/icons-react';

import { createClient } from '@/lib/supabase/client';

export function ClientForm() {
    const supabase = createClient();
    const form = useForm({
        initialValues: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            username: (val) => (val.length < 4 ? 'Username must be at least 4 characters' : null),
            password: (val) => (val.length < 8 ? 'Password must be at least 8 characters' : null),
            confirmPassword: (val, values) => (val !== values.password ? 'Passwords do not match' : null),
        },
    });

    return (
        <Paper withBorder p="xl" radius="md" shadow="sm" bg="var(--mantine-color-body)">
            <Title order={3} mb="xl">Comprehensive Registration</Title>

            <form onSubmit={form.onSubmit(async (values) => {
                const { data, error } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        data: {
                            username: values.username,
                        }
                    }
                });

                if (error) {
                    console.error('Signup error:', error);
                    alert(`Error signing up: ${error.message}`);
                } else {
                    console.log('Signup successful:', data);
                    alert('Registration successful! Check your email for verification (or if dev mode, just login).');
                }
            })}>
                <Stack gap="xl">

                    {/* Section 1: Personal Information */}
                    <Box>
                        <Group mb="md">
                            <IconUser size={20} color="var(--mantine-color-blue-6)" />
                            <Title order={5}>Personal Information</Title>
                        </Group>
                        <Grid>

                            <Grid.Col span={{ base: 12, sm: 6 }}>
                                <TextInput
                                    label="Email Address"
                                    placeholder="jane.doe@example.com"
                                    required
                                    withAsterisk
                                    {...form.getInputProps('email')}
                                />
                            </Grid.Col>

                        </Grid>
                    </Box>

                    <Divider />

                    {/* Section 2: Account Security */}
                    <Box>
                        <Group mb="md">
                            <IconLock size={20} color="var(--mantine-color-red-6)" />
                            <Title order={5}>Account Security</Title>
                        </Group>
                        <Stack gap="md">
                            <TextInput
                                label="Username"
                                description="This will be your unique handle on the platform"
                                placeholder="janedoe_dev"
                                required
                                withAsterisk
                                {...form.getInputProps('username')}
                            />
                            <Grid>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    <PasswordInput
                                        label="Password"
                                        placeholder="Create a strong password"
                                        required
                                        withAsterisk
                                        {...form.getInputProps('password')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    <PasswordInput
                                        label="Confirm Password"
                                        placeholder="Confirm your password"
                                        required
                                        withAsterisk
                                        {...form.getInputProps('confirmPassword')}
                                    />
                                </Grid.Col>
                            </Grid>
                        </Stack>
                    </Box>

                    <Divider />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => form.reset()}>Reset</Button>
                        <Button type="submit" size="md">Create Account</Button>
                    </Group>

                    <Text ta="right" size="sm" mt="sm">
                        <b>Note:</b> This registers a new user in Supabase.
                        Once registered, you can create Tasks which are secured by RLS.
                    </Text>
                </Stack>
            </form>
        </Paper>
    );
}
