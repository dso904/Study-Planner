'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, SUBJECTS } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const chartColors = ['#8b5cf6', '#22d3ee', '#f472b6', '#fb923c', '#34d399', '#facc15', '#f43f5e'];
const tooltipStyle = {
    background: '#110f36',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 10,
    fontSize: 11,
    color: '#e2e8f0',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

function getHours(task) {
    if (!task.start_time || !task.end_time) return 0;
    return dayjs(task.end_time, 'HH:mm').diff(dayjs(task.start_time, 'HH:mm'), 'minute') / 60;
}

/* ─── Glowing Stat Card ─── */
function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
                background: `linear-gradient(145deg, ${color}0a, transparent)`,
                border: `1px solid ${color}20`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${color}50`;
                e.currentTarget.style.boxShadow = `0 0 24px ${color}15, inset 0 1px 0 ${color}15`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${color}20`;
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div className="p-4 relative">
                <div className="absolute top-3 right-3 opacity-[0.1]"><Icon size={28} color={color} /></div>
                <p className="mono text-[9px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color }}>{label}</p>
                <p className="text-xl font-extrabold mono text-zinc-100">{value}</p>
            </div>
        </motion.div>
    );
}

/* ─── Glowing Panel ─── */
function GlowPanel({ title, color = '#8b5cf6', children, delay = 0, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className={`rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.005] ${className}`}
            style={{
                background: `linear-gradient(145deg, ${color}06, transparent)`,
                border: `1px solid ${color}18`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${color}40`;
                e.currentTarget.style.boxShadow = `0 0 25px ${color}10, inset 0 1px 0 ${color}12`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${color}18`;
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div className="p-4">
                <p className="mono text-[9px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color }}>{title}</p>
                {children}
            </div>
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = SUBJECTS;

    const totalTasks = tasks.length;
    const totalDone = tasks.filter((t) => t.status === 'done').length;
    const totalHours = tasks.filter((t) => t.status === 'done').reduce((a, t) => a + getHours(t), 0);
    const completionRate = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

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

    const subjectData = useMemo(() => {
        return subjects.map((s, i) => {
            const hours = tasks.filter((t) => t.subject_id === s.id && t.status === 'done').reduce((a, t) => a + getHours(t), 0);
            return { name: s.name.slice(0, 6), hours: Math.round(hours * 10) / 10, color: s.color || chartColors[i % chartColors.length] };
        });
    }, [tasks, subjects]);

    const subjectBacklogs = useMemo(() => {
        return subjects.map((s) => {
            const backlog = tasks.filter((t) =>
                t.subject_id === s.id && t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'),
            ).length;
            return { name: s.name.slice(0, 6), backlog, color: s.color || '#8b5cf6' };
        }).filter((s) => s.backlog > 0);
    }, [tasks, subjects]);

    return (
        <div className="max-w-4xl space-y-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-1"
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: '#8b5cf612', border: '1px solid #8b5cf620', boxShadow: '0 0 16px #8b5cf610' }}
                >
                    <BarChart3 size={20} className="text-violet-400" />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">ANALYTICS</h1>
                    <p className="text-[10px] mono text-zinc-600">Performance overview & insights</p>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Target} label="Total Tasks" value={totalTasks} color="#8b5cf6" delay={0} />
                <StatCard icon={BarChart3} label="Completed" value={totalDone} color="#34d399" delay={0.05} />
                <StatCard icon={Clock} label="Total Hours" value={totalHours.toFixed(1)} color="#22d3ee" delay={0.1} />
                <StatCard icon={TrendingUp} label="Completion Rate" value={`${completionRate}%`} color="#fb923c" delay={0.15} />
            </div>

            {/* Daily Study Hours */}
            <GlowPanel title="📊 Daily Study Hours (14 days)" color="#8b5cf6" delay={0.2}>
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={dailyData} barCategoryGap="15%">
                        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                        <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </GlowPanel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Weekly Trend */}
                <GlowPanel title="📈 Weekly Trend" color="#22d3ee" delay={0.25}>
                    <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={weeklyData}>
                            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="hours" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 4, strokeWidth: 0 }}
                                style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.4))' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </GlowPanel>

                {/* Category Breakdown */}
                <GlowPanel title="🧩 Category Breakdown" color="#f472b6" delay={0.3}>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={120}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={3} dataKey="value">
                                    {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[120px]">
                            <p className="text-[11px] text-zinc-600 mono">No data yet</p>
                        </div>
                    )}
                </GlowPanel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Subject Hours */}
                <GlowPanel title="📚 Hours by Subject" color="#fb923c" delay={0.35}>
                    {subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={subjectData} barCategoryGap="20%">
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                                <Bar dataKey="hours" radius={[5, 5, 0, 0]}>{subjectData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[120px]">
                            <p className="text-[11px] text-zinc-600 mono">No data yet</p>
                        </div>
                    )}
                </GlowPanel>

                {/* Subject Backlogs */}
                <GlowPanel title="⚠️ Subject Backlogs" color="#f43f5e" delay={0.4}>
                    {subjectBacklogs.length > 0 ? (
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={subjectBacklogs} barCategoryGap="20%">
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                                <Bar dataKey="backlog" radius={[5, 5, 0, 0]}>{subjectBacklogs.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[120px]">
                            <p className="text-[11px] text-zinc-600 mono">No backlogs — great job!</p>
                        </div>
                    )}
                </GlowPanel>
            </div>
        </div>
    );
}
