'use client';

import { Card, Image, Text, Badge, Button, Group, Stack, ActionIcon, Modal, List, ThemeIcon, Divider, SimpleGrid } from '@mantine/core';
import { IconTrash, IconChefHat, IconClock, IconFlame, IconTools } from '@tabler/icons-react';
import { ProcessedRecipe } from '@/lib/repositories/recipesRepository';
import { useState } from 'react';

// --- Recipe Detail Modal ---

interface RecipeDetailModalProps {
    recipe: ProcessedRecipe | null;
    opened: boolean;
    onClose: () => void;
}

export function RecipeDetailModal({ recipe, opened, onClose }: RecipeDetailModalProps) {
    if (!recipe) return null;

    return (
        <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="lg">{recipe.title}</Text>} size="lg" centered>
            <Stack gap="md">
                {/* Header Stats */}
                <Group justify="space-between" bg="gray.1" p="sm" style={{ borderRadius: 8 }}>
                    <Group gap="xs">
                        <IconFlame size={20} color="orange" />
                        <Text fw={500}>{recipe.calories} kcal</Text>
                    </Group>
                    <Group gap="xs">
                        <IconTools size={20} color="gray" />
                        <Text fw={500}>{recipe.cook_method || 'General'}</Text>
                    </Group>
                    <Badge color="blue" size="lg">
                        {recipe.ingredients.length} Ingredients
                    </Badge>
                </Group>

                {/* Macros Breakdown */}
                <SimpleGrid cols={3} spacing="xs">
                    <Stack gap={0} align="center" bg="blue.0" p="xs" style={{ borderRadius: 8 }}>
                        <Text fw={700} c="blue">{recipe.protein_g}g</Text>
                        <Text size="xs" c="dimmed">Protein</Text>
                    </Stack>
                    <Stack gap={0} align="center" bg="green.0" p="xs" style={{ borderRadius: 8 }}>
                        <Text fw={700} c="green">{recipe.carbs_g}g</Text>
                        <Text size="xs" c="dimmed">Carbs</Text>
                    </Stack>
                    <Stack gap={0} align="center" bg="orange.0" p="xs" style={{ borderRadius: 8 }}>
                        <Text fw={700} c="orange">{recipe.fat_g}g</Text>
                        <Text size="xs" c="dimmed">Fats</Text>
                    </Stack>
                </SimpleGrid>

                <Divider my="xs" />

                {/* Ingredients */}
                <Stack gap="xs">
                    <Text fw={600}>Ingredients</Text>
                    <List spacing="xs" size="sm" center>
                        {recipe.ingredients.map((ing) => (
                            <List.Item key={ing.id} icon={<ThemeIcon color="teal" size={20} radius="xl"><IconChefHat size={12} /></ThemeIcon>}>
                                <b>{ing.quantity} {ing.uom}</b> {ing.name}
                            </List.Item>
                        ))}
                    </List>
                </Stack>

                <Divider my="xs" />

                {/* Instructions */}
                <Stack gap="xs">
                    <Text fw={600}>Instructions</Text>
                    <Text style={{ whiteSpace: 'pre-line' }}>{recipe.instructions || 'No instructions provided.'}</Text>
                </Stack>
            </Stack>
        </Modal>
    );
}

// --- Recipe Card ---

interface RecipeCardProps {
    recipe: ProcessedRecipe;
    onDelete: (id: string) => void;
    onClick: (recipe: ProcessedRecipe) => void;
}

export function RecipeCard({ recipe, onDelete, onClick }: RecipeCardProps) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => onClick(recipe)}>
            <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                    <Text fw={500}>{recipe.title}</Text>
                </Group>
            </Card.Section>

            <Stack mt="md" gap="xs">
                <Group gap="xs">
                    <Badge color="orange" variant="light">{recipe.calories} kcal</Badge>
                    <Badge color="gray" variant="light">{recipe.cook_method || 'Any'}</Badge>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2}>
                    {recipe.instructions || 'No instructions...'}
                </Text>
            </Stack>

            <Group mt="md" justify="flex-end">
                <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this recipe?')) {
                            onDelete(recipe.id);
                        }
                    }}
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>
        </Card>
    );
}

// --- Meal Scheduler ---
interface MealSchedulerProps {
    recipes: ProcessedRecipe[];
}

export function MealScheduler({ recipes }: MealSchedulerProps) {
    const [schedule, setSchedule] = useState<{ day: number, recipe: ProcessedRecipe }[]>([]);
    const [days, setDays] = useState(0);

    const generateSchedule = (count: number) => {
        if (recipes.length === 0) return;

        const newSchedule = [];
        const available = [...recipes];

        for (let i = 1; i <= count; i++) {
            // Pick random, allow repeats? User said "randomly select from the list". 
            // Usually valid schedulers try to avoid immediate repeats, but pure random is simpler.
            // Let's do pure random for now.
            const random = recipes[Math.floor(Math.random() * recipes.length)];
            newSchedule.push({ day: i, recipe: random });
        }
        setSchedule(newSchedule);
        setDays(count);
    };

    if (recipes.length === 0) {
        return <Text c="dimmed" ta="center" py="xl">Create some recipes first!</Text>;
    }

    return (
        <Stack>
            <Group justify="center">
                <Button onClick={() => generateSchedule(7)}>Generate 7 Days</Button>
                <Button onClick={() => generateSchedule(14)} variant="outline">Generate 14 Days</Button>
            </Group>

            {schedule.length > 0 && (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="xl">
                    {schedule.map((item) => (
                        <Card key={item.day} withBorder shadow="sm">
                            <Text fw={700} c="dimmed" mb="xs">Day {item.day}</Text>
                            <Text fw={600} size="lg">{item.recipe.title}</Text>
                            <Group gap="xs" mt="xs">
                                <Badge color="orange" variant="dot">{item.recipe.calories} kcal</Badge>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
