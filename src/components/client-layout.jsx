'use client';

import { useEffect } from 'react';
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

function AppShell({ children }) {
    const collapsed = useAtomValue(sidebarCollapsedAtom);
    const sidebarW = collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)';

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* I2-FIX: Skip to content link for keyboard/screen reader users */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-violet-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
                Skip to content
            </a>
            <Sidebar />
            <div
                className="flex flex-1 flex-col h-screen overflow-hidden transition-[margin-left] duration-300"
                style={{ marginLeft: sidebarW }}
            >
                <Topbar />
                <main id="main-content" className="flex-1 overflow-auto p-5 pb-14">
                    {children}
                </main>
                <StatusBar />
            </div>
            {/* Quick Notes overlay — accessible from any page */}
            <QuickNotes />
            {/* Timer Widget — floating timer/stopwatch */}
            <TimerWidget />
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

