import { getTasks, getLifetimeCompletedCount } from '@/lib/repositories/tasksRepository';
import { TasksView } from './TasksView';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const [tasks, count] = await Promise.all([
        getTasks(),
        getLifetimeCompletedCount()
    ]);

    return (
        <TasksView initialTasks={tasks} lifetimeCount={count} />
    );
}
