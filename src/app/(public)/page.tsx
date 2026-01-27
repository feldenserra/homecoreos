'use client';

import { Container, Title, Text, Stack, SimpleGrid, Paper, ThemeIcon, Box, Blockquote, Button } from '@mantine/core';
import { IconCheck, IconRocket, IconShieldLock, IconLeaf, IconTrophy, IconNotebook, IconChefHat, IconArrowRight, IconBrain, IconClock } from '@tabler/icons-react';
import { ClientLinkButton } from '@/components/ClientLinkButton';
import { useIntersection } from '@mantine/hooks';
import { useRef } from 'react';

// --- Animation Component ---
function FadeIn({ children, delay = 0, y = 20, style }: { children: React.ReactNode, delay?: number, y?: number, style?: React.CSSProperties }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { ref, entry } = useIntersection({
        root: null,
        threshold: 0.1,
    });

    // Merge refs
    const setRefs = (element: HTMLDivElement) => {
        // @ts-ignore
        ref(element);
        // @ts-ignore
        containerRef.current = element;
    };

    const isVisible = entry?.isIntersecting;

    return (
        <div
            ref={setRefs}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : `translateY(${y}px)`,
                transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
                willChange: 'opacity, transform',
                ...style
            }}
        >
            {children}
        </div>
    );
}

export default function MarketingPage() {
    return (
        <Box>
            {/* Hero Section */}
            <Container size="xl" py={80} pb={120}>
                <Stack gap="xl" align="center" py={40}>
                    <FadeIn y={50}>
                        <Title order={1} size="4rem" ta="center" style={{ lineHeight: 1.1, fontWeight: 900 }}>
                            Finding Balance in the <Text span inherit c="indigo.7" component="span">Chaos</Text>.
                        </Title>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <Text size="xl" c="dimmed" ta="center" maw={700} mx="auto">
                            A personal operating system to bring rhyme and rhythm to everyday life.
                            <br />
                            <b>Grounded. Private. Yours.</b>
                        </Text>
                    </FadeIn>

                    <FadeIn delay={0.4}>
                        <ClientLinkButton href="/auth/login" size="xl" radius="xl" color="indigo.7" mt="md" rightSection={<IconArrowRight size={20} />}>
                            Enter Your System
                        </ClientLinkButton>
                    </FadeIn>
                </Stack>
            </Container>

            {/* Philosophy Section */}
            <Box bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" py={80}>
                <Container size="lg">
                    <FadeIn>
                        <Blockquote color="indigo" cite="– James Clear" icon={<IconLeaf size={30} />} mt="xl" radius="lg">
                            You do not rise to the level of your goals. You fall to the level of your systems.
                        </Blockquote>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <Text mt="xl" ta="center" c="dimmed" size="lg" maw={800} mx="auto">
                            HomeCoreOS isn't about productivity hacks or squeezing every second out of your day. It's about building a digital sanctuary where your habits, thoughts, and plans can thrive without the noise of the modern web.
                        </Text>
                    </FadeIn>
                </Container>
            </Box>

            {/* The Workflow */}
            <Container size="xl" py={120}>
                <FadeIn>
                    <Title ta="center" order={2} mb={80}>The Core Loop</Title>
                </FadeIn>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing={80} verticalSpacing={120}>
                    {/* Step 1 */}
                    <FadeIn>
                        <Stack gap="md" justify="center" h="100%">
                            <ThemeIcon size={60} radius="xl" color="grape" variant="light">
                                <IconBrain size={32} />
                            </ThemeIcon>
                            <Title order={3}>1. Capture</Title>
                            <Text c="dimmed" size="lg">
                                Get thoughts out of your head and into the system instantly. Whether it's a brilliant idea, a grocery item, or a looming deadline.
                                <br /><br />
                                <b>Daily Notes</b> serve as your scratchpad for the mind.
                            </Text>
                        </Stack>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div style={{ background: 'var(--mantine-color-grape-0)', width: '100%', height: 300, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconNotebook size={120} color="var(--mantine-color-grape-3)" style={{ opacity: 0.5 }} />
                        </div>
                    </FadeIn>

                    {/* Step 2 */}
                    <FadeIn delay={0.2} style={{ order: 1 }}> {/* Mobile order switch */}
                        <div style={{ background: 'var(--mantine-color-blue-0)', width: '100%', height: 300, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconCheck size={120} color="var(--mantine-color-blue-3)" style={{ opacity: 0.5 }} />
                        </div>
                    </FadeIn>
                    <FadeIn>
                        <Stack gap="md" justify="center" h="100%">
                            <ThemeIcon size={60} radius="xl" color="blue" variant="light">
                                <IconCheck size={32} />
                            </ThemeIcon>
                            <Title order={3}>2. Organize</Title>
                            <Text c="dimmed" size="lg">
                                Turn chaos into action. Sort tasks by context, schedule meals for the week, and ensure nothing slips through the cracks.
                            </Text>
                        </Stack>
                    </FadeIn>

                    {/* Step 3 */}
                    <FadeIn>
                        <Stack gap="md" justify="center" h="100%">
                            <ThemeIcon size={60} radius="xl" color="yellow" variant="light">
                                <IconTrophy size={32} />
                            </ThemeIcon>
                            <Title order={3}>3. Review & Celebrate</Title>
                            <Text c="dimmed" size="lg">
                                Visualize your progress on the <b>Wall of Achievements</b>. Seeing how far you've come provides the momentum to keep going.
                            </Text>
                        </Stack>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div style={{ background: 'var(--mantine-color-yellow-0)', width: '100%', height: 300, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconTrophy size={120} color="var(--mantine-color-yellow-3)" style={{ opacity: 0.5 }} />
                        </div>
                    </FadeIn>
                </SimpleGrid>
            </Container>

            {/* Features Grid */}
            <Box bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))" py={120}>
                <Container size="xl">
                    <FadeIn y={30}>
                        <Title ta="center" order={2} mb={60}>Everything Included</Title>
                    </FadeIn>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                        <FadeIn delay={0.1}>
                            <FeatureCard
                                icon={IconCheck}
                                title="Task Management"
                                description="Short term goals and tasks, simple and fast."
                                color="blue"
                            />
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <FeatureCard
                                icon={IconTrophy}
                                title="Wall of Achievements"
                                description="Visualize your progress. A dedicated space to celebrate the wins."
                                color="yellow"
                            />
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <FeatureCard
                                icon={IconNotebook}
                                title="Daily Notes"
                                description="Clear your mind. A simple, distraction-free space to capture your thoughts."
                                color="grape"
                            />
                        </FadeIn>
                        <FadeIn delay={0.4}>
                            <FeatureCard
                                icon={IconChefHat}
                                title="Recipe Organizer"
                                description="Food is hard, so this makes it easier. Save, organize, and schedule meals."
                                color="green"
                            />
                        </FadeIn>
                        <FadeIn delay={0.5}>
                            <FeatureCard
                                icon={IconRocket}
                                title="Systems > Goals"
                                description="Built to help you build better habits in the long term, not just check boxes today."
                                color="orange"
                            />
                        </FadeIn>
                        <FadeIn delay={0.6}>
                            <FeatureCard
                                icon={IconShieldLock}
                                title="Private & Secure"
                                description="Your data is yours. Enterprise-grade encryption, running locally or in the cloud."
                                color="gray"
                            />
                        </FadeIn>
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Bottom CTA */}
            <Container size="md" py={160} ta="center">
                <FadeIn>
                    <Stack align="center" gap="xl">
                        <Title order={1}>Ready to take control?</Title>
                        <Text size="xl" c="dimmed" maw={600}>
                            Join the movement towards a calmer, more organized digital life.
                        </Text>
                        <ClientLinkButton href="/auth/login" size="xl" radius="xl" color="indigo.7" rightSection={<IconArrowRight size={20} />}>
                            Start Using HomeCoreOS
                        </ClientLinkButton>
                    </Stack>
                </FadeIn>
            </Container>
        </Box>
    );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
    return (
        <Paper withBorder p="xl" radius="md" shadow="sm" h="100%">
            <ThemeIcon variant="light" size="xl" radius="md" mb="md" color={color}>
                <Icon size={24} />
            </ThemeIcon>
            <Title order={3} mb="sm" size="h4">{title}</Title>
            <Text c="dimmed" lh={1.6} size="sm">
                {description}
            </Text>
        </Paper>
    );
}
