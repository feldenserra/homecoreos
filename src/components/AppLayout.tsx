'use client';

import { AppShell, Burger, Group, NavLink, Text, ThemeIcon, ScrollArea, Divider, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHome, IconListCheck, IconChefHat, IconSettings, IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();

    const links = [
        { icon: IconHome, label: 'Home', href: '/' },
        { icon: IconListCheck, label: 'Tasks', href: '/tasks' },
        { icon: IconChefHat, label: 'Recipes', href: '/recipes' },
    ];

    const items = links.map((link) => (
        <NavLink
            key={link.label}
            component={Link}
            href={link.href}
            label={link.label}
            leftSection={<link.icon size="1rem" stroke={1.5} />}
            active={pathname === link.href}
            variant="light"
            onClick={() => {
                // Close menu on mobile when a link is clicked
                if (opened) toggle();
            }}
        />
    ));

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 200,
                breakpoint: 'md',
                collapsed: { mobile: !opened },
            }}
            padding="xs"
        >
            <AppShell.Header>
                <Group h="100%" px="xs">
                    <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
                    <Group gap="xs">
                        <ThemeIcon variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                            <IconHome size={18} />
                        </ThemeIcon>
                        <Text fw={700} fz="lg">HomeCoreOS</Text>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="xs">
                <AppShell.Section grow component={ScrollArea}>
                    {items}

                    <Divider my="sm" />

                    <NavLink
                        component={Link}
                        href="/settings"
                        label="Settings"
                        leftSection={<IconSettings size="1rem" stroke={1.5} />}
                        active={pathname === '/settings'}
                        variant="light"
                        onClick={() => { if (opened) toggle(); }}
                    />
                </AppShell.Section>
                <AppShell.Section>
                    <Divider my="sm" />
                    <Button
                        variant="light"
                        color="red"
                        fullWidth
                        leftSection={<IconLogout size="1rem" />}
                        onClick={async () => {
                            const { createClient } = await import('@/lib/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/auth/login';
                        }}
                    >
                        Logout
                    </Button>
                    <Text size="xs" c="dimmed" ta="center" pt="md">
                        v0.1.0 Beta
                    </Text>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main w="100%">
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
