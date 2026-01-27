'use client';

import { ActionIcon, useMantineColorScheme, Group } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function FloatingThemeToggle() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
        <Group pos="fixed" bottom={20} left={20} style={{ zIndex: 1000 }}>
            <ActionIcon
                onClick={() => toggleColorScheme()}
                size="lg"
                radius="xl"
                variant="default"
                aria-label="Toggle color scheme"
            >
                {colorScheme === 'dark' ? (
                    <IconSun size={18} stroke={1.5} />
                ) : (
                    <IconMoon size={18} stroke={1.5} />
                )}
            </ActionIcon>
        </Group>
    );
}
