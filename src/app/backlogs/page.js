'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, subjectsAtom, useTaskActions } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCheck, X, CalendarClock, Trash2 } from 'lucide-react';

export default function BacklogsPage() {
    const tasks = useAtomValue(tasksAtom) || [];
    const subjects = useAtomValue(subjectsAtom) || [];
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
        const ids = [...selected];
        ids.forEach((id) => {
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
        return s?.color || '#8b5cf6';
    };

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-400" />
                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Backlogs</h2>
                    <Badge variant="outline" className="mono text-[9px] border-white/10 text-zinc-500">{backlogs.length}</Badge>
                </div>
            </div>

            {/* Bulk Actions */}
            {selected.size > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-violet-500/6 border border-violet-500/15">
                    <span className="text-[10px] mono text-violet-300 font-semibold">{selected.size} selected</span>
                    <div className="flex-1" />
                    <Button size="sm" className="h-6 text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25" onClick={() => bulkAction('done')}>
                        <CheckCheck size={11} className="mr-1" /> Done
                    </Button>
                    <Button size="sm" className="h-6 text-[10px] bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25" onClick={() => bulkAction('today')}>
                        <CalendarClock size={11} className="mr-1" /> Today
                    </Button>
                    <Button size="sm" className="h-6 text-[10px] bg-orange-500/15 text-orange-400 hover:bg-orange-500/25" onClick={() => bulkAction('tomorrow')}>
                        Tomorrow
                    </Button>
                    <Button size="sm" className="h-6 text-[10px] bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25" onClick={() => bulkAction('dismiss')}>
                        <X size={11} className="mr-1" /> Skip
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-400 hover:text-red-300" onClick={() => bulkAction('delete')}>
                        <Trash2 size={11} />
                    </Button>
                </div>
            )}

            {backlogs.length === 0 ? (
                <Card className="p-8 text-center bg-card border-white/6">
                    <CheckCheck size={32} className="text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-zinc-200">All caught up!</p>
                    <p className="text-xs text-zinc-600 mt-1">No overdue tasks.</p>
                </Card>
            ) : (
                <div className="space-y-1.5">
                    <button onClick={toggleAll} className="text-[10px] mono text-zinc-600 hover:text-zinc-400 transition-colors mb-1">
                        {selected.size === backlogs.length ? 'Deselect all' : 'Select all'}
                    </button>

                    {backlogs.map((task) => {
                        const color = getSubjectColor(task.subject_id);
                        const daysOverdue = dayjs().diff(dayjs(task.date), 'day');
                        return (
                            <Card key={task.id} className={`bg-card border-white/6 p-2.5 px-3 flex items-center gap-2.5 transition-colors ${selected.has(task.id) ? 'bg-violet-500/8 border-violet-500/20' : ''}`}>
                                <Checkbox
                                    checked={selected.has(task.id)}
                                    onCheckedChange={() => toggleSelect(task.id)}
                                    className="border-white/20"
                                />
                                <div className="w-1.5 h-5 rounded-sm" style={{ background: color, boxShadow: `0 0 6px ${color}40` }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-200 truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] text-zinc-600 mono">{dayjs(task.date).format('MMM D')}</span>
                                        {task.subject_name && <span className="text-[9px] mono" style={{ color }}>{task.subject_name}</span>}
                                        <Badge variant="outline" className="mono text-[8px] border-white/8 text-zinc-600 px-1 py-0">
                                            {task.category}
                                        </Badge>
                                    </div>
                                </div>
                                <Badge variant="outline" className="mono text-[9px] border-red-500/20 text-red-400 whitespace-nowrap">
                                    {daysOverdue}d ago
                                </Badge>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
