import { Analytics } from "@vercel/analytics/next"
import { AppLayout } from '@/components/AppLayout';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Analytics />
            <AppLayout>
                {children}
            </AppLayout>
        </>
    );
}
