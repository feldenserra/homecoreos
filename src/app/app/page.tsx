import { Container, Title, SimpleGrid } from '@mantine/core';
import { IconListCheck, IconChefHat, IconNotebook, IconTrophy } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from './DashboardCard';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">
                Welcome back, {user?.user_metadata?.first_name || 'User'}!
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <DashboardCard
                    title="My Tasks"
                    description="View and manage your todo list."
                    icon={<IconListCheck size={24} />}
                    href="/app/tasks"
                    color="blue"
                />
                <DashboardCard
                    title="Recipes"
                    description="Plan your meals and nutrition."
                    icon={<IconChefHat size={24} />}
                    href="/app/recipes"
                    color="green"
                />
                <DashboardCard
                    title="Daily Notes"
                    description="Capture thoughts and history."
                    icon={<IconNotebook size={24} />}
                    href="/app/notes"
                    color="orange"
                />
                <DashboardCard
                    title="Achievements"
                    description="Visualize your progress."
                    icon={<IconTrophy size={24} />}
                    href="/app/achievements"
                    color="yellow"
                />
            </SimpleGrid>
        </Container>
    );
}
