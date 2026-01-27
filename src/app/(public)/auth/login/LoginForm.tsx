'use client';

import { TextInput, PasswordInput, Checkbox, Anchor, Paper, Group, Button, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export function LoginForm() {
    const supabase = createClient();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length < 1 ? 'Password is required' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
        });

        if (error) {
            setError(error.message);
        } else {
            router.push('/app');
            router.refresh();
        }
    };

    return (
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Login Failed" color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="Email"
                    placeholder="you@mantine.dev"
                    required
                    {...form.getInputProps('email')}
                />
                <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    mt="md"
                    {...form.getInputProps('password')}
                />
                <Group justify="space-between" mt="lg">
                    <Checkbox label="Remember me" />
                    <Anchor component="button" size="sm" type="button">
                        Forgot password?
                    </Anchor>
                </Group>
                <Button fullWidth mt="xl" type="submit">
                    Sign in
                </Button>
            </form>
        </Paper>
    );
}

