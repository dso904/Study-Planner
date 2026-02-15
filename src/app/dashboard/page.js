'use client';

import { useAtomValue } from 'jotai';
import { tasksAtom, SUBJECTS } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCheck, Clock, Flame, AlertTriangle, TrendingUp, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const tooltipStyle = {
    background: '#110f36',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 10,
    fontSize: 11,
    color: '#e2e8f0',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

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
            <div className="p-5 relative">
                <div className="absolute top-4 right-4 opacity-[0.1]">
                    <Icon size={32} color={color} />
                </div>
                <p className="mono text-[9px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color }}>{label}</p>
                <p className="text-2xl font-extrabold mono text-zinc-100">{value}</p>
            </div>
        </motion.div>
    );
}

/* ─── Glowing Panel Wrapper ─── */
function GlowPanel({ title, color = '#8b5cf6', children, delay = 0, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className={`rounded-xl overflow-hidden transition-all duration-300 ${className}`}
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
            <div className="p-5">
                <p className="mono text-[10px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color }}>{title}</p>
                {children}
            </div>
        </motion.div>
    );
}

export default function DashboardPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = SUBJECTS;

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
        return { name: subject.name, hours: Math.round(hours * 10) / 10, color: subject.color };
    });

    const upcoming = tasks.filter((t) => t.status === 'pending' && (t.date === today || dayjs(t.date).isAfter(dayjs(), 'day')))
        .sort((a, b) => `${a.date}_${a.start_time}`.localeCompare(`${b.date}_${b.start_time}`)).slice(0, 8);

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={CheckCheck} label="Today" value={`${todayDone}/${todayTotal}`} color="#8b5cf6" delay={0} />
                <StatCard icon={Clock} label="Hours This Week" value={weekHours.toFixed(1)} color="#22d3ee" delay={0.05} />
                <StatCard icon={Flame} label="Streak" value="0 days" color="#fb923c" delay={0.1} />
                <StatCard icon={AlertTriangle} label="Overdue" value={backlogs.length} color={backlogs.length > 0 ? '#f472b6' : '#34d399'} delay={0.15} />
            </div>

            {/* Weekly Progress + Hours by Subject — 2 col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <GlowPanel title="Weekly Progress" color="#8b5cf6" delay={0.2}>
                    <div className="flex items-center justify-center py-4">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="7" />
                                <motion.circle
                                    cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round"
                                    initial={{ strokeDasharray: `0 264` }}
                                    animate={{ strokeDasharray: `${weekProgress * 2.64} ${264 - weekProgress * 2.64}` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.4))' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-extrabold mono neon-text">{weekProgress}%</span>
                                <span className="text-[10px] text-zinc-600 mono">{weekDone}/{weekTotal} done</span>
                            </div>
                        </div>
                    </div>
                </GlowPanel>

                <GlowPanel title="Hours by Subject" color="#22d3ee" delay={0.25}>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} barCategoryGap="20%">
                            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </GlowPanel>
            </div>

            {/* Upcoming Tasks + Subject Progress — 2 col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <GlowPanel title="Upcoming Tasks" color="#fb923c" delay={0.3}>
                    {upcoming.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-[11px] text-zinc-600 mono">No upcoming tasks</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {upcoming.map((task, idx) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 hover:scale-[1.01]"
                                    style={{
                                        background: `rgba(251,146,60,${Math.max(0.04, 0.12 - idx * 0.012)})`,
                                        border: `1px solid rgba(251,146,60,${Math.max(0.06, 0.15 - idx * 0.015)})`,
                                    }}
                                >
                                    <div className="w-1 h-5 rounded-full shrink-0" style={{ background: '#fb923c', opacity: Math.max(0.3, 1 - idx * 0.1) }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-zinc-200 truncate">{task.title}</p>
                                        <p className="text-[9px] text-zinc-600 mono">{dayjs(task.date).format('ddd D')} · {task.start_time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlowPanel>

                <GlowPanel title="Subject Progress" color="#34d399" delay={0.35}>
                    <div className="space-y-4">
                        {subjects.map((s, idx) => {
                            const st = tasks.filter((t) => t.subject_id === s.id);
                            const done = st.filter((t) => t.status === 'done').length;
                            const total = st.length;
                            const pct = total ? Math.round((done / total) * 100) : 0;
                            return (
                                <div key={s.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}50` }} />
                                            <span className="text-sm font-semibold text-zinc-200">{s.name}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 mono">{done}/{total} • {pct}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, delay: 0.4 + idx * 0.1 }}
                                            style={{ background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, boxShadow: `0 0 8px ${s.color}40` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlowPanel>
            </div>
        </div>
    );
}
