import { Container, Stack, Title, Text, SimpleGrid, Box } from '@mantine/core';
import { ClientForm } from '@/components/ClientForm';
import { ServerInfo } from '@/components/ServerInfo';

export default function Home() {
    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Box>
                    <Title order={1} mb="sm">Client vs Server Component Demo</Title>
                    <Text size="lg" c="dimmed">
                        This page demonstrates the composition of Client and Server components in the Next.js App Router.
                    </Text>
                </Box>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack>
                        <Title order={4}>Client Side</Title>
                        <Text size="sm" c="dimmed" mb="md">
                            Rendered in the browser (after hydration). Has access to window, hooks, and interactivity.
                        </Text>
                        <ClientForm />
                    </Stack>

                    <Stack>
                        <Title order={4}>Server Side</Title>
                        <Text size="sm" c="dimmed" mb="md">
                            Rendered on the server. No JS bundle for logic. Secure access to backend resources.
                        </Text>
                        <ServerInfo />
                    </Stack>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}


