import { createClient } from '@/lib/supabase/client';

export interface Task {
    id: string;
    title: string;
    category: string;
    is_complete: boolean; // Changed from 'completed' to match DB
    create_date: string;  // Changed from 'createdAt' to match DB
}

const supabase = createClient();

export const tasksRepository = {
    getTasks: async (): Promise<Task[]> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('create_date', { ascending: false });

        if (error) {
            console.error('[REPO] Error fetching tasks:', error);
            return [];
        }

        return data as Task[];
    },

    addTask: async (title: string, category: string): Promise<Task | null> => {
        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    title,
                    category,
                    // user_id is handled by default auth.uid() in Postgres
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('[REPO] Error adding task:', error);
            return null;
        }

        console.log('[REPO] Task added:', data);
        return data as Task;
    },

    toggleTask: async (id: string, currentStatus: boolean): Promise<void> => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_complete: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('[REPO] Error toggling task:', error);
        } else {
            console.log(`[REPO] Task ${id} status toggled.`);
        }
    },

    deleteTask: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[REPO] Error deleting task:', error);
        } else {
            console.log(`[REPO] Task ${id} deleted.`);
        }
    },

    getLifetimeCompletedCount: async (): Promise<number> => {
        const { count, error } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('is_complete', true);

        if (error) {
            console.error('[REPO] Error counting tasks:', error);
            return 0;
        }
        return count || 0;
    }
};
