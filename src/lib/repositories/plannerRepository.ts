'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type PlannerDayRow = Database['public']['Tables']['planner_days']['Row'];
export type PlannerTaskRow = Database['public']['Tables']['planner_tasks']['Row'];

export interface PlannerDayWithTasks extends PlannerDayRow {
    planner_tasks: PlannerTaskRow[];
}

export const getPlannerData = async (): Promise<PlannerDayWithTasks[]> => {
    const supabase = await createClient();
    
    // First ensure days exist
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await ensureWeekDays(user.id);
    }

    const { data, error } = await supabase
        .from('planner_days')
        .select(`
            *,
            planner_tasks (*)
        `)
        .order('day_index', { ascending: true });

    if (error) {
        console.error('[PlannerRepo] Error fetching planner data:', error);
        return [];
    }

    // Sort tasks by position or created_at within each day
    const sortedData = data?.map(day => ({
        ...day,
        planner_tasks: day.planner_tasks.sort((a, b) => {
             // If we had a position field we would use it, falling back to created_at
             // For now, let's assume created_at is consistent enough, or add position handling if schema has it.
             // The user schema showed 'position' int default 0.
             if (a.position !== b.position) {
                 return (a.position || 0) - (b.position || 0);
             }
             return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        })
    })) as PlannerDayWithTasks[];

    return sortedData || [];
};

export const ensureWeekDays = async (userId: string) => {
    const supabase = await createClient();
    
    // Check if days exist
    const { count } = await supabase
        .from('planner_days')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (count === 7) return;

    const days = [
        { day_name: 'Monday', day_index: 0 },
        { day_name: 'Tuesday', day_index: 1 },
        { day_name: 'Wednesday', day_index: 2 },
        { day_name: 'Thursday', day_index: 3 },
        { day_name: 'Friday', day_index: 4 },
        { day_name: 'Saturday', day_index: 5 },
        { day_name: 'Sunday', day_index: 6 },
    ];

    // Upsert days (using on conflict do nothing if possible, or just insert missing)
    // unique constraint on (user_id, day_name) helps us here.
    const { error } = await supabase
        .from('planner_days')
        .upsert(
            days.map(d => ({
                user_id: userId,
                day_name: d.day_name,
                day_index: d.day_index
            })),
            { onConflict: 'user_id, day_name', ignoreDuplicates: true }
        );

    if (error) {
        console.error('[PlannerRepo] Error ensuring week days:', error);
    }
};

export const addPlannerTask = async (dayId: string, content: string): Promise<PlannerTaskRow | null> => {
    const supabase = await createClient();
    
    // Get max position for the day to append to bottom
    // Optimization: could be done in a trigger or just query.
    // simpler: select max position
    const { data: maxPosData } = await supabase
        .from('planner_tasks')
        .select('position')
        .eq('planner_day_id', dayId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
    
    const newPosition = (maxPosData?.position ?? -1) + 1;

    const { data, error } = await supabase
        .from('planner_tasks')
        .insert({
            planner_day_id: dayId,
            content,
            position: newPosition
        })
        .select()
        .single();

    if (error) {
        console.error('[PlannerRepo] Error adding task:', error);
        return null;
    }

    return data;
};

export const deletePlannerTask = async (taskId: string): Promise<void> => {
    const supabase = await createClient();
    const { error } = await supabase
        .from('planner_tasks')
        .delete()
        .eq('id', taskId);
        
    if (error) {
        console.error('[PlannerRepo] Error deleting task:', error);
    }
};
