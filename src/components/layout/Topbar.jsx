import {
    Box,
    TextInput,
    ActionIcon,
    useMantineColorScheme,
    Tooltip,
    Group,
    Text,
} from '@mantine/core';
import {
    IconSearch,
    IconSun,
    IconMoon,
    IconPrinter,
} from '@tabler/icons-react';
import { useUIStore } from '../../lib/store';
import { getWeekRangeLabel, isCurrentWeek } from '../../lib/dates';

export default function Topbar() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';
    const { activeView, currentWeekStart } = useUIStore();

    const viewTitles = {
        planner: 'Week Planner',
        dashboard: 'Dashboard',
        subjects: 'Subjects & Chapters',
        backlogs: 'Backlogs',
        settings: 'Settings',
    };

    return (
        <Box
            component="header"
            className="no-print"
            style={{
                height: 64,
                minHeight: 64,
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--mantine-color-dark-4)',
                background: dark
                    ? 'rgba(22, 27, 39, 0.8)'
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-topbar)',
            }}
        >
            {/* Left: Title + Week range */}
            <Group gap={16}>
                <Text size="lg" fw={700} c={dark ? 'dark.0' : 'dark.8'}>
                    {viewTitles[activeView] || 'Day Planner'}
                </Text>
                {activeView === 'planner' && (
                    <Text
                        size="sm"
                        c="dimmed"
                        className="mono"
                        style={{
                            background: isCurrentWeek(currentWeekStart)
                                ? 'rgba(91, 110, 225, 0.1)'
                                : 'rgba(255,255,255,0.04)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                        }}
                    >
                        {getWeekRangeLabel(currentWeekStart)}
                    </Text>
                )}
            </Group>

            {/* Right: Actions */}
            <Group gap={8}>
                <TextInput
                    placeholder="Search tasks..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    size="sm"
                    variant="filled"
                    radius="md"
                    style={{ width: 220 }}
                    styles={{
                        input: {
                            background: dark
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.04)',
                            border: '1px solid transparent',
                            transition: 'all var(--transition-fast)',
                            '&:focus': {
                                background: dark
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.06)',
                                borderColor: 'var(--mantine-color-indigo-5)',
                            },
                        },
                    }}
                />

                <Tooltip label="Print today's plan">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        radius="md"
                        onClick={() => window.print()}
                    >
                        <IconPrinter size={18} stroke={1.5} />
                    </ActionIcon>
                </Tooltip>

                <Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        radius="md"
                        onClick={toggleColorScheme}
                    >
                        {dark ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Box>
    );
}
