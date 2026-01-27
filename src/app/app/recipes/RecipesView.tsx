'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
    Container,
    Title,
    Paper,
    Stack,
    Group,
    TextInput,
    Textarea,
    Button,
    NumberInput,
    ActionIcon,
    Text,
    SimpleGrid,
    Select,
    LoadingOverlay,
    Alert,
    Tabs,
    rem
} from '@mantine/core';
import { IconTrash, IconChefHat, IconInfoCircle, IconBook, IconCalendar, IconPlus } from '@tabler/icons-react';
import { saveRecipe, Ingredient, RecipeInput, getRecipes, deleteRecipe, ProcessedRecipe } from '@/lib/repositories/recipesRepository';
import { IngredientSelect } from '@/components/recipes/IngredientSelect';
import { RecipeCard, RecipeDetailModal, MealScheduler } from '@/components/recipes/RecipeComponents';

// --- Create Form Component (Extracted) ---
interface LocalRecipeIngredient {
    ingredientId: string;
    name: string;
    quantity: number;
    uom: string;
}

const COMMON_UOMS = [
    'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pcs', 'slice', 'oz', 'lb'
];

function CreateRecipeForm({ onSaved }: { onSaved: () => void }) {
    const [ingredients, setIngredients] = useState<LocalRecipeIngredient[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ title: string; message: string; color: string } | null>(null);

    const form = useForm({
        initialValues: {
            title: '',
            cook_method: '',
            instructions: '',
            macros: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
            }
        },
        validate: {
            title: (val) => (val.length < 3 ? 'Title must be at least 3 characters' : null),
            macros: {
                calories: (val) => (val < 0 ? 'Calories must be at least 0' : null),
                protein: (val) => (val < 0 ? 'Protein must be at least 0' : null),
                carbs: (val) => (val < 0 ? 'Carbs must be at least 0' : null),
                fats: (val) => (val < 0 ? 'Fats must be at least 0' : null),
            },
            instructions: (val) => (val.length < 5 ? 'Instructions must be at least 5 characters' : null),
        }
    });

    const handleSelectIngredient = (ingredient: Ingredient) => {
        setIngredients([...ingredients, {
            ingredientId: ingredient.id,
            name: ingredient.name,
            quantity: 100,
            uom: 'g'
        }]);
    };

    const updateIngredient = (index: number, key: keyof LocalRecipeIngredient, value: any) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [key]: value };
        setIngredients(newIngredients);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        setAlert(null);
        try {
            const recipe: RecipeInput = {
                title: values.title,
                cook_method: values.cook_method,
                instructions: values.instructions,
                ingredients: ingredients.map(ing => ({
                    ingredientId: ing.ingredientId,
                    quantity: ing.quantity,
                    uom: ing.uom
                })),
                macros: values.macros
            };

            await saveRecipe(recipe);

            setAlert({
                title: 'Success',
                message: 'Recipe saved successfully!',
                color: 'green'
            });

            form.reset();
            setIngredients([]);
            onSaved(); // Notify parent to switch tabs or refresh
            setTimeout(() => setAlert(null), 3000);

        } catch (error) {
            console.error(error);
            setAlert({
                title: 'Error',
                message: 'Failed to save recipe',
                color: 'red'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Stack gap="lg" pos="relative">
            <LoadingOverlay visible={submitting} />
            {alert && (
                <Alert variant="light" color={alert.color} title={alert.title} icon={<IconInfoCircle />} onClose={() => setAlert(null)} withCloseButton>
                    {alert.message}
                </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    {/* Basic Info */}
                    <Paper withBorder p="md" radius="md">
                        <Stack>
                            <Select
                                label="Cooking Method"
                                data={['Stovetop', 'Crockpot', 'Oven', 'Grill', 'Other']}
                                {...form.getInputProps('cook_method')}
                                w={{ base: '100%', sm: 150 }}
                                allowDeselect={false}
                            />
                            <TextInput
                                label="Recipe Title"
                                placeholder="e.g. Grandma's Apple Pie"
                                required
                                {...form.getInputProps('title')}
                            />
                        </Stack>
                    </Paper>

                    {/* Ingredients Section */}
                    <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Ingredients</Title>
                        <Stack gap="md">
                            <IngredientSelect
                                onSelect={handleSelectIngredient}
                                excludedIds={ingredients.map(i => i.ingredientId)}
                            />
                            <Stack gap="xs">
                                {ingredients.length === 0 && (
                                    <Text c="dimmed" fs="italic">No ingredients added yet. Search above to add.</Text>
                                )}
                                {ingredients.map((ing, index) => (
                                    <Group key={ing.ingredientId} justify="space-between" bg="gray.0" p="xs" style={{ borderRadius: 8 }}>
                                        <Text fw={500} style={{ flex: 1 }}>{ing.name}</Text>
                                        <Group gap="xs">
                                            <NumberInput
                                                size="xs" w={80}
                                                min={0}
                                                value={ing.quantity}
                                                onChange={(val) => updateIngredient(index, 'quantity', val)}
                                                allowNegative={false}
                                            />
                                            <Select
                                                size="xs" w={90}
                                                data={COMMON_UOMS}
                                                value={ing.uom}
                                                onChange={(val) => updateIngredient(index, 'uom', val)}
                                                allowDeselect={false}
                                            />
                                            <ActionIcon color="red" variant="subtle" onClick={() => removeIngredient(index)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                ))}
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Instructions */}
                    <Paper withBorder p="md" radius="md">
                        <Textarea
                            label="Instructions"
                            minRows={4}
                            autosize
                            placeholder="Step 1: ..."
                            {...form.getInputProps('instructions')}
                        />
                    </Paper>

                    {/* Macros Section */}
                    <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Nutritional Information (Total)</Title>
                        <SimpleGrid cols={{ base: 2, sm: 4 }}>
                            <NumberInput label="Calories" suffix=" kcal" min={0} {...form.getInputProps('macros.calories')} />
                            <NumberInput label="Protein" suffix=" g" min={0} {...form.getInputProps('macros.protein')} />
                            <NumberInput label="Carbs" suffix=" g" min={0} {...form.getInputProps('macros.carbs')} />
                            <NumberInput label="Fats" suffix=" g" min={0} {...form.getInputProps('macros.fats')} />
                        </SimpleGrid>
                    </Paper>

                    <Button type="submit" size="lg" fullWidth>
                        Save Recipe
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
}

// --- Main View ---

export function RecipesView() {
    const [activeTab, setActiveTab] = useState<string | null>('library');
    const [recipes, setRecipes] = useState<ProcessedRecipe[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedRecipe, setSelectedRecipe] = useState<ProcessedRecipe | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const data = await getRecipes();
            setRecipes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecipes();
    }, []);

    const handleDelete = async (id: string) => {
        const success = await deleteRecipe(id);
        if (success) {
            setRecipes(recipes.filter(r => r.id !== id));
        }
    };

    const openRecipe = (recipe: ProcessedRecipe) => {
        setSelectedRecipe(recipe);
        setModalOpen(true);
    };

    return (
        <Container size="md" py="xl">
            <Group mb="xl" justify="space-between">
                <Group>
                    <IconChefHat size={32} />
                    <Title order={1}>Recipe Manager</Title>
                </Group>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
                <Tabs.List mb="md">
                    <Tabs.Tab value="library" leftSection={<IconBook size={16} />}>
                        Library
                    </Tabs.Tab>
                    <Tabs.Tab value="create" leftSection={<IconPlus size={16} />}>
                        Create
                    </Tabs.Tab>
                    <Tabs.Tab value="schedule" leftSection={<IconCalendar size={16} />}>
                        Schedule
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="library">
                    {loading ? (
                        <Text>Loading recipes...</Text>
                    ) : (
                        <>
                            {recipes.length === 0 ? (
                                <Paper p="xl" withBorder ta="center">
                                    <Text c="dimmed" mb="md">No recipes found. Create your first one!</Text>
                                    <Button onClick={() => setActiveTab('create')}>Create Recipe</Button>
                                </Paper>
                            ) : (
                                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                    {recipes.map(recipe => (
                                        <RecipeCard
                                            key={recipe.id}
                                            recipe={recipe}
                                            onDelete={handleDelete}
                                            onClick={openRecipe}
                                        />
                                    ))}
                                </SimpleGrid>
                            )}
                        </>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="create">
                    <CreateRecipeForm onSaved={() => {
                        loadRecipes();
                        setActiveTab('library');
                    }} />
                </Tabs.Panel>

                <Tabs.Panel value="schedule">
                    <MealScheduler recipes={recipes} />
                </Tabs.Panel>
            </Tabs>

            <RecipeDetailModal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                recipe={selectedRecipe}
            />
        </Container>
    );
}
