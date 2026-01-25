'use client'

import { useState, useTransition } from 'react'
import * as recipeRepo from '../actions/recipes'
import { Autocomplete } from './Autocomplete'
import { useToast } from './ToastProvider'
import { CoreItem } from './CoreItem'
import { CorePage } from './CorePage'
import { CoreStack } from './CoreStack'

const UNITS = ["unit", "cup", "tbsp", "tsp", "oz", "lb", "g", "kg"]

interface Row {
    rowId: string
    ingredientId: string
    name: string
    qty: string
    uom: string
}

interface LocalIngredient {
    id: string
    name: string
    active: boolean
}

export function RecipeForm({ availableIngredients }: { availableIngredients: { id: string, name: string }[] }) {
    const { toast } = useToast()
    const [isPending, startTransition] = useTransition()

    const [masterIngredients, setMasterIngredients] = useState<LocalIngredient[]>(() =>
        availableIngredients.map(ing => ({ ...ing, active: true }))
    )

    const [rows, setRows] = useState<Row[]>([{
        rowId: crypto.randomUUID(),
        ingredientId: '',
        name: '',
        qty: '',
        uom: 'unit'
    }])

    const [name, setName] = useState('')
    const [cookType, setCookType] = useState('Standard')
    const [instructions, setInstructions] = useState('')
    const [nutritionFactsData, setNutritionFactsData] = useState({
        calories: 0, protein: 0, carbs: 0, fat: 0
    })

    // --- HANDLERS ---
    const toggleIngredients = (idsToActivate: string[], idsToDeactivate: string[]) => {
        setMasterIngredients(prev => prev.map(ing => {
            if (idsToActivate.includes(ing.id)) return { ...ing, active: true }
            if (idsToDeactivate.includes(ing.id)) return { ...ing, active: false }
            return ing
        }))
    }

    const handleIngredientSelect = async (rowIndex: number, item: { id: string | null, name: string }) => {
        const oldRow = rows[rowIndex]
        let newId = item.id

        // 1. Handle Creation if it doesn't exist
        if (!newId) {
            try {
                const created = await recipeRepo.createNewIngredient(item.name)
                if (created) {
                    newId = created.id
                    // Add new item to master list (initially active=false because we are about to select it)
                    setMasterIngredients(prev => [...prev, { id: created.id, name: item.name, active: false }])
                }
            } catch (error) {
                console.error(error)
                toast("Failed to create ingredient", "error")
                return
            }
        }

        const idsToActivate = oldRow.ingredientId ? [oldRow.ingredientId] : []
        const idsToDeactivate = newId ? [newId] : []

        if (newId && item.id) {
            toggleIngredients(idsToActivate, idsToDeactivate)
        } else if (idsToActivate.length > 0) {
            toggleIngredients(idsToActivate, [])
        }

        const nextRows = [...rows]
        nextRows[rowIndex] = { ...oldRow, name: item.name, ingredientId: newId || '' }
        setRows(nextRows)
    }

    const handleDeleteRow = (index: number) => {
        const row = rows[index]

        // Release the ingredient back to the pool
        if (row.ingredientId) {
            toggleIngredients([row.ingredientId], [])
        }

        setRows(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        const validRows = rows.filter(r => r.name.trim() !== '')
        if (!name || validRows.length === 0) return toast("Invalid form", "error")

        startTransition(async () => {
            var result = await recipeRepo.upsert({
                id: undefined,
                name,
                instructions,
                cookType,
                ingredients: validRows,
                nutrition: nutritionFactsData
            })

            if (result) {
                toast("Recipe saved!", "success")
                // Reset form
                setName('')
                setInstructions('')
                setCookType('Standard')
                setRows([{
                    rowId: crypto.randomUUID(),
                    ingredientId: '',
                    name: '',
                    qty: '',
                    uom: 'unit'
                }])
                setNutritionFactsData({ calories: 0, protein: 0, carbs: 0, fat: 0 })
            } else {
                toast("Failed to save recipe (name may already exist)", "error")
            }
        })
    }

    // --- RENDER ---
    return (

        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body overflow-visible">
                <h3 className="card-title">New Recipe</h3>

                <CoreStack row spacing={3}>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Recipe Name</p>
                        <input
                            className="input input-bordered"
                            placeholder="Recipe Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </CoreItem>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Calories</p>
                        <input
                            type="number"
                            className="input input-bordered w-24 mr-2"
                            placeholder="Calories"
                            value={nutritionFactsData.calories}
                            onChange={(e) => setNutritionFactsData(prev => ({ ...prev, calories: Number(e.target.value) }))}
                        />
                    </CoreItem>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Protein (g)</p>
                        <input
                            type="number"
                            className="input input-bordered w-24 mr-2"
                            placeholder="Protein (g)"
                            value={nutritionFactsData.protein}
                            onChange={(e) => setNutritionFactsData(prev => ({ ...prev, protein: Number(e.target.value) }))}
                        />
                    </CoreItem>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Carbs (g)</p>
                        <input
                            type="number"
                            className="input input-bordered w-24 mr-2"
                            placeholder="Carbs (g)"
                            value={nutritionFactsData.carbs}
                            onChange={(e) => setNutritionFactsData(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                        />
                    </CoreItem>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Fat (g)</p>
                        <input
                            type="number"
                            className="input input-bordered w-24"
                            placeholder="Fat (g)"
                            value={nutritionFactsData.fat}
                            onChange={(e) => setNutritionFactsData(prev => ({ ...prev, fat: Number(e.target.value) }))}
                        />
                    </CoreItem>
                    <CoreItem>
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Cook Type</p>
                        <select
                            className="select select-bordered w-32"
                            value={cookType}
                            onChange={(e) => setCookType(e.target.value)}
                        >
                            <option value="Standard">Standard</option>
                            <option value="Crockpot">Crockpot</option>
                        </select>
                    </CoreItem>

                </CoreStack>

                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold opacity-50 uppercase">Ingredients</span>

                    {rows.map((row, i) => (
                        <div key={row.rowId} className="flex gap-2 items-center relative z-10">
                            <input
                                className="input input-bordered input-sm w-20 text-center"
                                value={row.qty}
                                onChange={(e) => {
                                    const next = [...rows]; next[i].qty = e.target.value; setRows(next);
                                }}
                            />

                            <select
                                className="select select-bordered select-sm w-24"
                                value={row.uom}
                                onChange={(e) => {
                                    const next = [...rows]; next[i].uom = e.target.value; setRows(next);
                                }}
                            >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>

                            <div className="flex-1">
                                <Autocomplete
                                    items={masterIngredients}
                                    value={row.name}
                                    onSelect={(item) => handleIngredientSelect(i, item)}
                                />
                            </div>

                            {rows.length > 1 && (
                                <button onClick={() => handleDeleteRow(i)} className="btn btn-ghost btn-xs text-error">X</button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => setRows([...rows, { rowId: crypto.randomUUID(), ingredientId: '', name: '', qty: '', uom: 'unit' }])}
                        className="btn btn-xs btn-ghost self-start"
                    >
                        + Add Ingredient
                    </button>
                </div>

                <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                />

                <button onClick={handleSubmit} disabled={isPending} className="btn btn-primary">
                    {isPending ? 'Saving...' : 'Save Recipe'}
                </button>
            </div>
        </div>
    )
}