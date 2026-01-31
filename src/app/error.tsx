'use client';

import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <Container size="sm" py={120}>
            <Stack align="center" gap="xl">
                <IconAlertTriangle size={64} color="var(--mantine-color-red-6)" />
                <Title order={1} ta="center">
                    Something went wrong
                </Title>
                <Text c="dimmed" ta="center" maw={400}>
                    An unexpected error occurred. We've been notified and are working to fix it.
                </Text>
                <Button onClick={() => reset()} size="lg" variant="light" color="indigo">
                    Try Again
                </Button>
            </Stack>
        </Container>
    );
}
