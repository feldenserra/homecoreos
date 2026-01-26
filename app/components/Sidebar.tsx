'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  IconCalendarStats,
  IconHome2,
  IconSettings,
  IconBowl,
} from '@tabler/icons-react';
import { Center, Stack, Tooltip, UnstyledButton, rem } from '@mantine/core';

const mockdata = [
  { icon: IconHome2, label: 'Home', link: '/' },
  { icon: IconBowl, label: 'Recipes', link: '/recipes' },
  { icon: IconCalendarStats, label: 'Calendar', link: '/calendar' },
  { icon: IconSettings, label: 'Settings', link: '/settings' },
];

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  active?: boolean;
  link?: string;
  onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, link, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        component={link ? Link as any : undefined}
        href={link || '#'}
        onClick={onClick}
        data-active={active || undefined}
        style={{
          width: rem(50),
          height: rem(50),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'var(--mantine-color-dark-filled)' : 'var(--mantine-color-gray-5)',
          transition: 'color 0.2s',
        }}
      >
        <Icon style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const links = mockdata.map((item) => (
    <NavbarLink
      {...item}
      key={item.label}
      active={item.link === '/' ? pathname === '/' : pathname.startsWith(item.link)}
    />
  ));

  return (
    <nav className="h-full w-full flex flex-col items-center py-8">
      <Center mb={40}>
        {/* Minimalist Logo Placeholder */}
        <div className="w-8 h-8 bg-black rounded-lg"></div>
      </Center>

      <div className="flex-1">
        <Stack justify="center" gap="lg">
          {links}
        </Stack>
      </div>
    </nav>
  );
}