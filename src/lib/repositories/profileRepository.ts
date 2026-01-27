import { createClient } from '@/lib/supabase/client';

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const supabase = createClient();

    // Check if the username exists in the profiles table
    // Note: This requires the profiles table to exist and have RLS policies allowing public select
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    // If we find a row, the username is taken
    if (data && !error) {
        return false;
    }

    // If we get an error other than "Row not found", it might be an issue, but standard "PGRST116" means not found
    if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        // Fail open or closed? Let's assume available but log error to likely fail later if critical
        return true;
    }

    // No user found, so it's available
    return true;
};
