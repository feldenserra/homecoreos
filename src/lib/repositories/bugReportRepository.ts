import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type BugReportInput = Database['public']['Tables']['bug_reports']['Insert'];

export const createBugReport = async (report: Omit<BugReportInput, 'user_id'>) => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('bug_reports')
        .insert({
            ...report,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating bug report:', error);
        throw error;
    }

    return data;
};
