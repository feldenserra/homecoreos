'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type Note = Database['public']['Tables']['notes']['Row'];

export const createNote = async (text: string): Promise<Note | null> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: userData.user.id,
            note: text
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating note:', error);
        return null;
    }

    return data;
};

export const getNotes = async (): Promise<Note[]> => {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return [];

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notes:', error);
        return [];
    }

    return data || [];
};

export const deleteNote = async (id: string): Promise<boolean> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting note:', error);
        return false;
    }

    return true;
};
