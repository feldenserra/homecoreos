'use client';

import { TextInput, Anchor, Paper, Group, Button, Alert, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { getURL } from '@/utils/get-url';

export function LoginForm() {
    const supabase = createClient();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    const handleLogin = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) throw error;

            router.push('/app');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleLogin)}>
                <TextInput
                    label="Email"
                    placeholder="matt.inez@email.com"
                    required
                    {...form.getInputProps('email')}
                />
                <TextInput
                    label="Password"
                    placeholder="Your password"
                    required
                    mt="md"
                    type="password"
                    {...form.getInputProps('password')}
                />
                <Button fullWidth mt="xl" type="submit" loading={loading}>
                    Login
                </Button>
            </form>
        </Paper>
    );
}

