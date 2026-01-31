'use client';

import { TextInput, Anchor, Paper, Group, Button, Alert, Text, Stack, PinInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
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
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const emailForm = useForm({
        initialValues: { email: '' },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    useEffect(() => setMounted(true), []);

    const handleSendOtp = async (values: typeof emailForm.values) => {
        setLoading(true);
        setError(null);
        try {
            const normalizedEmail = values.email.toLowerCase().trim();
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
            setEmail(normalizedEmail);
            setOtpCode('');
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send magic link');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
            if (error) throw error;
            router.push('/app');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try sending a new one.');
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
                        value={otpCode}
                        onChange={setOtpCode}
                    />
                    <Button fullWidth mt="md" onClick={handleVerifyOtp} loading={loading}>
                        Verify Code
                    </Button>
                    <Anchor component="button" type="button" size="sm" c="dimmed" onClick={() => { setStep('email'); setOtpCode(''); }}>
                        <Group gap={4}>
                            <IconArrowLeft size={12} />
                            Wrong email?
                        </Group>
                    </Anchor>
                </Stack>
            )}
        </Paper>
    );
}

