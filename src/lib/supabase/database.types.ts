export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            bug_reports: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    title: string
                    description: string
                    steps_to_reproduce: string | null
                    severity: 'low' | 'medium' | 'high' | 'critical'
                    status: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
                    device_metadata: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    title: string
                    description: string
                    steps_to_reproduce?: string | null
                    severity?: 'low' | 'medium' | 'high' | 'critical'
                    status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
                    device_metadata?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    title?: string
                    description?: string
                    steps_to_reproduce?: string | null
                    severity?: 'low' | 'medium' | 'high' | 'critical'
                    status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix'
                    device_metadata?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "bug_reports_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ingredients: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ingredients_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            recipes: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    cook_method: string | null
                    instructions: string | null
                    calories: number
                    protein_g: number
                    carbs_g: number
                    fat_g: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    cook_method?: string | null
                    instructions?: string | null
                    calories?: number
                    protein_g?: number
                    carbs_g?: number
                    fat_g?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    cook_method?: string | null
                    instructions?: string | null
                    calories?: number
                    protein_g?: number
                    carbs_g?: number
                    fat_g?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recipes_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            recipe_ingredients: {
                Row: {
                    id: string
                    recipe_id: string
                    ingredient_id: string
                    quantity: number
                    uom: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    recipe_id: string
                    ingredient_id: string
                    quantity: number
                    uom: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    recipe_id?: string
                    ingredient_id?: string
                    quantity?: number
                    uom?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
                        columns: ["ingredient_id"]
                        referencedRelation: "ingredients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recipe_ingredients_recipe_id_fkey"
                        columns: ["recipe_id"]
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notes: {
                Row: {
                    id: string
                    user_id: string
                    note: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    note: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    note?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notes_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            achievements: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    icon: string
                    achieved_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    description?: string | null
                    icon?: string
                    achieved_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    icon?: string
                    achieved_at?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "achievements_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            planner_days: {
                Row: {
                    id: string
                    user_id: string
                    day_name: string
                    day_index: number
                }
                Insert: {
                    id?: string
                    user_id: string
                    day_name: string
                    day_index: number
                }
                Update: {
                    id?: string
                    user_id?: string
                    day_name?: string
                    day_index?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "planner_days_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            planner_tasks: {
                Row: {
                    id: string
                    planner_day_id: string
                    content: string
                    position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    planner_day_id: string
                    content: string
                    position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    planner_day_id?: string
                    content?: string
                    position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "planner_tasks_planner_day_id_fkey"
                        columns: ["planner_day_id"]
                        referencedRelation: "planner_days"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
