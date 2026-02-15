'use client';

import { useAtomValue } from 'jotai';
import { tasksAtom, sidebarCollapsedAtom } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Flame, CheckCheck, Clock } from 'lucide-react';

export default function StatusBar() {
    const tasks = useAtomValue(tasksAtom) || [];
    const collapsed = useAtomValue(sidebarCollapsedAtom);

    const today = dayjs().format('YYYY-MM-DD');
    const todayTasks = tasks.filter((t) => t.date === today);
    const todayDone = todayTasks.filter((t) => t.status === 'done').length;
    const todayTotal = todayTasks.length;

    const hoursToday = todayTasks
        .filter((t) => t.status === 'done')
        .reduce((acc, t) => {
            if (t.start_time && t.end_time) {
                return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
            }
            return acc;
        }, 0);

    return (
        <div
            className="no-print fixed bottom-0 right-0 h-8 flex items-center justify-between px-5 z-50 border-t border-white/8 text-xs transition-all duration-300"
            style={{
                left: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
                background: 'oklch(0.15 0.012 280)',
            }}
        >
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-400" />
                    <span className="text-zinc-500">Streak: <span className="font-semibold text-orange-400 mono">0 days</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCheck size={14} className="text-violet-400" />
                    <span className="text-zinc-500">Today: <span className="font-semibold text-violet-400 mono">{todayDone}/{todayTotal}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-teal-400" />
                    <span className="text-zinc-500">Hours: <span className="font-semibold text-teal-400 mono">{hoursToday.toFixed(1)}h</span></span>
                </div>
            </div>
            <span className="text-zinc-500">{dayjs().format('dddd, MMMM D, YYYY')}</span>
        </div>
    );
}
