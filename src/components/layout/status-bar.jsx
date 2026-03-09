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
                // M5-FIX: Clamp to 0 in case end_time < start_time
                return acc + Math.max(0, dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60);
            }
            return acc;
        }, 0);

    // M8-FIX: Pre-index dates with completed tasks into a Set for O(1) lookups (was O(n²))
    const streak = (() => {
        const doneDates = new Set();
        for (const t of tasks) {
            if (t.status === 'done' && t.date) doneDates.add(t.date);
        }
        let count = 0;
        let checkDate = dayjs();
        // If no tasks done today yet, start checking from yesterday
        if (!doneDates.has(today)) checkDate = checkDate.subtract(1, 'day');
        while (true) {
            const dateStr = checkDate.format('YYYY-MM-DD');
            if (!doneDates.has(dateStr)) break;
            count++;
            checkDate = checkDate.subtract(1, 'day');
        }
        return count;
    })();

    return (
        <div
            className="status-bar no-print fixed bottom-0 right-0 h-8 flex items-center justify-between px-5 z-50 border-t border-white/8 text-xs transition-[left] duration-300"
            style={{
                left: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
                background: 'rgba(24,22,55,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
        >
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-400" />
                    <span className="text-zinc-400">Streak: <span className="font-semibold text-orange-400 mono">{streak} day{streak !== 1 ? 's' : ''}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCheck size={14} className="text-rose-400" />
                    <span className="text-zinc-400">Today: <span className="font-semibold text-rose-400 mono">{todayDone}/{todayTotal}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-teal-400" />
                    <span className="text-zinc-400">Hours: <span className="font-semibold text-teal-400 mono">{hoursToday.toFixed(1)}h</span></span>
                </div>
            </div>
            <span className="text-zinc-400">{dayjs().format('dddd, MMMM D, YYYY')}</span>
        </div>
    );
}
