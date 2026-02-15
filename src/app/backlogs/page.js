'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, SUBJECTS, useTaskActions } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCheck, X, CalendarClock, Trash2 } from 'lucide-react';

const subjectColors = {
    physics: '#22d3ee', chemistry: '#f472b6', maths: '#fb923c', biology: '#34d399',
};

export default function BacklogsPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = SUBJECTS;
    const { updateTask, deleteTask } = useTaskActions();
    const [selected, setSelected] = useState(new Set());

    const backlogs = useMemo(() => {
        return tasks
            .filter((t) => t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'))
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [tasks]);

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === backlogs.length) setSelected(new Set());
        else setSelected(new Set(backlogs.map((t) => t.id)));
    };

    const bulkAction = (action) => {
        [...selected].forEach((id) => {
            switch (action) {
                case 'done': updateTask(id, { status: 'done' }); break;
                case 'dismiss': updateTask(id, { status: 'skipped' }); break;
                case 'today': updateTask(id, { date: dayjs().format('YYYY-MM-DD') }); break;
                case 'tomorrow': updateTask(id, { date: dayjs().add(1, 'day').format('YYYY-MM-DD') }); break;
                case 'delete': deleteTask(id); break;
            }
        });
        setSelected(new Set());
    };

    const getSubjectColor = (subjectId) => {
        const s = subjects.find((x) => x.id === subjectId);
        return subjectColors[s?.name?.toLowerCase()] || s?.color || '#8b5cf6';
    };

    /* ─── Action Button ─── */
    const ActionBtn = ({ icon: Icon, label, color, onClick }) => (
        <button
            onClick={onClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold mono tracking-wider transition-all duration-200 hover:scale-105"
            style={{
                color,
                background: `${color}12`,
                border: `1px solid ${color}25`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.boxShadow = `0 0 12px ${color}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {Icon && <Icon size={12} />}
            {label}
        </button>
    );

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-4"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: '#fb923c12', border: '1px solid #fb923c20', boxShadow: '0 0 16px #fb923c10' }}
                    >
                        <AlertTriangle size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-zinc-100 tracking-tight">BACKLOGS</h1>
                        <p className="text-[10px] mono text-zinc-600">{backlogs.length} overdue task{backlogs.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </motion.div>

            {/* Bulk Actions Bar */}
            {selected.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mb-3 p-3 rounded-xl"
                    style={{
                        background: 'linear-gradient(145deg, rgba(139,92,246,0.06), transparent)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        boxShadow: '0 0 20px rgba(139,92,246,0.08)',
                    }}
                >
                    <span className="text-[10px] mono font-bold text-violet-300">{selected.size} SELECTED</span>
                    <div className="flex-1" />
                    <ActionBtn icon={CheckCheck} label="DONE" color="#34d399" onClick={() => bulkAction('done')} />
                    <ActionBtn icon={CalendarClock} label="TODAY" color="#22d3ee" onClick={() => bulkAction('today')} />
                    <ActionBtn label="TOMORROW" color="#fb923c" onClick={() => bulkAction('tomorrow')} />
                    <ActionBtn icon={X} label="SKIP" color="#64748b" onClick={() => bulkAction('dismiss')} />
                    <ActionBtn icon={Trash2} color="#f43f5e" onClick={() => bulkAction('delete')} />
                </motion.div>
            )}

            {backlogs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-12 text-center"
                    style={{
                        background: 'linear-gradient(145deg, rgba(52,211,153,0.06), transparent)',
                        border: '1px solid rgba(52,211,153,0.18)',
                    }}
                >
                    <CheckCheck size={36} className="text-green-400 mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))' }} />
                    <p className="text-lg font-extrabold text-zinc-100">All caught up!</p>
                    <p className="text-xs text-zinc-600 mt-1 mono">No overdue tasks to worry about.</p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    <button onClick={toggleAll} className="text-[9px] mono font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider">
                        {selected.size === backlogs.length ? '✕ Deselect all' : '☐ Select all'}
                    </button>

                    {backlogs.map((task, idx) => {
                        const color = getSubjectColor(task.subject_id);
                        const daysOverdue = dayjs().diff(dayjs(task.date), 'day');
                        const isSelected = selected.has(task.id);
                        const urgency = daysOverdue > 7 ? '#f43f5e' : daysOverdue > 3 ? '#fb923c' : '#facc15';

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25, delay: idx * 0.03 }}
                                className="group flex items-center gap-3 p-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.005] cursor-pointer"
                                style={{
                                    background: isSelected
                                        ? `linear-gradient(145deg, ${color}12, ${color}06)`
                                        : `linear-gradient(145deg, ${color}06, transparent)`,
                                    border: `1px solid ${isSelected ? `${color}40` : `${color}15`}`,
                                    boxShadow: isSelected ? `0 0 16px ${color}12` : 'none',
                                }}
                                onClick={() => toggleSelect(task.id)}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.border = `1px solid ${color}35`;
                                        e.currentTarget.style.boxShadow = `0 0 16px ${color}08`;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.border = `1px solid ${color}15`;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(task.id)}
                                    className="border-white/20"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <div className="w-1 h-6 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}40` }} />

                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-zinc-200 truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] text-zinc-600 mono">{dayjs(task.date).format('MMM D')}</span>
                                        {task.subject_name && <span className="text-[9px] mono font-semibold" style={{ color }}>{task.subject_name}</span>}
                                        <Badge
                                            variant="outline"
                                            className="mono text-[8px] px-1.5 py-0 border-white/8 text-zinc-600"
                                        >
                                            {task.category?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <Badge
                                    variant="outline"
                                    className="mono text-[9px] px-2 py-0.5 whitespace-nowrap font-bold"
                                    style={{ color: urgency, borderColor: `${urgency}30` }}
                                >
                                    {daysOverdue}d overdue
                                </Badge>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
