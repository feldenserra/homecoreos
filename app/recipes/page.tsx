import { 
  Title, Text, Badge, Paper, Group, ThemeIcon, Box, Center, 
  Stack // 👈 Re-introducing Stack
} from '@mantine/core';
import { IconCheck, IconInbox } from '@tabler/icons-react';
import * as taskRepo from './actions/tasks';

import NewTaskForm from './components/NewTaskForm';
import TaskItem from './components/TaskItem';
import FilterToggle from './components/FilterToggle';

export default async function Dashboard(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || 'active';
  const showCompleted = filter === 'done';

  const data = await taskRepo.getAll(showCompleted);
  const visibleTasks = data.tasks.filter(x => x.done === showCompleted);
  
  return (
    // 1. Re-introduced <Box> (Replaces div className="p-6")
    <Box p="md">
      
      {/* ⚠️ KEEPING TAILWIND GRID FOR SAFETY (Just for this step) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* --- LEFT SIDEBAR --- */}
        <div className="md:col-span-3">
          
          {/* 2. Re-introduced <Stack> (Replaces flex flex-col) */}
          <Stack gap="md">
            
            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                View
              </Text>
              <FilterToggle />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">
                Add New
              </Text>
              <NewTaskForm />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" align="center">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Lifetime Tasks
                </Text>
                <ThemeIcon variant="light" color="blue" radius="xl">
                   <IconInbox size={16} />
                </ThemeIcon>
              </Group>
              <Group align="flex-end" gap="xs" mt="xs">
                <Text fw={700} size="xl" lh={1}>{data.total}</Text>
                <Text size="sm" c="dimmed" mb={2}>total</Text>
              </Group>
            </Paper>

          </Stack>
        </div>


        {/* --- MAIN CONTENT --- */}
        <div className="md:col-span-9">
          
          <Group justify="space-between" align="flex-end" mb="lg">
            <Title order={2}>
              {showCompleted ? 'Archive' : 'My Tasks'}
            </Title>
            <Badge size="lg" variant="dot" color={showCompleted ? 'gray' : 'blue'}>
              {visibleTasks.length} items
            </Badge>
          </Group>

          {/* 3. Re-introduced <Stack> here too */}
          <Stack gap="sm">
            {visibleTasks.map((task) => (
              <Box key={task.id}>
                <TaskItem {...task} />
              </Box>
            ))}

            {visibleTasks.length === 0 && (
              <Paper withBorder p="xl" radius="md" mt="xl">
                <Center>
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                      <IconCheck size={30} />
                    </ThemeIcon>
                    <Title order={3} mt="sm">All caught up</Title>
                    <Text c="dimmed">
                      {showCompleted 
                        ? "No archived tasks found." 
                        : "You have no pending tasks."}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Stack>

        </div>
      </div>
    </Box>
  );
}export const dynamic = 'force-dynamic';
import { CorePage } from "../components/CorePage";
import { RecipeForm } from "../components/RecipeForm";
import * as recipeRepo from '../actions/recipes';
import { CoreStack } from "../components/CoreStack";
import { CoreItem } from "../components/CoreItem";


export default async function Recipes(props: { searchParams: Promise<{ filter?: string }> }) {

    const ingredients = await recipeRepo.getIngredients();
    const recipes = await recipeRepo.getAll();

    return (
        <CorePage>
            <CoreStack spacing={3}>
                <CoreItem>
                    <h1 className="text-2xl font-bold">Recipes</h1>
                </CoreItem>

                <CoreItem>
                    <RecipeForm availableIngredients={ingredients} />
                </CoreItem>

                <CoreItem>
                    <CoreStack spacing={2}>
                        <CoreItem>
                            <h2 className="text-xl font-semibold">All Recipes ({recipes.length})</h2>
                        </CoreItem>

                        {recipes.length === 0 ? (
                            <CoreItem>
                                <div className="border rounded-lg p-4 bg-base-100 text-center">
                                    <p className="text-base-content/60">No recipes found. Create one above!</p>
                                </div>
                            </CoreItem>
                        ) : (
                            <CoreStack spacing={2}>
                                {recipes.map((recipe) => (
                                    <CoreItem key={recipe.id}>
                                        <div className="border border-base-300 rounded-lg p-3 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                                            <CoreStack spacing={2}>
                                                <CoreItem>
                                                    <h3 className="text-lg font-bold">{recipe.name}</h3>
                                                </CoreItem>

                                                <CoreItem>
                                                    <p className="text-sm text-base-content/80">{recipe.instructions}</p>
                                                </CoreItem>
                                                <CoreItem>
                                                    <p className="text-xs italic text-base-content/60">Cook Type: {recipe.cookType}</p>
                                                </CoreItem>
                                                <CoreItem>
                                                    <CoreStack spacing={1}>
                                                        <CoreItem>
                                                            <h4 className="font-semibold text-xs uppercase tracking-wide text-base-content/70">Ingredients</h4>
                                                        </CoreItem>
                                                        <CoreItem>
                                                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                                                {recipe.ingredients.map((ri) => (
                                                                    <li key={ri.id}>
                                                                        {ri.quantity} {ri.uom} {ri.ingredient.name}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CoreItem>
                                                    </CoreStack>
                                                </CoreItem>

                                                {recipe.nutritionFacts && (
                                                    <CoreItem>
                                                        <CoreStack spacing={1}>
                                                            <CoreItem>
                                                                <h4 className="font-semibold text-xs uppercase tracking-wide text-base-content/70">Nutrition Facts</h4>
                                                            </CoreItem>
                                                            <CoreItem>
                                                                <CoreStack row spacing={3} wrap>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Calories:</span> {recipe.nutritionFacts.calories}
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Protein:</span> {recipe.nutritionFacts.protein}g
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Carbs:</span> {recipe.nutritionFacts.carbs}g
                                                                    </CoreItem>
                                                                    <CoreItem className="text-xs">
                                                                        <span className="font-medium">Fat:</span> {recipe.nutritionFacts.fats}g
                                                                    </CoreItem>
                                                                </CoreStack>
                                                            </CoreItem>
                                                        </CoreStack>
                                                    </CoreItem>
                                                )}
                                            </CoreStack>
                                        </div>
                                    </CoreItem>
                                ))}
                            </CoreStack>
                        )}
                    </CoreStack>
                </CoreItem>
            </CoreStack>
        </CorePage>
    );
}