'use client';

import { Paper, Group, ThemeIcon, Text } from '@mantine/core';
import Link from 'next/link';

interface DashboardCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

export function DashboardCard({ title, description, icon, href, color }: DashboardCardProps) {
    return (
        <Paper
            component={Link}
            href={href}
            withBorder
            p="xl"
            radius="md"
            style={{
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'block'
            }}
        >
            <Group>
                <ThemeIcon size="xl" radius="md" color={color} variant="light">
                    {icon}
                </ThemeIcon>
                <div>
                    <Text size="lg" fw={500}>{title}</Text>
                    <Text size="sm" c="dimmed">{description}</Text>
                </div>
            </Group>
        </Paper>
    );
}
