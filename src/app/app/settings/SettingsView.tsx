'use client';

import { Container, Title, Paper, Text, Avatar, Group, Divider, Button, Stack } from '@mantine/core';
import { User } from '@supabase/supabase-js';

interface SettingsViewProps {
    user: User;
}

export function SettingsView({ user }: SettingsViewProps) {
    const metadata = user.user_metadata || {};

    return (
        <Container size="sm" py="xl">
            <Title mb="xl">Account Settings</Title>

            <Paper withBorder p="xl" radius="md">
                <Group mb="xl">
                    <Avatar size="xl" color="blue" radius="xl">
                        {(user.email?.[0] || 'U').toUpperCase()}
                    </Avatar>
                    <Stack gap={0}>
                        <Title order={3}>
                            {metadata.first_name || 'User'} {metadata.last_name || ''}
                        </Title>
                        <Text c="dimmed">@{metadata.username || 'username'}</Text>
                    </Stack>
                </Group>

                <Divider my="md" label="Contact Info" labelPosition="left" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Email</Text>
                    <Text>{user.email}</Text>
                </Group>
                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Phone</Text>
                    <Text>{metadata.phone || 'Not provided'}</Text>
                </Group>

                <Divider my="md" label="Professional" labelPosition="left" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Job Title</Text>
                    <Text>{metadata.job_title || 'N/A'}</Text>
                </Group>
                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Experience</Text>
                    <Text>{metadata.experience_years ? `${metadata.experience_years} years` : 'N/A'}</Text>
                </Group>

                <Divider my="md" />

                <Button variant="light" color="red" fullWidth onClick={() => alert('Feature coming soon: Delete Account')}>
                    Delete Account
                </Button>
            </Paper>
        </Container>
    );
}
