'use client';

import { TextInput, Anchor, Paper, Group, Button, Alert, Text, Stack, PinInput, Center, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { IconAlertCircle, IconMail, IconArrowLeft } from '@tabler/icons-react';

export function LoginForm() {
    const supabase = createClient();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<'email' | 'verify'>('email');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form for Email Step
    const emailForm = useForm({
        initialValues: { email: '' },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    // Form for OTP Step
    const otpForm = useForm({
        initialValues: { code: '' },
        validate: {
            code: (value) => (value.length === 6 ? null : 'Code must be 6 digits'),
        },
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSendOtp = async (values: typeof emailForm.values) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            setEmail(values.email);
            setStep('verify');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send magic link');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (values: typeof otpForm.values) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: values.code,
                type: 'email',
            });

            if (error) throw error;

            router.push('/app');
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid code');
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

            {step === 'email' ? (
                <form onSubmit={emailForm.onSubmit(handleSendOtp)}>
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        required
                        leftSection={<IconMail size={16} />}
                        {...emailForm.getInputProps('email')}
                    />
                    <Button fullWidth mt="xl" type="submit" loading={loading}>
                        Send Magic Link
                    </Button>
                </form>
            ) : (
                <form onSubmit={otpForm.onSubmit(handleVerifyOtp)}>
                    <Stack align="center" gap="md">
                        <Title order={4}>Check your email</Title>
                        <Text size="sm" c="dimmed" ta="center">
                            We've sent a 6-digit code to <b>{email}</b>
                        </Text>

                        <PinInput
                            length={6}
                            type="number"
                            size="md"
                            oneTimeCode
                            autoFocus
                            {...otpForm.getInputProps('code')}
                        />

                        <Button fullWidth mt="md" type="submit" loading={loading}>
                            Verify Code
                        </Button>

                        <Anchor component="button" type="button" size="sm" c="dimmed" onClick={() => setStep('email')}>
                            <Group gap={4}>
                                <IconArrowLeft size={12} />
                                Wrong email?
                            </Group>
                        </Anchor>
                    </Stack>
                </form>
            )}
        </Paper>
    );
}

