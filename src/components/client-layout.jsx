'use client';

import { Provider, useAtomValue } from 'jotai';
import { sidebarCollapsedAtom } from '@/lib/atoms';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';
import StatusBar from '@/components/layout/status-bar';
import StoreHydrator from '@/components/store-hydrator';
import QuickNotes from '@/components/quick-notes/quick-notes';

function AppShell({ children }) {
    const collapsed = useAtomValue(sidebarCollapsedAtom);
    const sidebarW = collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)';

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            <Sidebar />
            <div
                className="flex flex-1 flex-col h-screen overflow-hidden transition-all duration-300"
                style={{ marginLeft: sidebarW }}
            >
                <Topbar />
                <main className="flex-1 overflow-auto p-5 pb-14">
                    {children}
                </main>
                <StatusBar />
            </div>
            {/* Quick Notes overlay — accessible from any page */}
            <QuickNotes />
        </div>
    );
}

export default function ClientLayout({ children }) {
    return (
        <Provider>
            <StoreHydrator />
            <AppShell>{children}</AppShell>
        </Provider>
    );
}
