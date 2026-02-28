'use client';

import { useState, useRef, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, chaptersAtom, SUBJECTS, useWeekNavigation } from '@/lib/atoms';
import { getWeekDays, getTimeSlots, formatTime, dayjs } from '@/lib/dates';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CalendarDays, CheckCircle, Clock, AlertCircle, SkipForward, CircleDot } from 'lucide-react';

const statusConfig = {
    done: { label: '✅ Completed', color: '#34d399', icon: CheckCircle },
    skipped: { label: '⏭️ Skipped', color: '#64748b', icon: SkipForward },
};

const priorityDot = {
    critical: '#f43f5e',
    high: '#fb923c',
    medium: '#facc15',
    low: '#34d399',
};

export default function PrintModal({ open, onClose }) {
    const tasks = useAtomValue(tasksAtom) || [];
    const allChapters = useAtomValue(chaptersAtom) || [];
    const subjects = SUBJECTS;
    const { currentWeekStart } = useWeekNavigation();
    const printRef = useRef(null);

    const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    const dayTasks = useMemo(() => {
        return tasks
            .filter((t) => t.date === selectedDate && t.start_time)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [tasks, selectedDate]);

    const selectedDayInfo = weekDays.find((d) => d.date === selectedDate) || {
        dayName: dayjs(selectedDate).format('ddd'),
        dayNumber: dayjs(selectedDate).format('D'),
        monthName: dayjs(selectedDate).format('MMM'),
    };

    const getSubjectColor = (subjectId) => {
        const s = subjects.find((x) => x.id === subjectId);
        return s?.color || '#8b5cf6';
    };

    const getSubjectName = (subjectId) => {
        const s = subjects.find((x) => x.id === subjectId);
        return s?.name || '';
    };

    const getChapterName = (chapterId) => {
        if (!chapterId) return '';
        const ch = allChapters.find((c) => c.id === chapterId);
        return ch?.name || '';
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Day Planner — ${dayjs(selectedDate).format('dddd, MMMM D, YYYY')}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', system-ui, sans-serif;
            color: #1a1a2e;
            padding: 32px;
            background: white;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 3px solid #8b5cf6;
        }
        .header-left h1 {
            font-size: 24px;
            font-weight: 800;
            color: #1a1a2e;
            letter-spacing: -0.02em;
        }
        .header-left p {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
        }
        .header-right {
            text-align: right;
        }
        .header-right .day-name {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #8b5cf6;
        }
        .header-right .day-number {
            font-size: 36px;
            font-weight: 800;
            color: #1a1a2e;
            line-height: 1;
        }
        .header-right .month-name {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #6b7280;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            padding: 10px 16px;
            background: #f8f7ff;
            border-radius: 8px;
            border: 1px solid #e9e5f5;
        }
        .stat {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #6b7280;
        }
        .stat strong {
            color: #1a1a2e;
            font-weight: 700;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        thead th {
            padding: 10px 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #6b7280;
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            text-align: left;
        }
        tbody tr {
            border-bottom: 1px solid #f3f4f6;
        }
        tbody tr:last-child {
            border-bottom: none;
        }
        tbody tr:nth-child(even) {
            background: #fafafa;
        }
        td {
            padding: 10px 14px;
            vertical-align: top;
        }
        .time-cell {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            color: #374151;
            white-space: nowrap;
            width: 120px;
        }
        .task-title {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 2px;
        }
        .task-meta {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: #9ca3af;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .subject-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 2px;
            margin-right: 4px;
            vertical-align: middle;
        }
        .category-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 6px;
            border-radius: 4px;
            background: #f3f4f6;
            color: #6b7280;
        }
        .status-cell {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
        }
        .priority-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
        }
        .notes-cell {
            font-size: 11px;
            color: #6b7280;
            max-width: 160px;
        }
        .checkbox-col {
            width: 28px;
            text-align: center;
        }
        .checkbox {
            width: 16px;
            height: 16px;
            border: 2px solid #d1d5db;
            border-radius: 3px;
            display: inline-block;
        }
        .checkbox.checked {
            background: #8b5cf6;
            border-color: #8b5cf6;
            position: relative;
        }
        .checkbox.checked::after {
            content: '✓';
            color: white;
            font-size: 11px;
            font-weight: bold;
            position: absolute;
            left: 2px;
            top: -1px;
        }
        .empty-msg {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            font-size: 14px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            color: #d1d5db;
            display: flex;
            justify-content: space-between;
        }
        @media print {
            body { padding: 20px; }
            .stats { background: #f8f7ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            thead th { background: #f9fafb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tbody tr:nth-child(even) { background: #fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .subject-dot, .priority-dot, .checkbox.checked { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    ${printContent.innerHTML}
</body>
</html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            // L2-FIX: Close the print window after the user finishes/cancels the print dialog
            printWindow.onafterprint = () => printWindow.close();
            // Fallback: close after 60s in case onafterprint doesn't fire in some browsers
            setTimeout(() => {
                try { if (!printWindow.closed) printWindow.close(); } catch (e) { /* already closed */ }
            }, 60000);
        }, 500);
    };

    const totalTasks = dayTasks.length;
    const doneTasks = dayTasks.filter((t) => t.status === 'done').length;
    const totalHours = dayTasks.reduce((acc, t) => {
        if (t.start_time && t.end_time) return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
        return acc;
    }, 0);

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer size={18} className="text-rose-400" />
                        <span className="neon-text font-extrabold text-lg">PRINT ROUTINE</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Day Selector */}
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/4 border border-white/8">
                    {weekDays.map((day) => (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDate(day.date)}
                            className={`
                                flex-1 flex flex-col items-center py-2 rounded-md transition-all text-center
                                ${selectedDate === day.date
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'text-zinc-400 hover:bg-white/4 hover:text-zinc-300 border border-transparent'}
                                ${day.isToday ? 'ring-1 ring-rose-500/20' : ''}
                            `}
                        >
                            <span className="mono text-[8px] font-semibold uppercase tracking-wider">{day.dayName}</span>
                            <span className={`text-sm font-bold ${day.isToday && selectedDate === day.date ? 'neon-text' : ''}`}>{day.dayNumber}</span>
                            <span className="mono text-[8px] text-zinc-500">{day.monthName}</span>
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 px-3 py-2 rounded-md bg-white/3">
                    <span className="text-[10px] mono text-zinc-400">Tasks: <strong className="text-zinc-200">{totalTasks}</strong></span>
                    <span className="text-[10px] mono text-zinc-400">Done: <strong className="text-green-400">{doneTasks}</strong></span>
                    <span className="text-[10px] mono text-zinc-400">Hours: <strong className="text-cyan-400">{totalHours.toFixed(1)}</strong></span>
                </div>

                {/* Preview */}
                <div className="max-h-[40vh] overflow-auto rounded-lg bg-white/[0.02] border border-white/6 p-1">
                    {/* Hidden container for print HTML */}
                    <div ref={printRef} style={{ display: 'none' }}>
                        <div className="header">
                            <div className="header-left">
                                <h1>Day Planner</h1>
                                <p>{dayjs(selectedDate).format('dddd, MMMM D, YYYY')}</p>
                            </div>
                            <div className="header-right">
                                <div className="day-name">{selectedDayInfo.dayName}</div>
                                <div className="day-number">{selectedDayInfo.dayNumber}</div>
                                <div className="month-name">{selectedDayInfo.monthName}</div>
                            </div>
                        </div>

                        <div className="stats">
                            <span className="stat">Tasks: <strong>{totalTasks}</strong></span>
                            <span className="stat">Done: <strong>{doneTasks}</strong></span>
                            <span className="stat">Planned: <strong>{totalHours.toFixed(1)}h</strong></span>
                        </div>

                        {dayTasks.length === 0 ? (
                            <div className="empty-msg">No tasks scheduled for this day</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th className="checkbox-col">✓</th>
                                        <th>Time</th>
                                        <th>Task</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayTasks.map((task) => {
                                        const sc = statusConfig[task.status] || { label: '⏳ Upcoming', color: '#fb923c', icon: Clock };
                                        const subColor = getSubjectColor(task.subject_id);
                                        const subName = getSubjectName(task.subject_id) || task.subject_name || '—';
                                        return (
                                            <tr key={task.id}>
                                                <td className="checkbox-col">
                                                    <span className={`checkbox ${task.status === 'done' ? 'checked' : ''}`} />
                                                </td>
                                                <td className="time-cell">
                                                    {formatTime(task.start_time)}<br />
                                                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>— {formatTime(task.end_time)}</span>
                                                </td>
                                                <td>
                                                    <div className="task-title">{task.title}</div>
                                                    {getChapterName(task.chapter_id) && <div className="task-meta" style={{ marginBottom: '2px' }}><span>📑 {getChapterName(task.chapter_id)}</span></div>}
                                                    <div className="task-meta">
                                                        <span className="priority-dot" style={{ background: priorityDot[task.priority] || '#facc15' }} />
                                                        <span>{task.priority}</span>
                                                        <span className="category-badge">{task.category?.replaceAll('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="subject-dot" style={{ background: subColor }} />
                                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{subName}</span>
                                                </td>
                                                <td className="status-cell" style={{ color: sc.color }}>
                                                    {sc.label}
                                                </td>
                                                <td className="notes-cell">
                                                    {task.notes || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        <div className="footer">
                            <span>Day Planner — Command Center</span>
                            <span>Printed {dayjs().format('MMM D, YYYY [at] h:mm A')}</span>
                        </div>
                    </div>

                    {/* Visual preview inside dialog */}
                    {dayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <CalendarDays size={28} className="text-zinc-500 mb-2" />
                            <p className="text-xs text-zinc-400">No tasks scheduled for {dayjs(selectedDate).format('dddd, MMM D')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-[9px] mono uppercase tracking-wider text-zinc-500 border-b border-white/8">
                                    <th className="py-2 px-2 text-left w-8">✓</th>
                                    <th className="py-2 px-2 text-left">Time</th>
                                    <th className="py-2 px-2 text-left">Task</th>
                                    <th className="py-2 px-2 text-left">Subject</th>
                                    <th className="py-2 px-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayTasks.map((task) => {
                                    const sc = statusConfig[task.status] || { label: '⏳ Upcoming', color: '#fb923c', icon: Clock };
                                    const subColor = getSubjectColor(task.subject_id);
                                    const subName = getSubjectName(task.subject_id) || task.subject_name || '—';
                                    return (
                                        <tr key={task.id} className="border-b border-white/4 hover:bg-white/3">
                                            <td className="py-1.5 px-2">
                                                <div className={`w-3.5 h-3.5 rounded-sm border-2 ${task.status === 'done' ? 'bg-rose-500 border-rose-500' : 'border-zinc-600'}`}>
                                                    {task.status === 'done' && <span className="text-white text-[8px] flex items-center justify-center">✓</span>}
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-2 mono text-zinc-400 whitespace-nowrap">
                                                {formatTime(task.start_time)} – {formatTime(task.end_time)}
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <span className={`font-medium ${task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</span>
                                                {getChapterName(task.chapter_id) && <div className="text-[8px] mono font-bold text-zinc-400 mt-0.5">📑 {getChapterName(task.chapter_id)}</div>}
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="w-1 h-1 rounded-full" style={{ background: priorityDot[task.priority] || '#facc15' }} />
                                                    <span className="text-[8px] mono text-zinc-500">{task.category?.replaceAll('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-sm" style={{ background: subColor }} />
                                                    <span className="text-zinc-400">{subName}</span>
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <Badge variant="outline" className="mono text-[8px] border-white/8 px-1.5 py-0" style={{ color: sc.color }}>
                                                    {task.status?.replaceAll('_', ' ').toUpperCase()}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-end gap-3 mt-2">
                    <button type="button" onClick={onClose} className="futuristic-btn futuristic-btn-ghost">
                        Cancel
                    </button>
                    <button type="button" onClick={handlePrint} disabled={dayTasks.length === 0} className="futuristic-btn">
                        <Printer size={14} />
                        Print
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
