'use client';

import { Container, Title, Text, Button, Stack } from '@mantine/core';
import Link from 'next/link';

export default function NotFound() {
    return (
        <Container size="sm" py={120}>
            <Stack align="center" gap="xl">
                <Title order={1} size="6rem" c="dimmed" style={{ fontWeight: 900 }}>
                    404
                </Title>
                <Title order={2}>Page Not Found</Title>
                <Text c="dimmed" ta="center" maw={400}>
                    The page you're looking for doesn't exist or has been moved.
                </Text>
                <Button component={Link} href="/" size="lg" variant="light" color="indigo">
                    Go Home
                </Button>
            </Stack>
        </Container>
    );
}
