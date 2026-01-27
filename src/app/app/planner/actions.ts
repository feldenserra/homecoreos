'use server';

import { addPlannerTask, deletePlannerTask } from '@/lib/repositories/plannerRepository';
import { revalidatePath } from 'next/cache';

export async function addPlannerTaskAction(dayId: string, content: string) {
    if (!content.trim()) return;
    await addPlannerTask(dayId, content);
    revalidatePath('/app/planner');
}

export async function deletePlannerTaskAction(taskId: string) {
    await deletePlannerTask(taskId);
    revalidatePath('/app/planner');
}
