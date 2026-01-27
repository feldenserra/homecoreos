'use client';

import { TextInput, Anchor, Paper, Group, Button, Alert, Text } from '@mantine/core';
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
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            token: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            token: (value) => (codeSent && value.length < 6 ? 'Code must be at least 6 digits' : null),
        },
    });

    const handleSendCode = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: form.values.email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                }
            });

            if (error) throw error;
            setCodeSent(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: values.email,
                token: values.token,
                type: 'email'
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

            {!codeSent ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}>
                    <TextInput
                        label="Email"
                        placeholder="matt.inez@email.com"
                        required
                        {...form.getInputProps('email')}
                    />
                    <Button fullWidth mt="xl" type="submit" loading={loading}>
                        Send Login Code
                    </Button>
                </form>
            ) : (
                <form onSubmit={form.onSubmit(handleVerifyCode)}>
                    <Text size="sm" ta="center" mb="md">
                        Enter the code sent to <b>{form.values.email}</b>
                    </Text>
                    <TextInput
                        label="Login Code"
                        placeholder="123456"
                        required
                        maxLength={8}
                        data-autofocus
                        {...form.getInputProps('token')}
                    />
                    <Button fullWidth mt="xl" type="submit" loading={loading}>
                        Verify & Login
                    </Button>
                    <Group justify="center" mt="md">
                        <Anchor component="button" size="sm" type="button" c="dimmed" onClick={() => setCodeSent(false)}>
                            Use a different email
                        </Anchor>
                    </Group>
                </form>
            )}
        </Paper>
    );
}

