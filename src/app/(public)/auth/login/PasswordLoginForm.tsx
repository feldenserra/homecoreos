'use client';

import { TextInput, PasswordInput, Paper, Button, Alert, Stack, Anchor, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { IconAlertCircle, IconMail, IconLock } from '@tabler/icons-react';

export function PasswordLoginForm() {
    const supabase = createClient();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: { email: '', password: '', confirmPassword: '' },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
            confirmPassword: (value, values) =>
                mode === 'register'
                    ? (value === values.password ? null : 'Passwords do not match')
                    : null,
        },
    });

    useEffect(() => setMounted(true), []);

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
        form.setFieldValue('confirmPassword', '');
    };

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);
        try {
            const normalizedEmail = values.email.toLowerCase().trim();

            if (mode === 'login') {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password: values.password,
                });
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: values.password,
                });
                if (signUpError) throw signUpError;
            }

            router.push('/app');
            router.refresh();
        } catch (err: any) {
            setError(err.message || `Failed to ${mode}`);
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        required
                        leftSection={<IconMail size={16} />}
                        {...form.getInputProps('email')}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        leftSection={<IconLock size={16} />}
                        {...form.getInputProps('password')}
                    />
                    {mode === 'register' && (
                        <PasswordInput
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            required
                            leftSection={<IconLock size={16} />}
                            {...form.getInputProps('confirmPassword')}
                        />
                    )}
                    <Button fullWidth mt="md" type="submit" loading={loading}>
                        {mode === 'login' ? 'Login' : 'Create Account'}
                    </Button>
                </Stack>
            </form>

            <Group justify="center" mt="md">
                <Anchor component="button" type="button" size="sm" c="dimmed" onClick={switchMode}>
                    {mode === 'login'
                        ? "Don't have an account? Register"
                        : 'Already have an account? Login'}
                </Anchor>
            </Group>
        </Paper>
    );
}
