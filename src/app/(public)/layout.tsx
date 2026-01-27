
import { MarketingHeader } from '@/components/MarketingHeader';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <MarketingHeader />
            <main>
                {children}
            </main>
        </>
    );
}
