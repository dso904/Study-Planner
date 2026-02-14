import { Box } from '@mantine/core';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatusBar from './StatusBar';
import { useUIStore } from '../../lib/store';

export default function AppShell({ children }) {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const sidebarWidth = sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

    return (
        <Box
            style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                overflow: 'hidden',
                background: 'var(--mantine-color-dark-8)',
            }}
        >
            {/* Sidebar */}
            <Sidebar />

            {/* Main area */}
            <Box
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: sidebarWidth,
                    transition: 'margin-left var(--transition-normal)',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                {/* Top bar */}
                <Topbar />

                {/* Main content */}
                <Box
                    component="main"
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '20px 24px',
                        paddingBottom: `calc(var(--statusbar-height) + 20px)`,
                    }}
                >
                    {children}
                </Box>

                {/* Status bar */}
                <StatusBar />
            </Box>
        </Box>
    );
}
