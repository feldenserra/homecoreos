import { createClient } from '@/lib/supabase/client';

// --- Types ---

export interface FinanceCategory {
    id: string;
    user_id: string;
    name: string;
    icon: string | null;
    monthly_budget_limit: number;
    type: 'income' | 'expense';
    created_at: string;
}

export interface FinanceTransaction {
    id: string;
    user_id: string;
    category_id: string | null;
    finance_categories?: FinanceCategory | null; // Joined
    amount: number;
    description: string | null;
    transaction_date: string;
    created_at: string;
}

export interface FinanceGoal {
    id: string;
    user_id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    is_achieved: boolean;
    created_at: string;
}

export interface FinanceGoalAllocation {
    id: string;
    user_id: string;
    goal_id: string;
    amount: number;
    note: string | null;
    allocated_at: string;
}

// --- Repository Functions ---

const supabase = createClient();

// Categories
export async function getFinanceCategories() {
    const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data as FinanceCategory[];
}

export async function createFinanceCategory(category: Partial<FinanceCategory>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('finance_categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as FinanceCategory;
}

export async function updateCategoryLimit(id: string, limit: number) {
    const { data, error } = await supabase
        .from('finance_categories')
        .update({ monthly_budget_limit: limit })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as FinanceCategory;
}

// Transactions
export async function getTransactions(limit = 50, startDate?: string, endDate?: string) {
    let query = supabase
        .from('finance_transactions')
        .select(`
            *,
            finance_categories (
                name,
                icon,
                type
            )
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data, error } = await query;

    if (error) throw error;

    // Map joined category data for easier consumption if needed, 
    // or return as is and handle in UI. 
    return data as FinanceTransaction[];
}

export async function createTransaction(transaction: Partial<FinanceTransaction>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('finance_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as FinanceTransaction;
}

// Goals
export async function getGoals() {
    const { data, error } = await supabase
        .from('finance_goals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FinanceGoal[];
}

export async function createGoal(goal: Partial<FinanceGoal>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('finance_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as FinanceGoal;
}

// Allocations
export async function allocateToGoal(allocation: Partial<FinanceGoalAllocation>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('finance_goal_allocations')
        .insert([{ ...allocation, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as FinanceGoalAllocation;
}

export async function getGoalAllocations(goalId: string) {
    const { data, error } = await supabase
        .from('finance_goal_allocations')
        .select('*')
        .eq('goal_id', goalId)
        .order('allocated_at', { ascending: false });

    if (error) throw error;
    return data as FinanceGoalAllocation[];
}

export async function getRecentAllocations(limit = 50, startDate?: string, endDate?: string) {
    let query = supabase
        .from('finance_goal_allocations')
        .select('*')
        .order('allocated_at', { ascending: false })
        .limit(limit);

    if (startDate) query = query.gte('allocated_at', startDate);
    if (endDate) query = query.lte('allocated_at', endDate);

    const { data, error } = await query;

    if (error) throw error;
    return data as FinanceGoalAllocation[];
}
