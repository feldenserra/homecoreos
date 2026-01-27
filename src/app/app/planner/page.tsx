import { PlannerBoard } from '@/components/planner/PlannerBoard';
import { getPlannerData } from '@/lib/repositories/plannerRepository';

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
    const data = await getPlannerData();

    return <PlannerBoard initialData={data} />;
}
