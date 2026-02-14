import { Box, Text, Group, UnstyledButton } from '@mantine/core';
import {
    IconCalendarWeek,
    IconLayoutDashboard,
    IconBooks,
    IconAlertTriangle,
    IconSettings,
    IconChevronDown,
} from '@tabler/icons-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = {
    calendar: IconCalendarWeek,
    dashboard: IconLayoutDashboard,
    subjects: IconBooks,
    backlogs: IconAlertTriangle,
    settings: IconSettings,
};

export default function CollapsibleSection({
    title,
    subtitle,
    icon,
    accentColor = 'var(--accent-sage)',
    defaultOpen = false,
    children,
}) {
    const [open, setOpen] = useState(defaultOpen);
    const Icon = iconMap[icon] || IconCalendarWeek;

    return (
        <Box
            style={{
                borderRadius: 16,
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card)',
                overflow: 'hidden',
                boxShadow: open
                    ? '0 4px 20px rgba(140, 120, 90, 0.06)'
                    : '0 1px 4px rgba(140, 120, 90, 0.04)',
                transition: 'box-shadow var(--transition-normal)',
            }}
        >
            {/* Header — always visible, clickable */}
            <UnstyledButton
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: open ? 'var(--bg-section-header)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                    if (!open) e.currentTarget.style.background = 'rgba(248, 240, 227, 0.5)';
                }}
                onMouseLeave={(e) => {
                    if (!open) e.currentTarget.style.background = 'transparent';
                }}
            >
                <Group gap={14}>
                    {/* Accent dot + Icon */}
                    <Box
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: `${accentColor}12`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Icon size={20} color={accentColor} stroke={1.8} />
                    </Box>
                    <Box>
                        <Text size="md" fw={600} c="var(--text-primary)" lh={1.3}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text size="xs" c="var(--text-muted)" lh={1.3}>
                                {subtitle}
                            </Text>
                        )}
                    </Box>
                </Group>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <IconChevronDown size={18} color="var(--text-muted)" />
                </motion.div>
            </UnstyledButton>

            {/* Collapsible body */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Box
                            style={{
                                padding: '20px 24px 24px',
                                borderTop: '1px solid var(--border-light)',
                            }}
                        >
                            {children}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
}
