import { Box, Text, Group, Badge, Stack, RingProgress, Progress, SimpleGrid } from '@mantine/core';
import { IconFlame, IconClock, IconChartBar, IconTarget, IconTrendingUp, IconCalendarStats } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { useTaskStore, useSubjectStore } from '../lib/store';
import { dayjs } from '../lib/dates';
import { useMemo } from 'react';

const subjectChartColors = {
    physics: '#22d3ee', chemistry: '#f472b6', maths: '#fb923c', biology: '#34d399',
};

const categoryColors = {
    lecture: '#8b5cf6', theory: '#22d3ee', revision: '#fb923c', practice: '#34d399',
    test: '#f43f5e', assignment: '#facc15', self_study: '#a855f7', school: '#64748b',
    tuition: '#f472b6', other: '#94a3b8',
};

const categoryLabels = {
    lecture: 'Lecture', theory: 'Theory', revision: 'Revision', practice: 'Practice',
    test: 'Test', assignment: 'Assignment', self_study: 'Self-Study', school: 'School',
    tuition: 'Tuition', other: 'Other',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
    return (
        <Box style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-card)', border: `1px solid ${color}18`, position: 'relative', overflow: 'hidden' }}>
            <Box style={{ position: 'absolute', top: 8, right: 10, opacity: 0.1 }}><Icon size={30} color={color} /></Box>
            <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono" mb={4}>{label}</Text>
            <Text size="xl" fw={800} c={color} className="mono" lh={1.1}>{value}</Text>
            {sub && <Text size="9px" c="var(--text-faint)" className="mono" mt={2}>{sub}</Text>}
        </Box>
    );
}

function ChartCard({ title, icon: Icon, children }) {
    return (
        <Box style={{ padding: 14, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <Group gap={6} mb={10}>
                {Icon && <Icon size={12} color="var(--text-faint)" />}
                <Text size="9px" fw={600} tt="uppercase" lts={1} c="var(--text-muted)" className="mono">{title}</Text>
            </Group>
            {children}
        </Box>
    );
}

export default function Analytics() {
    const tasks = useTaskStore((s) => s.tasks);
    const subjects = useSubjectStore((s) => s.subjects);

    // ─── Time calculations ───
    const calcHours = (taskList) => taskList.reduce((acc, t) => {
        if (t.start_time && t.end_time && t.status === 'done') {
            return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
        }
        return acc;
    }, 0);

    // ─── Daily hours (last 7 days) ───
    const dailyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = dayjs().subtract(i, 'day');
            const dateStr = date.format('YYYY-MM-DD');
            const dayTasks = tasks.filter((t) => t.date === dateStr && t.status === 'done');
            const hours = calcHours(dayTasks);
            days.push({ name: date.format('ddd'), hours: Math.round(hours * 10) / 10, date: dateStr });
        }
        return days;
    }, [tasks]);

    // ─── Weekly trend (last 4 weeks) ───
    const weeklyTrend = useMemo(() => {
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = dayjs().subtract(i, 'week').startOf('week').add(1, 'day');
            const weekEnd = weekStart.add(6, 'day');
            const weekTasks = tasks.filter((t) => {
                const d = dayjs(t.date);
                return d.isAfter(weekStart.subtract(1, 'day')) && d.isBefore(weekEnd.add(1, 'day')) && t.status === 'done';
            });
            const hours = calcHours(weekTasks);
            weeks.push({ name: `W${weekStart.isoWeek()}`, hours: Math.round(hours * 10) / 10 });
        }
        return weeks;
    }, [tasks]);

    // ─── Category breakdown ───
    const categoryData = useMemo(() => {
        const map = {};
        tasks.filter((t) => t.status === 'done').forEach((t) => {
            const cat = t.category || 'other';
            const hours = (t.start_time && t.end_time)
                ? dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60 : 0;
            map[cat] = (map[cat] || 0) + hours;
        });
        return Object.entries(map)
            .filter(([, h]) => h > 0)
            .map(([cat, hours]) => ({
                name: categoryLabels[cat] || cat,
                value: Math.round(hours * 10) / 10,
                fill: categoryColors[cat] || '#8b5cf6',
            }))
            .sort((a, b) => b.value - a.value);
    }, [tasks]);

    // ─── Subject hours ───
    const subjectData = useMemo(() => {
        return subjects.map((s) => {
            const hrs = calcHours(tasks.filter((t) => t.subject_id === s.id));
            return { name: s.name.slice(0, 6), hours: Math.round(hrs * 10) / 10, color: subjectChartColors[s.name.toLowerCase()] || s.color || '#8b5cf6' };
        });
    }, [tasks, subjects]);

    // ─── Study Streak ───
    const streak = useMemo(() => {
        let count = 0;
        let day = dayjs();
        while (true) {
            const dateStr = day.format('YYYY-MM-DD');
            const hasDone = tasks.some((t) => t.date === dateStr && t.status === 'done');
            if (!hasDone) break;
            count++;
            day = day.subtract(1, 'day');
        }
        return count;
    }, [tasks]);

    // ─── Aggregate stats ───
    const totalHours = Math.round(calcHours(tasks) * 10) / 10;
    const totalDone = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const todayHours = Math.round(calcHours(tasks.filter((t) => t.date === dayjs().format('YYYY-MM-DD'))) * 10) / 10;

    const tooltipStyle = { background: '#110f36', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, color: '#e2e8f0', fontFamily: 'JetBrains Mono' };

    return (
        <Stack gap={14}>
            {/* Stat cards */}
            <SimpleGrid cols={2} spacing={8}>
                <StatCard icon={IconClock} label="Total Hours" value={totalHours} sub={`${totalDone} tasks done`} color="var(--neon-cyan)" />
                <StatCard icon={IconFlame} label="Streak" value={`${streak}d`} sub="consecutive days" color="var(--neon-orange)" />
                <StatCard icon={IconTarget} label="Completion" value={totalTasks > 0 ? `${Math.round((totalDone / totalTasks) * 100)}%` : '—'} sub={`${totalDone}/${totalTasks}`} color="var(--neon-violet)" />
                <StatCard icon={IconCalendarStats} label="Today" value={`${todayHours}h`} sub={dayjs().format('ddd, MMM D')} color="var(--neon-green)" />
            </SimpleGrid>

            {/* Daily hours bar */}
            <ChartCard title="Daily Study Hours" icon={IconChartBar}>
                <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={dailyData} barCategoryGap="20%">
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="var(--neon-violet)">
                            {dailyData.map((_, i) => <Cell key={i} fill={i === 6 ? '#a78bfa' : 'rgba(139,92,246,0.5)'} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Weekly trend */}
            <ChartCard title="Weekly Trend" icon={IconTrendingUp}>
                <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={weeklyTrend}>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="hours" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} activeDot={{ r: 5, fill: '#8b5cf6' }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Subject hours */}
            {subjectData.length > 0 && (
                <ChartCard title="Hours by Subject">
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={subjectData} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>{subjectData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            {/* Category breakdown */}
            {categoryData.length > 0 && (
                <ChartCard title="Category Breakdown">
                    <Group justify="center" gap={20}>
                        <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} strokeWidth={0}>
                                    {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <Stack gap={4}>
                            {categoryData.slice(0, 5).map((c) => (
                                <Group key={c.name} gap={6}>
                                    <Box style={{ width: 8, height: 8, borderRadius: 2, background: c.fill }} />
                                    <Text size="10px" c="var(--text-secondary)" className="mono">{c.name}</Text>
                                    <Text size="10px" c="var(--text-faint)" className="mono">{c.value}h</Text>
                                </Group>
                            ))}
                        </Stack>
                    </Group>
                </ChartCard>
            )}

            {/* Subject backlogs */}
            {subjects.length > 0 && (
                <ChartCard title="Subject Backlogs">
                    <Stack gap={6}>
                        {subjects.map((s) => {
                            const overdue = tasks.filter((t) => t.subject_id === s.id && t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'));
                            const color = subjectChartColors[s.name.toLowerCase()] || s.color || '#8b5cf6';
                            return (
                                <Group key={s.id} justify="space-between" style={{ padding: '6px 8px', borderRadius: 6, background: overdue.length > 0 ? 'rgba(244,63,94,0.06)' : 'rgba(139,92,246,0.03)' }}>
                                    <Group gap={6}>
                                        <Box style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
                                        <Text size="xs" fw={500} c="var(--text-secondary)">{s.name}</Text>
                                    </Group>
                                    <Badge size="xs" color={overdue.length > 0 ? 'red' : 'green'} variant="light" radius="sm" styles={{ root: { fontFamily: 'var(--font-mono)', fontSize: 9 } }}>
                                        {overdue.length > 0 ? `${overdue.length} overdue` : '✓ clear'}
                                    </Badge>
                                </Group>
                            );
                        })}
                    </Stack>
                </ChartCard>
            )}
        </Stack>
    );
}
