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
                            @{metadata.username || 'username'}
                        </Title>
                    </Stack>
                </Group>

                <Divider my="md" label="Contact Info" labelPosition="left" />

                <Group justify="space-between" mb="xs">
                    <Text fw={500}>Email</Text>
                    <Text>{user.email}</Text>
                </Group>

                <Divider my="md" />

                <Button variant="light" color="red" fullWidth onClick={() => alert('Feature coming soon: Delete Account')}>
                    Delete Account
                </Button>
            </Paper>
        </Container>
    );
}
