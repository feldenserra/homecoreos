'use client';

import { useState } from 'react';
import { useForm } from '@mantine/form';
import {
    Container,
    Title,
    Paper,
    Stack,
    Group,
    TextInput,
    Button,
    NumberInput,
    Autocomplete,
    ActionIcon,
    Text,
    SimpleGrid,
    Flex
} from '@mantine/core';
import { IconPlus, IconTrash, IconChefHat } from '@tabler/icons-react';
import { recipesRepository, Recipe, RecipeIngredient, Ingredient } from '@/lib/repositories/recipesRepository';

export function RecipesView() {
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [activeIngredient, setActiveIngredient] = useState<Ingredient | null>(null);

    const form = useForm({
        initialValues: {
            title: '',
            macros: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
            }
        },
        validate: {
            title: (val) => (val.length < 3 ? 'Title must be at least 3 characters' : null),
        }
    });

    const handleIngredientSearch = async (query: string) => {
        setIngredientSearch(query);
        if (!query) {
            setSearchResults([]);
            return;
        }

        const results = await recipesRepository.searchIngredients(query);
        setSearchResults(results.map(i => i.name));
        if (results.length > 0) setActiveIngredient(results[0]);
    };

    const addIngredient = () => {
        if (!activeIngredient && !ingredientSearch) return;

        const newIngredient: RecipeIngredient = {
            ingredientId: activeIngredient?.id || `temp_${Date.now()}`,
            name: activeIngredient?.name || ingredientSearch,
            amount: 100,
            unit: 'g'
        };

        setIngredients([...ingredients, newIngredient]);
        setIngredientSearch('');
        setSearchResults([]);
        setActiveIngredient(null);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async (values: typeof form.values) => {
        const recipe: Recipe = {
            title: values.title,
            ingredients: ingredients,
            macros: values.macros
        };

        await recipesRepository.saveRecipe(recipe);
        form.reset();
        setIngredients([]);
        alert('Recipe saved (simulated)!');
    };

    return (
        <Container size="md" py="xl">
            <Group mb="xl">
                <IconChefHat size={32} />
                <Title order={1}>Recipe Creator</Title>
            </Group>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    {/* Basic Info */}
                    <Paper withBorder p="md" radius="md">
                        <TextInput
                            label="Recipe Title"
                            placeholder="e.g. Grandma's Apple Pie"
                            required
                            {...form.getInputProps('title')}
                        />
                    </Paper>

                    {/* Ingredients Section */}
                    <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Ingredients</Title>

                        <Flex direction={{ base: 'column', sm: 'row' }} gap="sm" align={{ base: 'stretch', sm: 'flex-end' }} mb="md">
                            <Autocomplete
                                label="Add Ingredient"
                                placeholder="Search (e.g. Chicken)..."
                                data={searchResults}
                                value={ingredientSearch}
                                onChange={handleIngredientSearch}
                                style={{ flex: 1 }}
                            />
                            <Button onClick={addIngredient} leftSection={<IconPlus size={16} />}>
                                Add
                            </Button>
                        </Flex>

                        <Stack gap="xs">
                            {ingredients.length === 0 && (
                                <Text c="dimmed" fs="italic">No ingredients added yet.</Text>
                            )}
                            {ingredients.map((ing, index) => (
                                <Group key={index} justify="space-between" bg="gray.1" p="xs" style={{ borderRadius: 8 }}>
                                    <Text fw={500}>{ing.name}</Text>
                                    <Group gap="xs">
                                        <NumberInput
                                            size="xs" w={80}
                                            defaultValue={ing.amount}
                                            suffix={ing.unit}
                                        />
                                        <ActionIcon color="red" variant="subtle" onClick={() => removeIngredient(index)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Macros Section */}
                    <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Nutritional Information</Title>
                        <SimpleGrid cols={{ base: 2, sm: 4 }}>
                            <NumberInput
                                label="Calories"
                                suffix=" kcal"
                                min={0}
                                {...form.getInputProps('macros.calories')}
                            />
                            <NumberInput
                                label="Protein"
                                suffix=" g"
                                min={0}
                                {...form.getInputProps('macros.protein')}
                            />
                            <NumberInput
                                label="Carbs"
                                suffix=" g"
                                min={0}
                                {...form.getInputProps('macros.carbs')}
                            />
                            <NumberInput
                                label="Fats"
                                suffix=" g"
                                min={0}
                                {...form.getInputProps('macros.fats')}
                            />
                        </SimpleGrid>
                    </Paper>

                    <Button type="submit" size="lg" fullWidth>
                        Save Recipe
                    </Button>
                </Stack>
            </form>
        </Container>
    );
}
