'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, subjectsAtom } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';

const chartColors = ['#8b5cf6', '#22d3ee', '#f472b6', '#fb923c', '#34d399', '#facc15', '#f43f5e'];
const tooltipStyle = { background: '#110f36', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, color: '#e2e8f0', fontFamily: 'JetBrains Mono' };

function getHours(task) {
    if (!task.start_time || !task.end_time) return 0;
    return dayjs(task.end_time, 'HH:mm').diff(dayjs(task.start_time, 'HH:mm'), 'minute') / 60;
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <Card className="relative overflow-hidden p-3 bg-card border-white/6">
            <div className="absolute top-2 right-2.5 opacity-[0.12]"><Icon size={24} color={color} /></div>
            <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
            <p className="text-lg font-extrabold mono" style={{ color }}>{value}</p>
        </Card>
    );
}

export default function AnalyticsPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = useAtomValue(subjectsAtom) || [];

    // Basic stats
    const totalTasks = tasks.length;
    const totalDone = tasks.filter((t) => t.status === 'done').length;
    const totalHours = tasks.filter((t) => t.status === 'done').reduce((a, t) => a + getHours(t), 0);
    const completionRate = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

    // Daily hours (last 14 days)
    const dailyData = useMemo(() => {
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const date = dayjs().subtract(i, 'day');
            const dateStr = date.format('YYYY-MM-DD');
            const dayTasks = tasks.filter((t) => t.date === dateStr && t.status === 'done');
            const hours = dayTasks.reduce((a, t) => a + getHours(t), 0);
            days.push({ day: date.format('D'), date: date.format('ddd'), hours: Math.round(hours * 10) / 10 });
        }
        return days;
    }, [tasks]);

    // Weekly trend (last 4 weeks)
    const weeklyData = useMemo(() => {
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const start = dayjs().subtract(i, 'week').startOf('week').add(1, 'day');
            const end = start.add(6, 'day');
            const weekTasks = tasks.filter((t) => {
                const d = dayjs(t.date);
                return d.isAfter(start.subtract(1, 'day')) && d.isBefore(end.add(1, 'day')) && t.status === 'done';
            });
            const hours = weekTasks.reduce((a, t) => a + getHours(t), 0);
            weeks.push({ week: `W${start.week()}`, hours: Math.round(hours * 10) / 10, tasks: weekTasks.length });
        }
        return weeks;
    }, [tasks]);

    // Category breakdown
    const categoryData = useMemo(() => {
        const cats = {};
        tasks.filter((t) => t.status === 'done').forEach((t) => {
            const cat = t.category || 'other';
            cats[cat] = (cats[cat] || 0) + 1;
        });
        return Object.entries(cats).map(([name, value], i) => ({
            name: name.replace('_', ' '), value, fill: chartColors[i % chartColors.length],
        }));
    }, [tasks]);

    // Subject hours
    const subjectData = useMemo(() => {
        return subjects.map((s, i) => {
            const hours = tasks.filter((t) => t.subject_id === s.id && t.status === 'done').reduce((a, t) => a + getHours(t), 0);
            return { name: s.name.slice(0, 6), hours: Math.round(hours * 10) / 10, color: s.color || chartColors[i % chartColors.length] };
        });
    }, [tasks, subjects]);

    // Subject backlogs
    const subjectBacklogs = useMemo(() => {
        return subjects.map((s) => {
            const backlog = tasks.filter((t) =>
                t.subject_id === s.id && t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'),
            ).length;
            return { name: s.name.slice(0, 6), backlog, color: s.color || '#8b5cf6' };
        }).filter((s) => s.backlog > 0);
    }, [tasks, subjects]);

    return (
        <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-violet-400" />
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Analytics</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
                <StatCard icon={Target} label="Total" value={totalTasks} color="#8b5cf6" />
                <StatCard icon={BarChart3} label="Done" value={totalDone} color="#34d399" />
                <StatCard icon={Clock} label="Hours" value={totalHours.toFixed(1)} color="#22d3ee" />
                <StatCard icon={TrendingUp} label="Rate" value={`${completionRate}%`} color="#fb923c" />
            </div>

            {/* Daily Study Hours */}
            <Card className="p-3 bg-card border-white/6">
                <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Daily Study Hours (14d)</p>
                <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={dailyData} barCategoryGap="15%">
                        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                        <Bar dataKey="hours" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-2 gap-2">
                {/* Weekly Trend */}
                <Card className="p-3 bg-card border-white/6">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Weekly Trend</p>
                    <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={weeklyData}>
                            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="hours" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Category Breakdown */}
                {categoryData.length > 0 && (
                    <Card className="p-3 bg-card border-white/6">
                        <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Categories</p>
                        <ResponsiveContainer width="100%" height={100}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={3} dataKey="value">
                                    {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                )}
            </div>

            {/* Subject Hours */}
            {subjectData.length > 0 && (
                <Card className="p-3 bg-card border-white/6">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Hours by Subject</p>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={subjectData} barCategoryGap="20%">
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>{subjectData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Subject Backlogs */}
            {subjectBacklogs.length > 0 && (
                <Card className="p-3 bg-card border-white/6">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Subject Backlogs</p>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={subjectBacklogs} barCategoryGap="20%">
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="backlog" radius={[4, 4, 0, 0]}>{subjectBacklogs.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
}
