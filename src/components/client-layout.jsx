'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Provider, useAtom, useAtomValue } from 'jotai';
import { sidebarCollapsedAtom } from '@/lib/atoms';
import { isAuthenticatedAtom, isSessionValid, destroySession } from '@/lib/auth';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import StatusBar from '@/components/layout/status-bar';
import StoreHydrator from '@/components/store-hydrator';
import QuickNotes from '@/components/quick-notes/quick-notes';
import TimerWidget from '@/components/timer/timer-widget';
import ErrorBoundary from '@/components/error-boundary';
import LoginPage from '@/components/login-page';
import { Toaster } from '@/components/ui/sonner';
import {
    CalendarDays,
    LayoutDashboard,
    BookOpen,
    Library,
    AlertTriangle,
} from 'lucide-react';

/* ─── Mobile Bottom Navigation ─── */
const mobileNavItems = [
    { key: '/', label: 'Planner', icon: CalendarDays },
    { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: '/subjects', label: 'Subjects', icon: BookOpen },
    { key: '/library', label: 'Library', icon: Library },
    { key: '/backlogs', label: 'Backlogs', icon: AlertTriangle },
];

function MobileBottomNav() {
    const pathname = usePathname();
    // M2-FIX: Use shared hook instead of inline duplicate logic
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    return (
        <nav className="mobile-bottom-nav" style={{ display: 'flex' }}>
            {mobileNavItems.map((item) => {
                const active = pathname === item.key;
                return (
                    <Link
                        key={item.key}
                        href={item.key}
                        className={`mobile-nav-item ${active ? 'active' : ''}`}
                    >
                        <item.icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                        <span className="mobile-nav-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

/* M1-FIX: useIsMobile moved to @/hooks/use-mobile */

function AppShell({ children }) {
    const collapsed = useAtomValue(sidebarCollapsedAtom);
    const sidebarW = collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)';
    const isMobile = useIsMobile();

    return (
        <div className="app-shell flex h-screen w-screen overflow-hidden bg-background">
            {/* I2-FIX: Skip to content link for keyboard/screen reader users */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-violet-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
                Skip to content
            </a>
            {/* Sidebar — hidden on mobile via CSS */}
            <Sidebar />
            <div
                className="app-content flex flex-1 flex-col h-screen overflow-hidden transition-[margin-left] duration-300"
                style={{ marginLeft: isMobile ? 0 : sidebarW }}
            >
                <Topbar />
                <main id="main-content" className="flex-1 overflow-auto p-5 pb-14">
                    {children}
                </main>
                {/* StatusBar — hidden on mobile via CSS */}
                <StatusBar />
            </div>
            {/* Quick Notes overlay — accessible from any page */}
            <QuickNotes />
            {/* Timer Widget — floating timer/stopwatch */}
            <TimerWidget />
            {/* Mobile bottom nav — visible only on mobile via CSS */}
            <MobileBottomNav />
        </div>
    );
}

function AuthGate({ children }) {
    const [isAuthenticated, setAuthenticated] = useAtom(isAuthenticatedAtom);

    // Restore session from sessionStorage on mount
    useEffect(() => {
        if (isSessionValid()) {
            setAuthenticated(true);
        }
    }, [setAuthenticated]);

    // Prevent back-button bypass: when logged out, replace history state
    useEffect(() => {
        if (!isAuthenticated) {
            // Push a state so that pressing back repeatedly stays on login
            window.history.replaceState({ loggedOut: true }, '', window.location.href);

            const handlePopState = () => {
                if (!isSessionValid()) {
                    window.history.replaceState({ loggedOut: true }, '', window.location.href);
                }
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return children;
}

export default function ClientLayout({ children }) {
    return (
        <Provider>
            <AuthGate>
                <StoreHydrator />
                <ErrorBoundary>
                    <AppShell>{children}</AppShell>
                </ErrorBoundary>
            </AuthGate>
            <Toaster position="top-right" richColors />
        </Provider>
    );
}
