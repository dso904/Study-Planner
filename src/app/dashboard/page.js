'use client';

import { useAtomValue } from 'jotai';
import { tasksAtom, subjectsAtom } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCheck, Clock, Flame, AlertTriangle } from 'lucide-react';

const subjectChartColors = {
    physics: '#22d3ee', chemistry: '#f472b6', maths: '#fb923c', biology: '#34d399',
};

function MiniStat({ icon: Icon, label, value, color }) {
    return (
        <Card className="relative overflow-hidden p-3 bg-card border-white/6">
            <div className="absolute top-2 right-2.5 opacity-[0.12]">
                <Icon size={28} color={color} />
            </div>
            <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
            <p className="text-xl font-extrabold mono" style={{ color }}>{value}</p>
        </Card>
    );
}

export default function DashboardPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = useAtomValue(subjectsAtom) || [];

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

    const tooltipStyle = { background: '#110f36', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, color: '#e2e8f0', fontFamily: 'JetBrains Mono' };

    return (
        <div className="space-y-4 max-w-3xl">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
                <MiniStat icon={CheckCheck} label="Today" value={`${todayDone}/${todayTotal}`} color="#8b5cf6" />
                <MiniStat icon={Clock} label="Hours" value={`${weekHours.toFixed(1)}`} color="#22d3ee" />
                <MiniStat icon={Flame} label="Streak" value="0" color="#fb923c" />
                <MiniStat icon={AlertTriangle} label="Overdue" value={backlogs.length} color={backlogs.length > 0 ? '#f472b6' : '#34d399'} />
            </div>

            {/* Week Ring Progress */}
            <Card className="p-4 text-center bg-card border-white/6">
                <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Weekly Progress</p>
                <div className="flex justify-center">
                    <div className="relative w-28 h-28">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${weekProgress * 2.64} ${264 - weekProgress * 2.64}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-extrabold mono neon-text">{weekProgress}%</span>
                            <span className="text-[9px] text-zinc-600 mono">{weekDone}/{weekTotal}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card className="p-3 bg-card border-white/6">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Hours by Subject</p>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={chartData} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Upcoming */}
            <Card className="p-3 bg-card border-white/6">
                <div className="flex items-center justify-between mb-2">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Upcoming</p>
                    <Badge variant="outline" className="mono text-[9px] border-white/10 text-zinc-600">{upcoming.length}</Badge>
                </div>
                {upcoming.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-2">No upcoming tasks</p>
                ) : (
                    <div className="space-y-1">
                        {upcoming.map((task) => (
                            <div key={task.id} className="p-1.5 px-2.5 rounded-md bg-violet-500/4 border border-white/6">
                                <p className="text-xs font-medium text-zinc-200 truncate">{task.title}</p>
                                <p className="text-[9px] text-zinc-600 mono">{dayjs(task.date).format('ddd D')} · {task.start_time}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Subject Progress */}
            {subjects.length > 0 && (
                <Card className="p-3 bg-card border-white/6">
                    <p className="mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">Subject Progress</p>
                    <div className="space-y-2">
                        {subjects.map((s) => {
                            const st = tasks.filter((t) => t.subject_id === s.id);
                            const done = st.filter((t) => t.status === 'done').length;
                            const total = st.length;
                            const pct = total ? Math.round((done / total) * 100) : 0;
                            const color = subjectChartColors[s.name.toLowerCase()] || '#8b5cf6';
                            return (
                                <div key={s.id}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-sm" style={{ background: color, boxShadow: `0 0 6px ${color}40` }} />
                                            <span className="text-xs font-medium text-zinc-400">{s.name}</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-600 mono">{done}/{total}</span>
                                    </div>
                                    <Progress value={pct} className="h-1" style={{ '--tw-progress-color': color }} />
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}
