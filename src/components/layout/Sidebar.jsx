import { Box, Text, Tooltip, UnstyledButton, useMantineTheme } from '@mantine/core';
import {
    IconCalendarWeek,
    IconLayoutDashboard,
    IconBooks,
    IconAlertTriangle,
    IconSettings,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react';
import { useUIStore } from '../../lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { key: 'planner', label: 'Week Planner', icon: IconCalendarWeek },
    { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { key: 'subjects', label: 'Subjects', icon: IconBooks },
    { key: 'backlogs', label: 'Backlogs', icon: IconAlertTriangle },
    { key: 'settings', label: 'Settings', icon: IconSettings },
];

function NavItem({ item, active, collapsed, onClick }) {
    const theme = useMantineTheme();

    const button = (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                width: '100%',
                transition: 'all var(--transition-fast)',
                background: active
                    ? `rgba(91, 110, 225, 0.12)`
                    : 'transparent',
                color: active
                    ? theme.colors.indigo[4]
                    : theme.colors.dark[1],
                fontWeight: active ? 600 : 400,
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = theme.colors.dark[0];
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme.colors.dark[1];
                }
            }}
        >
            {/* Active indicator bar */}
            {active && (
                <motion.div
                    layoutId="sidebar-active"
                    style={{
                        position: 'absolute',
                        left: collapsed ? '50%' : 0,
                        top: collapsed ? 'auto' : '50%',
                        bottom: collapsed ? -2 : 'auto',
                        transform: collapsed ? 'translateX(-50%)' : 'translateY(-50%)',
                        width: collapsed ? 20 : 3,
                        height: collapsed ? 3 : 24,
                        borderRadius: 2,
                        background: theme.colors.indigo[4],
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
            <item.icon size={20} stroke={1.8} />
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ whiteSpace: 'nowrap', fontSize: 14 }}
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </UnstyledButton>
    );

    if (collapsed) {
        return (
            <Tooltip label={item.label} position="right" withArrow offset={12}>
                {button}
            </Tooltip>
        );
    }

    return button;
}

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, activeView, setActiveView } = useUIStore();

    return (
        <Box
            component="nav"
            className="no-print"
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                background: 'var(--mantine-color-dark-7)',
                borderRight: '1px solid var(--mantine-color-dark-4)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 'var(--z-sidebar)',
                transition: 'width var(--transition-normal)',
                overflow: 'hidden',
            }}
        >
            {/* Logo area */}
            <Box
                style={{
                    padding: sidebarCollapsed ? '20px 12px' : '20px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    borderBottom: '1px solid var(--mantine-color-dark-4)',
                    minHeight: 64,
                }}
            >
                <Box
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #5B6EE1, #8B5CF6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Text size="lg" fw={700} c="white" style={{ lineHeight: 1 }}>
                        D
                    </Text>
                </Box>
                <AnimatePresence>
                    {!sidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Text size="md" fw={700} c="var(--mantine-color-dark-0)" style={{ whiteSpace: 'nowrap' }}>
                                Day Planner
                            </Text>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Nav items */}
            <Box
                style={{
                    flex: 1,
                    padding: sidebarCollapsed ? '16px 12px' : '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}
            >
                {navItems.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        active={activeView === item.key}
                        collapsed={sidebarCollapsed}
                        onClick={() => setActiveView(item.key)}
                    />
                ))}
            </Box>

            {/* Collapse button */}
            <Box
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--mantine-color-dark-4)',
                    display: 'flex',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
                }}
            >
                <UnstyledButton
                    onClick={toggleSidebar}
                    style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        color: 'var(--mantine-color-dark-2)',
                        transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'var(--mantine-color-dark-0)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--mantine-color-dark-2)';
                    }}
                >
                    {sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
                </UnstyledButton>
            </Box>
        </Box>
    );
}
