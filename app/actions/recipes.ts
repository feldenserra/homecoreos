'use server'

import { prisma } from '../data/data'
import { revalidatePath } from 'next/cache'

export async function getAll() {
    return await prisma.recipe.findMany({
        include: {
            ingredients: {
                include: { ingredient: true }
            },
            nutritionFacts: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getIngredients(id?: string) {
    if (id) {
        const recipe = await prisma.ingredient.findUnique({
            where: { id },
            select: { id: true, name: true }
        })
        return recipe ? [recipe] : []
    }
    return await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    })
}

type RecipeInput = {
    id?: string
    name: string
    instructions: string
    cookType: string
    ingredients: {
        ingredientId: string | null // null = create new
        name: string
        qty: string
        uom: string
    }[],
    nutrition?: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
}

export async function createNewIngredient(name: string) {
    if (!name || name.trim() === '') return null
    const ingredient = await prisma.ingredient.create({
        data: { name: name.toLowerCase() }
    })
    revalidatePath('/recipes')
    return ingredient
}

export async function upsert(data: RecipeInput) {
    if ((data.id && data.id.trim() === '') || data.id === undefined) {
        var nameCheck = await prisma.recipe.findUnique({ where: { name: data.name } })
        if (nameCheck) return null
    }

    await prisma.$transaction(async (tx) => {

        if (!data.id) {
            var recipe = await tx.recipe.create({
                data: {
                    name: data.name,
                    instructions: data.instructions,
                    cookType: data.cookType
                }
            })
        } else {
            var recipe = await tx.recipe.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    instructions: data.instructions,
                    cookType: data.cookType
                }
            })
        }

        await tx.recipeIngredient.deleteMany({
            where: { recipeId: recipe.id }
        })

        for (const item of data.ingredients) {
            if (!item.name) continue

            let finalId = item.ingredientId
            if (!finalId) {
                const newIng = await tx.ingredient.upsert({
                    where: { name: item.name.toLowerCase() },
                    update: {},
                    create: { name: item.name.toLowerCase() }
                })
                finalId = newIng.id
            }
            await tx.recipeIngredient.create({
                data: {
                    recipeId: recipe.id,
                    ingredientId: finalId,
                    quantity: item.qty,
                    uom: item.uom
                }
            })
        }

        if (data.nutrition) {
            await tx.nutritionFacts.upsert({
                where: { recipeId: recipe.id },
                update: {
                    calories: data.nutrition.calories,
                    protein: data.nutrition.protein,
                    carbs: data.nutrition.carbs,
                    fats: data.nutrition.fat
                },
                create: {
                    recipeId: recipe.id,
                    calories: data.nutrition.calories,
                    protein: data.nutrition.protein,
                    carbs: data.nutrition.carbs,
                    fats: data.nutrition.fat
                }
            })
        } else {
            await tx.nutritionFacts.deleteMany({
                where: { recipeId: recipe.id }
            })
        }
    })
    revalidatePath('/recipes')
    return true
}

export async function deleteRecipe(id: string) {
    await prisma.recipe.delete({ where: { id } })
    revalidatePath('/recipes')
}