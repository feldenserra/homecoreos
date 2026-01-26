import {
  Title, Text, Container, Stack, Paper, Group, Badge, SimpleGrid, ThemeIcon, List, ListItem
} from '@mantine/core';
import { IconChefHat, IconDatabase, IconScale } from '@tabler/icons-react';
import { RecipeForm } from "../components/RecipeForm";
import * as recipeRepo from '../actions/recipes';

export const dynamic = 'force-dynamic';

export default async function Recipes() {
  const ingredients = await recipeRepo.getIngredients();
  const recipes = await recipeRepo.getAll();

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">

        {/* Header & Form Section */}
        <Group justify="center" align="flex-start">
          <Stack gap="md" style={{ flex: 1 }}>
            <Group>
              <ThemeIcon size={40} radius="md" color="orange" variant="light">
                <IconChefHat />
              </ThemeIcon>
              <Title order={1}>Recipes</Title>
            </Group>
            <Text c="dimmed">Manage your kitchen recipes and ingredients.</Text>

            <Paper withBorder p="lg" radius="lg">
              <RecipeForm availableIngredients={ingredients} />
            </Paper>
          </Stack>
        </Group>

        {/* Recipe List Section */}
        <Stack gap="md" mt="xl">
          <Group justify="space-between" align="center">
            <Title order={2}>All Recipes</Title>
            <Badge size="lg" variant="light" color="gray">{recipes.length}</Badge>
          </Group>

          {recipes.length === 0 ? (
            <Paper withBorder p="xl" radius="md" ta="center" bg="gray.0">
              <Text c="dimmed">No recipes found. Create one above!</Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {recipes.map((recipe) => (
                <Paper key={recipe.id} withBorder p="md" radius="lg" shadow="sm" className="hover:shadow-md transition-shadow">
                  <Stack gap="sm">
                    <Group justify="space-between" align="start">
                      <Title order={3} size="h4">{recipe.name}</Title>
                      <Badge variant="outline" color="orange">{recipe.cookType}</Badge>
                    </Group>

                    <Text size="sm" lineClamp={3}>
                      {recipe.instructions}
                    </Text>

                    <Stack gap="xs" mt="sm">
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">Ingredients</Text>
                      <List size="xs" spacing={2} icon={<IconScale size={12} />}>
                        {recipe.ingredients.map((ri) => (
                          <ListItem key={ri.id}>
                            {ri.quantity} {ri.uom} {ri.ingredient.name}
                          </ListItem>
                        ))}
                      </List>
                    </Stack>

                    {recipe.nutritionFacts && (
                      <Paper bg="gray.0" p="xs" radius="md">
                        <Group gap="xs" mb={4}>
                          <IconDatabase size={12} />
                          <Text size="xs" fw={700}>Nutrition</Text>
                        </Group>
                        <Group gap="xs" style={{ rowGap: 0 }}>
                          <Badge size="xs" variant="transparent" color="gray">Cal: {recipe.nutritionFacts.calories}</Badge>
                          <Badge size="xs" variant="transparent" color="gray">Pro: {recipe.nutritionFacts.protein}g</Badge>
                          <Badge size="xs" variant="transparent" color="gray">Carb: {recipe.nutritionFacts.carbs}g</Badge>
                          <Badge size="xs" variant="transparent" color="gray">Fat: {recipe.nutritionFacts.fats}g</Badge>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}