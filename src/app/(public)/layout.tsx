
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
            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--mantine-color-dimmed)', fontSize: '0.75rem' }}>
                &copy; {new Date().getFullYear()} Feldenserra. All rights reserved.
            </footer>
            <FloatingThemeToggle />
        </>
    );
}
