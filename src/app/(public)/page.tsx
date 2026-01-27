'use client';

import { Container, Title, Text, Button, Group, Stack, ThemeIcon, SimpleGrid, Paper } from '@mantine/core';
import { IconCheck, IconRocket, IconShieldLock } from '@tabler/icons-react';
import Link from 'next/link';
import { ClientLinkButton } from '@/components/ClientLinkButton';

export default function MarketingPage() {
    return (
        <Container size="lg" py="xl">
            <Stack gap="xl" align="center" py="xl">
                <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <IconRocket size={40} />
                </ThemeIcon>

                <Title order={1} size="3.5rem" ta="center" style={{ lineHeight: 1.1 }}>
                    Your Personal
                    <Text span variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} inherit> Operating System</Text>
                </Title>

                <Text size="xl" c="dimmed" ta="center" maw={600}>
                    HomeCoreOS is the all-in-one workspace for your personal life.
                    Tasks, Recipes, Habits, and more - all in one privacy-focused,
                    open-source platform.
                </Text>

                <Group>
                    <ClientLinkButton href="/auth/register" size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        Get Started Free
                    </ClientLinkButton>
                    <ClientLinkButton href="/auth/login" size="xl" variant="default">
                        Login
                    </ClientLinkButton>
                </Group>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" mt={50}>
                <FeatureCard
                    icon={IconCheck}
                    title="Task Management"
                    description="Organize your life with a powerful, optimistic UI task manager that keeps you productive."
                />
                <FeatureCard
                    icon={IconRocket}
                    title="Recipe Organizer"
                    description="Save recipes, calculate macros, and manage your kitchen inventory with ease."
                />
                <FeatureCard
                    icon={IconShieldLock}
                    title="Private & Secure"
                    description="Your data is yours. Built with Supabase RLS enterprise-grade security."
                />
            </SimpleGrid>
        </Container>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <Paper withBorder p="xl" radius="md">
            <ThemeIcon variant="light" size="lg" radius="md" mb="md">
                <Icon size={20} />
            </ThemeIcon>
            <Title order={3} mb="sm">{title}</Title>
            <Text c="dimmed" lh={1.6}>
                {description}
            </Text>
        </Paper>
    );
}
