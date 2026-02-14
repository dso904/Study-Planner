import { Box, Group, Text, useMantineTheme } from '@mantine/core';
import { IconFlame, IconChecks, IconClock } from '@tabler/icons-react';
import { useTaskStore } from '../../lib/store';
import { dayjs } from '../../lib/dates';

export default function StatusBar() {
    const theme = useMantineTheme();
    const tasks = useTaskStore((s) => s.tasks);

    // Today's stats
    const today = dayjs().format('YYYY-MM-DD');
    const todayTasks = tasks.filter((t) => t.date === today);
    const todayDone = todayTasks.filter((t) => t.status === 'done').length;
    const todayTotal = todayTasks.length;

    // Calculate total hours studied today
    const hoursToday = todayTasks
        .filter((t) => t.status === 'done')
        .reduce((acc, t) => {
            if (t.start_time && t.end_time) {
                const start = dayjs(t.start_time, 'HH:mm');
                const end = dayjs(t.end_time, 'HH:mm');
                return acc + end.diff(start, 'minute') / 60;
            }
            return acc;
        }, 0);

    return (
        <Box
            className="no-print"
            style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                left: 'var(--sidebar-width)',
                height: 'var(--statusbar-height)',
                background: 'var(--mantine-color-dark-7)',
                borderTop: '1px solid var(--mantine-color-dark-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 50,
                transition: 'left var(--transition-normal)',
                fontSize: 12,
            }}
        >
            <Group gap={20}>
                <Group gap={6}>
                    <IconFlame size={14} color={theme.colors.orange[5]} />
                    <Text size="xs" c="dimmed">
                        Streak: <Text component="span" size="xs" fw={600} c="orange.4">0 days</Text>
                    </Text>
                </Group>

                <Group gap={6}>
                    <IconChecks size={14} color={theme.colors.indigo[4]} />
                    <Text size="xs" c="dimmed">
                        Today: <Text component="span" size="xs" fw={600} c="indigo.4" className="mono">{todayDone}/{todayTotal}</Text>
                    </Text>
                </Group>

                <Group gap={6}>
                    <IconClock size={14} color={theme.colors.teal[4]} />
                    <Text size="xs" c="dimmed">
                        Hours: <Text component="span" size="xs" fw={600} c="teal.4" className="mono">{hoursToday.toFixed(1)}h</Text>
                    </Text>
                </Group>
            </Group>

            <Text size="xs" c="dimmed">
                {dayjs().format('dddd, MMMM D, YYYY')}
            </Text>
        </Box>
    );
}
