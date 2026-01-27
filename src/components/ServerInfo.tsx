import { Paper, Title, Text, Code, Stack, Group, Badge, ThemeIcon } from '@mantine/core';
import { IconServer, IconShieldLock, IconDatabase } from '@tabler/icons-react';

// This is a Server Component by default (no 'use client')
export async function ServerInfo() {
    // Simulate a database fetch
    const serverTime = new Date().toISOString();

    // In a real app, this could be: const users = await db.users.findMany(...)
    const dbConfig = {
        region: "us-east-1",
        status: "healthy",
        latency: "24ms"
    };

    return (
        <Paper withBorder p="lg" radius="md" bg="var(--mantine-color-gray-0)">
            <Stack gap="lg">
                <Group>
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconServer size={20} />
                    </ThemeIcon>
                    <Box>
                        <Title order={5}>Server Context</Title>
                        <Text size="xs" c="dimmed">Generated on the server</Text>
                    </Box>
                </Group>

                <Box>
                    <Group gap="xs" mb={5}>
                        <IconShieldLock size={16} />
                        <Text size="sm" fw={500}>Secure Environment</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                        This component runs entirely on the backend.
                        API keys and database credentials used here are never exposed to the client browser.
                    </Text>
                </Box>

                <Box>
                    <Group gap="xs" mb={5}>
                        <IconDatabase size={16} />
                        <Text size="sm" fw={500}>Simulated DB Data</Text>
                    </Group>
                    <Code block mt="xs">
                        {JSON.stringify({
                            serverTime,
                            ...dbConfig
                        }, null, 2)}
                    </Code>
                </Box>

                <Group gap="xs">
                    <Badge color="green" variant="light">SEO Ready</Badge>
                    <Badge color="violet" variant="light">Zero Bundle Size</Badge>
                </Group>
            </Stack>
        </Paper>
    );
}

// Needed import for the component content
import { Box } from '@mantine/core';
