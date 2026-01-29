import {
    IconHome,
    IconListCheck,
    IconCalendarWeek,
    IconChefHat,
    IconNotebook,
    IconTrophy,
    IconCurrencyDollar,
    IconSettings,
} from '@tabler/icons-react';

export interface NavLink {
    label: string;
    icon: any; // Using any for icon component type for simplicity with Tabler icons
    href: string;
    description?: string;
    color?: string; // Mantine color for dashboard cards
}

export const NAV_LINKS: NavLink[] = [
    {
        label: 'Dashboard',
        icon: IconHome,
        href: '/app',
        description: 'Overview of your personal OS.',
        color: 'blue',
    },
    {
        label: 'Tasks',
        icon: IconListCheck,
        href: '/app/tasks',
        description: 'View and manage your todo list.',
        color: 'blue',
    },
    {
        label: 'Weekly Planner',
        icon: IconCalendarWeek,
        href: '/app/planner',
        description: 'Plan your week ahead.',
        color: 'violet',
    },
    {
        label: 'Recipes',
        icon: IconChefHat,
        href: '/app/recipes',
        description: 'Plan your meals and nutrition.',
        color: 'green',
    },
    {
        label: 'Notes',
        icon: IconNotebook,
        href: '/app/notes',
        description: 'Capture thoughts and history.',
        color: 'orange',
    },
    {
        label: 'Achievements',
        icon: IconTrophy,
        href: '/app/achievements',
        description: 'Visualize your progress.',
        color: 'yellow',
    },
    {
        label: 'Finance',
        icon: IconCurrencyDollar,
        href: '/app/finance',
        description: 'Track your expenses and budget.',
        color: 'teal',
    },
    {
        label: 'Settings',
        icon: IconSettings,
        href: '/app/settings',
        description: 'Configure your application.',
        color: 'gray',
    },
];
