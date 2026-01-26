'use client'

import { useTransition } from 'react'
import {
    TextInput, NumberInput, Select, Button, Group,
    Stack, Text, Box, Autocomplete, ActionIcon,
    Textarea
} from '@mantine/core'
import { useForm } from '@mantine/form'
import * as recipeRepo from '../actions/recipes' // Your existing backend action

const UNITS = ["unit", "cup", "tbsp", "tsp", "oz", "lb", "g", "kg"]

export function RecipeForm({ availableIngredients }: { availableIngredients: { id: string, name: string }[] }) {
    const [isPending, startTransition] = useTransition()

    // This hook handles ALL state (replaces your 10 useState lines)
    const form = useForm({
        initialValues: {
            name: '',
            cookType: 'Standard',
            instructions: '',
            calories: 0, protein: 0, carbs: 0, fat: 0,
            ingredients: [{ ingredientId: null, name: '', qty: '', uom: 'unit' }]
        },
        validate: {
            name: (value) => (value.length < 2 ? 'Name is too short' : null),
            instructions: (value) => (value.length < 10 ? 'Instructions are too short' : null),
            calories: (value) => (value < 0 ? 'Calories must be positive' : null),
            protein: (value) => (value < 0 ? 'Protein must be positive' : null),
            carbs: (value) => (value < 0 ? 'Carbs must be positive' : null),
            fat: (value) => (value < 0 ? 'Fat must be positive' : null),
            ingredients: (value) => {
                if (value.length === 0) return 'At least one ingredient is required'
                for (let i = 0; i < value.length; i++) {
                    const item = value[i]
                    if (!item.name) return `Ingredient ${i + 1}: name is required`
                    if (!item.qty) return `Ingredient ${i + 1}: quantity is required`
                }
                return null
            },
        },
    })

  // This function only runs if validation passes
  const handleSubmit = (values: typeof form.values) => {
    startTransition(async () => {
      // Logic to find Ingredient IDs based on names would go here or on backend
      const result = await recipeRepo.upsert(values)
      if(result) form.reset()
    })
  }

  return (
    // Box is like a div, but you use props for style (p="md" is padding medium)
    <Box maw={800} mx="auto" p="lg" component="form" onSubmit={form.onSubmit(handleSubmit)}>
      
      <Text size="xl" fw={700} mb="lg">New Recipe</Text>

      {/* Stack = Vertical Flexbox with spacing built in */}
      <Stack gap="md">
        <TextInput 
          label="Recipe Name" 
          placeholder="e.g. Chicken Parm" 
          withAsterisk 
          {...form.getInputProps('name')} 
        />
        
        {/* Group = Horizontal Flexbox */}
        <Group grow>
          <NumberInput label="Calories" {...form.getInputProps('calories')} />
          <NumberInput label="Protein" {...form.getInputProps('protein')} />
          <NumberInput label="Carbs" {...form.getInputProps('carbs')} />
          <NumberInput label="Fat" {...form.getInputProps('fat')} />
        </Group>

        <Select 
          label="Cook Type" 
          data={['Standard', 'Crockpot']} 
          {...form.getInputProps('cookType')} 
        />
      </Stack>

      {/* Dynamic Ingredients List */}
      <Stack gap="xs" mt="xl">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Ingredients</Text>
        
        {form.values.ingredients.map((item, index) => (
          <Group key={index} align="flex-end">
            <TextInput 
              placeholder="Qty" 
              w={80} 
              {...form.getInputProps(`ingredients.${index}.qty`)} 
            />
            <Select 
              data={UNITS} 
              w={100} 
              {...form.getInputProps(`ingredients.${index}.uom`)} 
            />
            
            <Autocomplete 
              data={availableIngredients.map(i => i.name)}
              placeholder="Ingredient Name"
              style={{ flex: 1 }}
              {...form.getInputProps(`ingredients.${index}.name`)}
            />

            <Button 
              color="red" 
              variant="light" 
              onClick={() => form.removeListItem('ingredients', index)}
            >
              X
            </Button>
          </Group>
        ))}

        <Button 
          variant="default" 
          size="xs" 
          onClick={() => form.insertListItem('ingredients', { ingredientId: null, name: '', qty: '', uom: 'unit' })}
        >
          + Add Ingredient
        </Button>
      </Stack>

      <Textarea
        component="textarea" 
        label="Instructions" 
        mt="xl"
        rows={4} 
        {...form.getInputProps('instructions')} 
      />

      <Button type="submit" mt="xl" fullWidth loading={isPending}>
        Save Recipe
      </Button>
    </Box>
  )
}