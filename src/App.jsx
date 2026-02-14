import { Box, Text, Group, ActionIcon, TextInput, Tooltip, Badge, UnstyledButton } from '@mantine/core';
import { IconSearch, IconPrinter, IconTerminal2, IconChartBar, IconBooks, IconAlertTriangle, IconX, IconTrendingUp } from '@tabler/icons-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dayjs } from './lib/dates';
import WeeklyPlanner from './pages/WeeklyPlanner';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Backlogs from './pages/Backlogs';
import Analytics from './pages/Analytics';
import PrintModal from './components/PrintModal';
import './styles/dashboard.css';

const drawerItems = [
    { id: 'stats', label: 'Overview', icon: IconChartBar, color: 'var(--neon-violet)' },
    { id: 'analytics', label: 'Analytics', icon: IconTrendingUp, color: 'var(--neon-green)' },
    { id: 'backlogs', label: 'Backlogs', icon: IconAlertTriangle, color: 'var(--neon-pink)' },
    { id: 'subjects', label: 'Subjects', icon: IconBooks, color: 'var(--neon-cyan)' },
];

const drawerContent = {
    stats: Dashboard,
    analytics: Analytics,
    backlogs: Backlogs,
    subjects: Subjects,
};

export default function App() {
    const [activeDrawer, setActiveDrawer] = useState(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    const toggleDrawer = (id) => setActiveDrawer((prev) => (prev === id ? null : id));
    const closeDrawer = () => setActiveDrawer(null);

    const DrawerComponent = activeDrawer ? drawerContent[activeDrawer] : null;
    const activeItem = drawerItems.find((d) => d.id === activeDrawer);

    return (
        <Box className="command-center">
            {/* ═══ HEADER ═════════════════════════════ */}
            <header className="cc-header no-print">
                <Group justify="space-between" style={{ width: '100%' }}>
                    <Group gap={12}>
                        <Box className="cc-logo">
                            <IconTerminal2 size={18} color="#8b5cf6" stroke={2} />
                        </Box>
                        <Box>
                            <Group gap={8} align="baseline">
                                <Text size="sm" fw={800} className="neon-text" lh={1.2}>
                                    DAY PLANNER
                                </Text>
                                <Badge size="xs" variant="outline" color="violet"
                                    styles={{ root: { borderColor: 'rgba(139,92,246,0.3)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 8 } }}
                                >
                                    v1.0
                                </Badge>
                            </Group>
                            <Text size="10px" c="var(--text-muted)" className="mono" lh={1.2}>
                                {dayjs().format('ddd, MMM D YYYY · HH:mm')}
                            </Text>
                        </Box>
                    </Group>

                    <Group gap={6}>
                        <TextInput
                            placeholder="Search..."
                            leftSection={<IconSearch size={13} stroke={1.5} color="var(--text-muted)" />}
                            size="xs"
                            variant="filled"
                            radius="md"
                            style={{ width: 180 }}
                            styles={{ input: { background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 11 } }}
                        />
                        <Tooltip label="Print / Export" withArrow>
                            <ActionIcon variant="subtle" size="sm" radius="md" onClick={() => setPrintModalOpen(true)}>
                                <IconPrinter size={15} color="var(--text-muted)" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </header>

            {/* ═══ MAIN LAYOUT ═══════════════════════ */}
            <Box className="cc-body">
                {/* ── Icon Toolbar (left edge) ──── */}
                <nav className="cc-toolbar no-print">
                    {drawerItems.map((item) => {
                        const isActive = activeDrawer === item.id;
                        return (
                            <Tooltip key={item.id} label={item.label} position="right" withArrow>
                                <UnstyledButton
                                    className={`cc-toolbar-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => toggleDrawer(item.id)}
                                    style={{ '--btn-color': item.color }}
                                >
                                    <item.icon size={18} stroke={1.5} color={isActive ? item.color : 'var(--text-faint)'} />
                                    {isActive && <Box className="cc-toolbar-indicator" style={{ background: item.color }} />}
                                </UnstyledButton>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* ── Slide-Out Drawer Panel ──── */}
                <AnimatePresence>
                    {activeDrawer && DrawerComponent && (
                        <motion.aside
                            className="cc-drawer"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 380, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="cc-drawer-inner">
                                <div className="cc-drawer-header">
                                    <Group gap={8}>
                                        {activeItem && <activeItem.icon size={15} color={activeItem.color} stroke={1.8} />}
                                        <Text size="xs" fw={700} tt="uppercase" lts={1} c="var(--text-muted)" className="mono">
                                            {activeItem?.label}
                                        </Text>
                                    </Group>
                                    <ActionIcon variant="subtle" size="xs" onClick={closeDrawer}>
                                        <IconX size={14} color="var(--text-faint)" />
                                    </ActionIcon>
                                </div>
                                <div className="cc-drawer-body">
                                    <DrawerComponent />
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ── Main Content (scrollable) ── */}
                <main className="cc-main">
                    {/* Weekly Grid */}
                    <section className="cyber-panel cc-panel-planner">
                        <div className="cyber-panel-body" style={{ padding: '14px 16px' }}>
                            <WeeklyPlanner />
                        </div>
                    </section>
                </main>
            </Box>
            <PrintModal opened={printModalOpen} onClose={() => setPrintModalOpen(false)} />
        </Box>
    );
}
