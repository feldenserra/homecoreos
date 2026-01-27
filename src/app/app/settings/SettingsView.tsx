'use client';

import { useState } from 'react';
import { Container, Title, Paper, Text, Avatar, Group, Divider, Button, Stack, TextInput, Modal, SegmentedControl, useMantineColorScheme, Textarea, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { IconLogout, IconAlertTriangle, IconSun, IconMoon, IconDeviceDesktop, IconBug } from '@tabler/icons-react';
import { User } from '@supabase/supabase-js';
import { createBugReport } from '@/lib/repositories/bugReportRepository';

interface SettingsViewProps {
    user: User;
}

export function SettingsView({ user }: SettingsViewProps) {
    const metadata = user.user_metadata || {};
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const [bugModalOpened, { open: openBugModal, close: closeBugModal }] = useDisclosure(false);

    const bugForm = useForm({
        initialValues: {
            title: '',
            description: '',
            steps: '',
            severity: 'medium',
        },
        validate: {
            title: (value) => (value.length < 5 ? 'Title is too short' : null),
            description: (value) => (value.length < 10 ? 'Description is too short' : null),
        },
    });

    const handleReportBug = async (values: typeof bugForm.values) => {
        try {
            await createBugReport({
                title: values.title,
                description: values.description,
                steps_to_reproduce: values.steps,
                severity: values.severity as any,
                status: 'open',
                device_metadata: { userAgent: navigator.userAgent }
            });
            closeBugModal();
            bugForm.reset();
            alert('Bug reported successfully! Thank you.');
        } catch (error) {
            alert('Failed to report bug. Please try again.');
        }
    };

    return (
        <Container size="sm" py="xl">
            <Title mb="xl">Account Settings</Title>

            <Modal opened={opened} onClose={close} title="Delete Account" centered>
                <Text size="sm" c="dimmed" mb="md">
                    This action is irreversible. To confirm, please type your email <b>{user.email}</b> below.
                </Text>

                <TextInput
                    placeholder={user.email}
                    mb="md"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.currentTarget.value)}
                    error={deleteConfirm && deleteConfirm !== user.email ? 'Email does not match' : null}
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button
                        color="red"
                        ml="xs"
                        disabled={deleteConfirm !== user.email}
                        onClick={() => alert('Feature coming soon: Delete Account')}
                    >
                        Delete Account
                    </Button>
                </Group>
            </Modal>

            <Modal opened={bugModalOpened} onClose={closeBugModal} title="Report a Bug" centered size="lg">
                <form onSubmit={bugForm.onSubmit(handleReportBug)}>
                    <Stack>
                        <TextInput
                            label="Title"
                            placeholder="Brief summary of the issue"
                            required
                            {...bugForm.getInputProps('title')}
                        />
                        <Select
                            label="Severity"
                            data={[
                                { value: 'low', label: 'Low - Minor annoyance' },
                                { value: 'medium', label: 'Medium - Normal bug' },
                                { value: 'high', label: 'High - Feature broken' },
                                { value: 'critical', label: 'Critical - App crash/Data loss' },
                            ]}
                            {...bugForm.getInputProps('severity')}
                        />
                        <Textarea
                            label="Description"
                            placeholder="What happened? What did you expect to happen?"
                            required
                            minRows={3}
                            {...bugForm.getInputProps('description')}
                        />
                        <Textarea
                            label="Steps to Reproduce"
                            placeholder="1. Go to page X&#10;2. Click button Y&#10;3. Observe error"
                            minRows={3}
                            {...bugForm.getInputProps('steps')}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeBugModal}>Cancel</Button>
                            <Button type="submit" color="red">Submit Report</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <Paper withBorder p="xl" radius="md">
                <Group mb="xl">
                    <Avatar size="xl" color="blue" radius="xl">
                        {(user.email?.[0] || 'U').toUpperCase()}
                    </Avatar>
                    <Stack gap={0}>
                        <Title order={3}>
                            @{metadata.username || 'username'}
                        </Title>
                    </Stack>
                </Group>

                <Divider my="md" label="Contact Info" labelPosition="left" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Email</Text>
                    <Text>{user.email}</Text>
                </Group>

                <Divider my="md" label="Appearance" labelPosition="left" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Theme</Text>
                    <SegmentedControl
                        value={colorScheme}
                        onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
                        data={[
                            { label: <Group gap={4}><IconSun size={16} /> Light</Group>, value: 'light' },
                            { label: <Group gap={4}><IconMoon size={16} /> Dark</Group>, value: 'dark' },
                            { label: <Group gap={4}><IconDeviceDesktop size={16} /> Auto</Group>, value: 'auto' },
                        ]}
                    />
                </Group>

                <Divider my="md" />

                <Title order={5} mb="xs">Account Actions</Title>
                <Button
                    variant="light"
                    color="gray"
                    fullWidth
                    mb="xl"
                    leftSection={<IconLogout size={16} />}
                    onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/auth/login';
                    }}
                >
                    Log Out
                </Button>

                <Button
                    variant="light"
                    color="orange"
                    fullWidth
                    mb="xl"
                    leftSection={<IconBug size={16} />}
                    onClick={openBugModal}
                >
                    Report a Bug
                </Button>

                <Paper withBorder p="md" radius="md" style={{ borderColor: 'var(--mantine-color-red-3)', backgroundColor: 'var(--mantine-color-red-0)' }}>
                    <Group mb="xs">
                        <IconAlertTriangle color="red" size={20} />
                        <Title c="red" order={5}>Danger Zone</Title>
                    </Group>
                    <Text size="sm" c="dimmed" mb="md">
                        Once you delete your account, there is no going back. Please be certain.
                    </Text>

                    <Button
                        color="red"
                        fullWidth
                        onClick={() => {
                            setDeleteConfirm('');
                            open();
                        }}
                    >
                        Delete Account
                    </Button>
                </Paper>
            </Paper>
        </Container>
    );
}
