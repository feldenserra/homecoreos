'use client';

import { Container, Group, Anchor, Text, Stack, Divider } from '@mantine/core';
import Link from 'next/link';

const legalLinks = [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Refund Policy', href: '/legal/refund' },
];

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--mantine-color-default-border)',
            backgroundColor: 'var(--mantine-color-body)'
        }}>
            <Container size="lg" py="xl">
                <Stack gap="md" align="center">
                    <Group gap="lg" justify="center">
                        {legalLinks.map((link) => (
                            <Anchor
                                key={link.href}
                                component={Link}
                                href={link.href}
                                size="sm"
                                c="dimmed"
                            >
                                {link.label}
                            </Anchor>
                        ))}
                    </Group>
                    <Divider w="100%" maw={400} />
                    <Text size="xs" c="dimmed" ta="center">
                        © {currentYear} HomeCoreOS. All rights reserved.
                    </Text>
                </Stack>
            </Container>
        </footer>
    );
}
