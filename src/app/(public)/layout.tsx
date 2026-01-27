
import { MarketingHeader } from '@/components/MarketingHeader';
import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';

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
            <FloatingThemeToggle />
        </>
    );
}
