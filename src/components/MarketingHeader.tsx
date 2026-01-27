'use client';

import { Container, Group, Title, Button, ThemeIcon, Text } from '@mantine/core';
import { IconHome, IconBrandGithub } from '@tabler/icons-react';
import Link from 'next/link';

export function MarketingHeader() {
    return (
        <header style={{ height: 60, borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Container size="xl" h="100%">
                <Group justify="space-between" h="100%">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Group gap="xs">
                            <ThemeIcon variant="filled" size="md">
                                <IconHome size={18} />
                            </ThemeIcon>
                            <Text fw={700} fz="lg">HomeCoreOS</Text>
                        </Group>
                    </Link>

                    <Group gap="xs">
                        <Button
                            component="a"
                            href="https://github.com/feldenserra/homecoreos"
                            target="_blank"
                            variant="filled"
                            color="black"
                            radius="xl"
                            leftSection={<IconBrandGithub size={16} />}
                        >
                            GitHub
                        </Button>
                        <Button component={Link} href="/auth/login" variant="filled" color="indigo.7">
                            Login
                        </Button>
                    </Group>
                </Group>
            </Container>
        </header>
    );
}
