import { Container, Title, SimpleGrid } from '@mantine/core';
import { NAV_LINKS } from '@/config/navLinks';
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
                {NAV_LINKS
                    .filter(link => link.label !== 'Dashboard' && link.label !== 'Settings')
                    .map((link) => (
                        <DashboardCard
                            key={link.label}
                            title={link.label}
                            description={link.description || ''}
                            icon={<link.icon size={24} />}
                            href={link.href}
                            color={link.color || 'blue'}
                        />
                    ))}
            </SimpleGrid>
        </Container>
    );
}
