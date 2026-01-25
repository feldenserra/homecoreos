'use client'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useTransition } from 'react'
import * as recipeRepo from '../actions/recipes'
import { Autocomplete } from './Autocomplete'
import { useToast } from './ToastProvider'
import { CoreItem } from './CoreItem'
import { CorePage } from './CorePage'
import { CoreStack } from './CoreStack'

// 1. Define the shape of your form directly with TypeScript
type RecipeFormValues = {
  name: string
  cookType: string
  instructions: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  ingredients: {
    ingredientId: string
    name: string
    qty: string
    uom: string
  }[]
}

const UNITS = ["unit", "cup", "tbsp", "tsp", "oz", "lb", "g", "kg"]

export function RecipeForm({ availableIngredients }: { availableIngredients: { id: string, name: string }[] }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // 2. Setup useForm
  // This replaces all your separate useState calls
  const { register, control, handleSubmit, formState: { errors } } = useForm<RecipeFormValues>({
    defaultValues: {
      name: '',
      cookType: 'Standard',
      instructions: '',
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ingredients: [{ ingredientId: '', name: '', qty: '', uom: 'unit' }]
    }
  })

  // 3. Setup useFieldArray
  // This replaces 'rows', 'setRows', 'toggleIngredients', and 'handleDeleteRow'
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  })

  // 4. Clean Submit Handler
  const onSubmit = (data: RecipeFormValues) => {
    startTransition(async () => {
      // You can pass 'data' directly to your server action now
      // because it matches the structure you defined
      const result = await recipeRepo.upsert({
         id: undefined, 
         ...data 
      })

      if (result) {
        toast("Recipe saved!", "success")
      } else {
        toast("Failed to save recipe", "error")
      }
    })
  }

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body overflow-visible">
        <h3 className="card-title">New Recipe</h3>

        {/* We use handleSubmit from RHF to wrap our custom logic */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <CoreStack row spacing={3}>
            
            {/* Standard Input */}
            <CoreItem>
              <p className="text-xs font-bold opacity-50 uppercase mb-1">Recipe Name</p>
              <input
                {...register("name", { required: "Name is required" })}
                className="input input-bordered"
                placeholder="Recipe Name"
              />
              {errors.name && <span className="text-error text-xs">{errors.name.message}</span>}
            </CoreItem>

            {/* Nested Object Inputs (Nutrition) */}
            <CoreItem>
              <p className="text-xs font-bold opacity-50 uppercase mb-1">Calories</p>
              <input
                type="number"
                {...register("nutrition.calories", { valueAsNumber: true })}
                className="input input-bordered w-24 mr-2"
              />
            </CoreItem>
            
            {/* ... Repeat for other macros (Protein, Carbs, Fat) ... */}
            
            <CoreItem>
              <p className="text-xs font-bold opacity-50 uppercase mb-1">Cook Type</p>
              <select {...register("cookType")} className="select select-bordered w-32">
                <option value="Standard">Standard</option>
                <option value="Crockpot">Crockpot</option>
              </select>
            </CoreItem>
          </CoreStack>

          <div className="flex flex-col gap-2 mt-4">
            <span className="text-xs font-bold opacity-50 uppercase">Ingredients</span>

            {/* 5. Map through 'fields' from useFieldArray */}
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center relative z-10">
                
                {/* QTY */}
                <input
                  {...register(`ingredients.${index}.qty`, { required: true })}
                  className="input input-bordered input-sm w-20 text-center"
                  placeholder="1"
                />

                {/* UOM */}
                <select
                  {...register(`ingredients.${index}.uom`)}
                  className="select select-bordered select-sm w-24"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>

                <div className="flex-1">
                  {/* 6. The Controller Pattern 
                      Since Autocomplete isn't a native HTML input, we use Controller
                      to wire it up to React Hook Form. 
                  */}
                  <Controller
                    control={control}
                    name={`ingredients.${index}.name`}
                    rules={{ required: "Ingredient required" }}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        items={availableIngredients.map(i => ({ ...i, active: true }))}
                        value={value}
                        onSelect={(item) => {
                          // Update the Name field
                          onChange(item.name)
                          
                          // If we have an ID, we can manually set the hidden ingredientId field
                          // (requires importing 'setValue' from useForm if you want to do it this way,
                          // or using a second Controller for the ID)
                        }}
                      />
                    )}
                  />
                  {/* Hidden input to track the ID if needed */}
                  <input type="hidden" {...register(`ingredients.${index}.ingredientId`)} />
                </div>

                <button 
                  type="button" 
                  onClick={() => remove(index)} 
                  className="btn btn-ghost btn-xs text-error"
                >
                  X
                </button>
              </div>
            ))}

            <button
              type="button"
              // Append a new empty object to the array
              onClick={() => append({ ingredientId: '', name: '', qty: '', uom: 'unit' })}
              className="btn btn-xs btn-ghost self-start"
            >
              + Add Ingredient
            </button>
          </div>

          <textarea
            {...register("instructions")}
            className="textarea textarea-bordered h-24 w-full mt-4"
            placeholder="Instructions"
          />

          <button type="submit" disabled={isPending} className="btn btn-primary mt-4">
            {isPending ? 'Saving...' : 'Save Recipe'}
          </button>
        </form>
      </div>
    </div>
  )
}