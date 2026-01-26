'use client'

import { usePathname } from 'next/navigation'; // 1. Hook to check URL
import Link from 'next/link'; // 2. Component for navigation
import {
  IconCalendarStats,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconGauge,
  IconHome2,
  IconLogout,
  IconSettings,
  IconBowl,
  IconSwitchHorizontal,
  IconUser,
} from '@tabler/icons-react';
import { Center, Stack, Tooltip, UnstyledButton, rem } from '@mantine/core';

// 3. Add actual routes to your data
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
        // 4. This makes the button a real link
        component={link ? Link as any : undefined} 
        href={link || '#'} 
        onClick={onClick}
        data-active={active || undefined}
        className=""
      >
        {/* 5. Icon Size Increased: rem(20) -> rem(34) */}
        <Icon style={{ width: rem(34), height: rem(34) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname(); // Get current URL

  const links = mockdata.map((item) => (
    <NavbarLink
      {...item}
      key={item.label}
      // 6. Highlight if current path matches link
      active={item.link === '/' ? pathname === '/' : pathname.startsWith(item.link)}
    />
  ));

  return (
    // 7. Increased sidebar width to fit larger buttons (w-[80px] -> w-[100px])
    <nav className="h-full w-[100px] p-4 flex flex-col border-r border-blue-400">
      <Center>
         <span className="font-bold text-white text-xl">Logo</span>
      </Center>

      <div className="flex-1 mt-[50px]">
        <Stack justify="center" gap="md">
          {links}
        </Stack>
      </div>
    </nav>
  );
}