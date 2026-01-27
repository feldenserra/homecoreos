'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type Achievement = Database['public']['Tables']['achievements']['Row'];

export const createAchievement = async (title: string, description: string, icon: string = '🏆'): Promise<Achievement | null> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data, error } = await supabase
        .from('achievements')
        .insert({
            user_id: userData.user.id,
            title,
            description,
            icon
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating achievement:', error);
        return null;
    }

    return data;
};

export const getAchievements = async (): Promise<Achievement[]> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return [];

    const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }

    return data || [];
};

export const deleteAchievement = async (id: string): Promise<boolean> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting achievement:', error);
        return false;
    }

    return true;
};
