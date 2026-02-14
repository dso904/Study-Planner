import { Box, Text, Group, Badge, Stack, RingProgress, Progress } from '@mantine/core';
import { IconFlame, IconChecks, IconClock, IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTaskStore, useSubjectStore } from '../lib/store';
import { dayjs } from '../lib/dates';

const subjectChartColors = {
    physics: '#22d3ee',
    chemistry: '#f472b6',
    maths: '#fb923c',
    biology: '#34d399',
};

function MiniStat({ icon: Icon, label, value, color }) {
    return (
        <Box style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--bg-card)',
            border: `1px solid ${color ? color + '20' : 'var(--border-subtle)'}`,
            position: 'relative',
            overflow: 'hidden',
        }}>
            <Box style={{ position: 'absolute', top: 8, right: 10, opacity: 0.12 }}>
                <Icon size={28} color={color || 'var(--text-faint)'} />
            </Box>
            <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono" mb={2}>
                {label}
            </Text>
            <Text size="xl" fw={800} c={color || 'var(--text-primary)'} className="mono" lh={1.1}>
                {value}
            </Text>
        </Box>
    );
}

export default function Dashboard() {
    const tasks = useTaskStore((s) => s.tasks);
    const subjects = useSubjectStore((s) => s.subjects);

    const today = dayjs().format('YYYY-MM-DD');
    const todayTasks = tasks.filter((t) => t.date === today);
    const todayDone = todayTasks.filter((t) => t.status === 'done').length;
    const todayTotal = todayTasks.length;

    const weekStart = dayjs().startOf('week').add(1, 'day');
    const weekTasks = tasks.filter((t) => {
        const d = dayjs(t.date);
        return d.isAfter(weekStart.subtract(1, 'day')) && d.isBefore(weekStart.add(7, 'day'));
    });
    const weekDone = weekTasks.filter((t) => t.status === 'done').length;
    const weekTotal = weekTasks.length;
    const weekHours = weekTasks.filter((t) => t.status === 'done').reduce((acc, t) => {
        if (t.start_time && t.end_time) return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
        return acc;
    }, 0);
    const weekProgress = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

    const backlogs = tasks.filter((t) => t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'));

    const chartData = subjects.map((subject) => {
        const subjectTasks = weekTasks.filter((t) => t.subject_id === subject.id && t.status === 'done');
        const hours = subjectTasks.reduce((acc, t) => {
            if (t.start_time && t.end_time) return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
            return acc;
        }, 0);
        return { name: subject.name.slice(0, 4), hours: Math.round(hours * 10) / 10, color: subjectChartColors[subject.name.toLowerCase()] || '#8b5cf6' };
    });

    const upcoming = tasks.filter((t) => t.status === 'pending' && (t.date === today || dayjs(t.date).isAfter(dayjs(), 'day')))
        .sort((a, b) => `${a.date}_${a.start_time}`.localeCompare(`${b.date}_${b.start_time}`)).slice(0, 6);

    return (
        <Stack gap={14}>
            {/* Stats */}
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MiniStat icon={IconChecks} label="Today" value={`${todayDone}/${todayTotal}`} color="var(--neon-violet)" />
                <MiniStat icon={IconClock} label="Hours" value={`${weekHours.toFixed(1)}`} color="var(--neon-cyan)" />
                <MiniStat icon={IconFlame} label="Streak" value="0" color="var(--neon-orange)" />
                <MiniStat icon={IconAlertTriangle} label="Overdue" value={backlogs.length} color={backlogs.length > 0 ? 'var(--neon-pink)' : 'var(--neon-green)'} />
            </Box>

            {/* Week Ring */}
            <Box style={{ padding: 14, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono" mb={8}>
                    Weekly Progress
                </Text>
                <Box style={{ display: 'flex', justifyContent: 'center' }}>
                    <RingProgress size={110} thickness={10} roundCaps
                        label={<Box style={{ textAlign: 'center' }}><Text size="lg" fw={800} className="mono neon-text">{weekProgress}%</Text><Text size="9px" c="var(--text-faint)" className="mono">{weekDone}/{weekTotal}</Text></Box>}
                        sections={[{ value: weekProgress, color: 'var(--neon-violet)' }]}
                        rootColor="rgba(139, 92, 246, 0.08)"
                    />
                </Box>
            </Box>

            {/* Chart */}
            {chartData.length > 0 && (
                <Box style={{ padding: 12, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono" mb={8}>Hours by Subject</Text>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={chartData} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ background: '#110f36', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, color: '#e2e8f0', fontFamily: 'JetBrains Mono' }} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            )}

            {/* Upcoming */}
            <Box style={{ padding: 12, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <Group justify="space-between" mb={8}>
                    <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono">Upcoming</Text>
                    <Badge size="xs" variant="outline" color="violet" styles={{ root: { borderColor: 'var(--border-glow)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 9 } }}>{upcoming.length}</Badge>
                </Group>
                {upcoming.length === 0 ? (
                    <Text size="xs" c="var(--text-faint)" ta="center" py={8}>No upcoming tasks</Text>
                ) : (
                    <Stack gap={4}>
                        {upcoming.map((task) => (
                            <Box key={task.id} style={{ padding: '7px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.04)', border: '1px solid var(--border-subtle)' }}>
                                <Text size="xs" fw={500} c="var(--text-primary)" lineClamp={1}>{task.title}</Text>
                                <Text size="9px" c="var(--text-faint)" className="mono">{dayjs(task.date).format('ddd D')} · {task.start_time}</Text>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Subject Progress */}
            {subjects.length > 0 && (
                <Box style={{ padding: 12, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono" mb={8}>Subject Progress</Text>
                    <Stack gap={8}>
                        {subjects.map((s) => {
                            const st = tasks.filter((t) => t.subject_id === s.id);
                            const done = st.filter((t) => t.status === 'done').length;
                            const total = st.length;
                            const pct = total ? Math.round((done / total) * 100) : 0;
                            const color = subjectChartColors[s.name.toLowerCase()] || '#8b5cf6';
                            return (
                                <Box key={s.id}>
                                    <Group justify="space-between" mb={3}>
                                        <Group gap={6}><Box style={{ width: 6, height: 6, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}40` }} /><Text size="xs" fw={500} c="var(--text-secondary)">{s.name}</Text></Group>
                                        <Text size="9px" c="var(--text-faint)" className="mono">{done}/{total}</Text>
                                    </Group>
                                    <Progress value={pct} size={4} radius="xl" color={color} styles={{ root: { background: 'rgba(139,92,246,0.08)' } }} />
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
}
