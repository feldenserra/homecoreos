'use client';

import { useForm } from '@mantine/form';
import {
    Paper,
    Stack,
    Title,
    Text,
    Button,
    TextInput,
    ThemeIcon,
    Alert,
    Group,
    Divider
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { checkUsernameAvailability } from '@/lib/repositories/profileRepository';
import { Loader } from '@mantine/core';

export function ClientForm() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Username check state
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            username: '',
        },
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            username: (val) => (val.length < 3 ? 'Username must be at least 3 characters' : null),
        },
    });

    const handleUsernameBlur = async () => {
        const username = form.values.username;
        if (username.length < 3) return;

        setCheckingUsername(true);
        setUsernameError(null);

        const available = await checkUsernameAvailability(username);

        if (!available) {
            setUsernameError('Username is already taken');
        }
        setCheckingUsername(false);
    };

    const handleSubmit = async (values: typeof form.values) => {
        if (usernameError) return; // Block submit if username taken

        setLoading(true);
        setError(null);

        // Double check on submit just in case
        const available = await checkUsernameAvailability(values.username);
        if (!available) {
            setUsernameError('Username is already taken');
            setLoading(false);
            return;
        }

        try {
            // Using signInWithOtp for registration as well
            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        username: values.username,
                    }
                }
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Paper withBorder shadow="md" p={30} radius="md" mt={30} ta="center">
                <ThemeIcon size={60} radius={60} color="green" variant="light" mb="md">
                    <IconCheck size={30} />
                </ThemeIcon>
                <Title order={2} mb="md">Check your email!</Title>
                <Text c="dimmed" size="sm" mb="xl">
                    We've sent a login code to <b>{form.values.email}</b>.
                    <br />
                    Click the link or enter the code to verify your account.
                </Text>
                <Button component={Link} href="/auth/login" fullWidth variant="outline">
                    Go to Login
                </Button>
            </Paper>
        );
    }

    return (
        <Paper withBorder p="xl" radius="md" shadow="sm" bg="var(--mantine-color-body)">
            <Title order={3} mb="xl">Create Account</Title>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Registration Failed" color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="xl">
                    <Text size="sm" c="dimmed">
                        We use passwordless login. Key in your email and choose a username to get started.
                    </Text>

                    <TextInput
                        label="Username"
                        placeholder="your_username"
                        required
                        leftSection={<IconUser size={16} />}
                        rightSection={checkingUsername ? <Loader size="xs" /> : null}
                        {...form.getInputProps('username')}
                        onBlur={handleUsernameBlur}
                        error={form.errors.username || usernameError}
                    />

                    <TextInput
                        label="Email Address"
                        placeholder="matt.inez@email.com"
                        required
                        {...form.getInputProps('email')}
                    />

                    <Divider />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" component={Link} href="/auth/login">Back to Login</Button>
                        <Button type="submit" size="md" loading={loading}>Sign Up</Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
}
