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
    rem,
    ScrollArea,
    Box
} from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { IconTrash, IconChefHat, IconInfoCircle, IconBook, IconCalendar, IconPlus, IconTools, IconCheck, IconX } from '@tabler/icons-react';
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
    'pcs', 'g', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'ml', 'slice', 'to taste', 'pinch', 'dash', 'clove', 'sprig', 'stalk', 'can', 'package'
];

interface RecipeFormProps {
    initialData?: ProcessedRecipe | null;
    onSaved: () => void;
    onDelete?: (id: string) => void;
    onCancel?: () => void;
}

function RecipeForm({ initialData, onSaved, onDelete, onCancel }: RecipeFormProps) {
    const isEditing = !!initialData;
    const [ingredients, setIngredients] = useState<LocalRecipeIngredient[]>(
        initialData?.ingredients?.map(ing => ({
            ingredientId: ing.id,
            name: ing.name,
            quantity: ing.quantity,
            uom: ing.uom
        })) || []
    );
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            title: initialData?.title || '',
            cook_method: initialData?.cook_method || '',
            instructions: initialData?.instructions || '',
            macros: {
                calories: initialData?.calories || 0,
                protein: initialData?.protein_g || 0,
                carbs: initialData?.carbs_g || 0,
                fats: initialData?.fat_g || 0,
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
            instructions: (val) => (val?.length < 5 ? 'Instructions must be at least 5 characters' : null),
        }
    });

    // Reset form when initialData changes (important for switching between create/edit modes without unmounting)
    useEffect(() => {
        if (initialData) {
            form.setValues({
                title: initialData.title,
                cook_method: initialData.cook_method || '',
                instructions: initialData.instructions || '',
                macros: {
                    calories: initialData.calories,
                    protein: initialData.protein_g,
                    carbs: initialData.carbs_g,
                    fats: initialData.fat_g,
                }
            });
            setIngredients(initialData.ingredients.map(ing => ({
                ingredientId: ing.id,
                name: ing.name,
                quantity: ing.quantity,
                uom: ing.uom
            })));
        } else {
            form.reset();
            setIngredients([]);
        }
    }, [initialData]);

    const handleSelectIngredient = (ingredient: Ingredient) => {
        setIngredients([...ingredients, {
            ingredientId: ingredient.id,
            name: ingredient.name,
            quantity: 0,
            uom: 'pcs'
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

    const handleDelete = () => {
        if (!initialData || !onDelete) return;
        if (confirm('Are you sure you want to delete this recipe?')) {
            onDelete(initialData.id);
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
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

            if (isEditing && initialData) {
                const { updateRecipe } = await import('@/lib/repositories/recipesRepository');
                await updateRecipe(initialData.id, recipe);
            } else {
                await saveRecipe(recipe);
            }

            notifications.show({
                title: 'Success',
                message: `Recipe ${isEditing ? 'updated' : 'saved'} successfully!`,
                color: 'green',
                icon: <IconCheck size={18} />,
            });

            if (!isEditing) {
                form.reset();
                setIngredients([]);
            }

            onSaved(); // Notify parent to switch tabs or refresh

            // If editing, we might want to stay or close, but let's refresh list 
            // relying on parent callback usually.

        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: `Failed to ${isEditing ? 'update' : 'save'} recipe`,
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Stack gap="lg" pos="relative">
            <LoadingOverlay visible={submitting} />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    {/* Header Row for Title and Cancel/Delete */}
                    <Group justify="space-between" align="start">
                        <Title order={3}>{isEditing ? 'Edit Recipe' : 'Create New Recipe'}</Title>
                        {isEditing && (
                            <Group>
                                <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={handleDelete}>
                                    Delete Recipe
                                </Button>
                            </Group>
                        )}
                    </Group>

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
                                    <Group key={ing.ingredientId} justify="space-between" bg="var(--mantine-color-dimmed)" p="xs" style={{ borderRadius: 8, backgroundColor: 'var(--mantine-color-default)' }}>
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

                    <Group justify="flex-end">
                        {onCancel && <Button variant="default" onClick={onCancel}>Cancel</Button>}
                        <Button type="submit" size="lg" w={isEditing ? 'auto' : '100%'}>
                            {isEditing ? 'Update Recipe' : 'Save Recipe'}
                        </Button>
                    </Group>
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

    // Editing State
    const [editingRecipe, setEditingRecipe] = useState<ProcessedRecipe | null>(null);

    // Form session key to force reset on new visits
    const [formSession, setFormSession] = useState(0);

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
            if (editingRecipe?.id === id) {
                setEditingRecipe(null);
                setActiveTab('library');
            }
        }
    };

    const openRecipe = (recipe: ProcessedRecipe) => {
        setSelectedRecipe(recipe);
        setModalOpen(true);
    };

    const handleEditRecipe = (recipe: ProcessedRecipe) => {
        setEditingRecipe(recipe);
        setModalOpen(false);
        // We do NOT increment formSession here because we want to mount with initialData, 
        // which the form handles via useEffect. But strictly speaking, a new key is fine too.
        // Let's keep it simple: any entry to 'create' can have a fresh key if we want.
        // But if we pass initialData, the form will hydrate from it.
        setActiveTab('create');
    };

    const onTabChange = (value: string | null) => {
        if (value !== 'create') {
            setEditingRecipe(null);
        } else {
            // Entering create mode. If we're not editing (or even if we are), 
            // we might want a fresh mount to ensure no stale state.
            setFormSession(s => s + 1);
        }
        setActiveTab(value);
    };

    return (
        <Container size="xl" py="xl" h="calc(100vh - 80px)">
            <Stack h="100%" gap="md">
                <Group justify="space-between">
                    <Group>
                        <IconChefHat size={32} />
                        <Title order={1}>Recipe Manager</Title>
                    </Group>
                </Group>

                <Tabs
                    value={activeTab}
                    onChange={onTabChange}
                    variant="outline"
                    radius="md"
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                >
                    <Tabs.List mb="md" style={{ flexShrink: 0 }}>
                        <Tabs.Tab value="library" leftSection={<IconBook size={16} />}>
                            Library
                        </Tabs.Tab>
                        <Tabs.Tab value="create" leftSection={editingRecipe ? <IconTools size={16} /> : <IconPlus size={16} />}>
                            {editingRecipe ? 'Edit Recipe' : 'Create'}
                        </Tabs.Tab>
                        <Tabs.Tab value="schedule" leftSection={<IconCalendar size={16} />}>
                            Schedule
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="library" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
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
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="create" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                <RecipeForm
                                    key={`form-${formSession}`}
                                    initialData={editingRecipe}
                                    onSaved={() => {
                                        loadRecipes();
                                        setEditingRecipe(null);
                                        setActiveTab('library');
                                    }}
                                    onDelete={(id) => {
                                        handleDelete(id);
                                        setEditingRecipe(null);
                                        setActiveTab('library');
                                    }}
                                    onCancel={() => {
                                        setEditingRecipe(null);
                                        setActiveTab('library');
                                    }}
                                />
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="schedule" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <ScrollArea h="100%" type="scroll">
                            <Box pb="xl">
                                <MealScheduler recipes={recipes} />
                            </Box>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </Stack>

            <RecipeDetailModal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                recipe={selectedRecipe}
                onEdit={handleEditRecipe}
            />
        </Container>
    );
}
