/*
    Copyright (C) 2026 feldenserra

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { Container, Title, Text, Button, Group, Stack, ThemeIcon, SimpleGrid, Paper } from '@mantine/core';
import { IconCheck, IconRocket, IconShieldLock } from '@tabler/icons-react';
import Link from 'next/link';

// NOTE: This is now a Server Component (no 'use client')
// To make Mantine Button work with Next Link in RSC, we wrap Button in Link
// or use Link as the interactive element.

export default function Home() {
    return (
        <Container size="lg" py="xl">
            <Stack gap="xl" align="center" ta="center" py="xl">
                <Title order={1} size="3rem" fw={900}
                    style={{
                        background: 'linear-gradient(to right, var(--mantine-color-blue-6), var(--mantine-color-cyan-6))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    HomeCoreOS
                </Title>
                <Text size="xl" c="dimmed" maw={600} mx="auto">
                    Your personal operating system for productivity. Manage tasks, recipes, and more in one secure, unified workspace.
                </Text>

                <Group>
                    {/* 
            Correct way to link in RSC: 
            Use Link as the container. Mantine Button is just a styled div/button.
          */}
                    <Link href="/auth/register" passHref legacyBehavior>
                        <Button component="a" size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/auth/login" passHref legacyBehavior>
                        <Button component="a" size="xl" variant="default">
                            Login
                        </Button>
                    </Link>
                </Group>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" mt={50}>
                <Feature
                    icon={IconCheck}
                    title="Task Management"
                    description="Organize your life with our powerful task tracking system. Categorize, prioritize, and conquer."
                />
                <Feature
                    icon={IconRocket}
                    title="Recipe Organizer"
                    description="Plan your meals and track nutrition with our integrated recipe database and macro calculator."
                />
                <Feature
                    icon={IconShieldLock}
                    title="Secure by Design"
                    description="Built with enterprise-grade security. Your data is encrypted and protected with Row Level Security."
                />
            </SimpleGrid>
        </Container>
    );
}

function Feature({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <Paper withBorder p="lg" radius="md">
            <ThemeIcon variant="light" size={40} radius={40}>
                <Icon size={20} />
            </ThemeIcon>
            <Text mt="sm" mb={7} fw={700} fz="lg">
                {title}
            </Text>
            <Text size="sm" c="dimmed" lh={1.6}>
                {description}
            </Text>
        </Paper>
    );
}
