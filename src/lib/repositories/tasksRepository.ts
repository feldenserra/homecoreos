'use server';

import { createClient } from '@/lib/supabase/server';

export interface Task {
    id: string;
    title: string;
    category: string;
    is_complete: boolean;
    create_date: string;
}

export const getTasks = async (): Promise<Task[]> => {
    const supabase = await createClient();
    console.log('[REPO] Fetching tasks for user...');
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('create_date', { ascending: false });

    if (error) {
        console.error('[REPO] Error fetching tasks:', error);
        return [];
    }

    console.log(`[REPO] Fetched ${data?.length} tasks.`);
    return data as Task[];
};

export const addTask = async (title: string, category: string): Promise<Task | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('tasks')
        .insert([
            {
                title,
                category,
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('[REPO] Error adding task:', error);
        return null;
    }

    return data as Task;
};

export const toggleTask = async (id: string, currentStatus: boolean): Promise<void> => {
    const supabase = await createClient();
    const { error } = await supabase
        .from('tasks')
        .update({ is_complete: !currentStatus })
        .eq('id', id);

    if (error) {
        console.error('[REPO] Error toggling task:', error);
    }
};

export const deleteTask = async (id: string): Promise<void> => {
    const supabase = await createClient();
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[REPO] Error deleting task:', error);
    }
};

export const getLifetimeCompletedCount = async (): Promise<number> => {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_complete', true);

    if (error) {
        console.error('[REPO] Error counting tasks:', error);
        return 0;
    }
    return count || 0;
};
