
import { MarketingHeader } from '@/components/MarketingHeader';
import { MarketingFooter } from '@/components/MarketingFooter';
import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
import { Analytics } from "@vercel/analytics/next"

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Analytics />
            <MarketingHeader />
            <main style={{ flex: 1 }}>
                {children}
            </main>
            <MarketingFooter />
            <FloatingThemeToggle />
        </div>
    );
}
