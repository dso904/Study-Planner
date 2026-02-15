'use client';

import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { subjectsAtom, useTaskActions } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

const categories = [
    { value: 'lecture', label: '📺 Lecture' },
    { value: 'theory', label: '📖 Theory' },
    { value: 'revision', label: '🔁 Revision' },
    { value: 'practice', label: '✏️ Practice' },
    { value: 'test', label: '📝 Test / Mock' },
    { value: 'assignment', label: '📋 Assignment' },
    { value: 'self_study', label: '🧠 Self-Study' },
    { value: 'school', label: '🏫 School' },
    { value: 'tuition', label: '🎓 Tuition' },
    { value: 'other', label: '⚡ Other' },
];

const priorities = [
    { value: 'critical', label: '🔴 Critical' },
    { value: 'high', label: '🟠 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
];

const statuses = [
    { value: 'pending', label: '⏳ Pending' },
    { value: 'in_progress', label: '🔄 In Progress' },
    { value: 'done', label: '✅ Done' },
    { value: 'skipped', label: '⏭️ Skipped' },
    { value: 'missed', label: '🔴 Missed' },
];

const initialForm = {
    title: '', subject_id: '', subject_name: '', chapter_id: '',
    category: 'lecture', priority: 'medium', status: 'pending',
    date: '', start_time: '', end_time: '', notes: '',
};

export default function TaskModal({ open, onClose, task, defaultDate, defaultTime }) {
    const subjects = useAtomValue(subjectsAtom) || [];
    const { addTask, updateTask, deleteTask } = useTaskActions();
    const [form, setForm] = useState(initialForm);
    const isEditing = !!task;

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || '', subject_id: task.subject_id || '', subject_name: task.subject_name || '',
                chapter_id: task.chapter_id || '', category: task.category || 'lecture', priority: task.priority || 'medium',
                status: task.status || 'pending', date: task.date || '', start_time: task.start_time || '',
                end_time: task.end_time || '', notes: task.notes || '',
            });
        } else {
            setForm({
                ...initialForm,
                date: defaultDate || dayjs().format('YYYY-MM-DD'),
                start_time: defaultTime || '09:00',
                end_time: defaultTime ? dayjs(defaultTime, 'HH:mm').add(1, 'hour').format('HH:mm') : '10:00',
            });
        }
    }, [task, defaultDate, defaultTime, open]);

    const updateField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const handleSubjectChange = (id) => {
        const s = subjects.find((x) => x.id === id);
        setForm((p) => ({ ...p, subject_id: id, subject_name: s?.name || '' }));
    };

    const handleSave = () => {
        if (!form.title.trim()) return;
        if (isEditing) {
            updateTask(task.id, { ...form });
        } else {
            addTask({
                id: crypto.randomUUID(), ...form, is_backlog: false, original_date: null,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            });
        }
        onClose();
    };

    const handleDelete = () => { if (task) { deleteTask(task.id); onClose(); } };

    const statusColor = form.status === 'done' ? 'text-green-400' : form.status === 'missed' ? 'text-red-400' : form.status === 'in_progress' ? 'text-cyan-400' : 'text-zinc-400';

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="neon-text font-extrabold text-lg">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</span>
                        {isEditing && (
                            <Badge variant="outline" className={`mono text-[10px] tracking-wider border-white/10 ${statusColor}`}>
                                {form.status.toUpperCase().replace('_', ' ')}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Task</Label>
                        <Input
                            placeholder="e.g., Kinematics — HCV Ch.4"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            autoFocus
                            className="bg-white/5 border-white/10 focus:border-violet-500/40 mt-1"
                        />
                    </div>

                    {/* Date + Times */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Date</Label>
                            <Input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Start</Label>
                            <Input type="time" value={form.start_time} onChange={(e) => updateField('start_time', e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">End</Label>
                            <Input type="time" value={form.end_time} onChange={(e) => updateField('end_time', e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                        </div>
                    </div>

                    {/* Subject + Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Subject</Label>
                            <select
                                value={form.subject_id}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
                            >
                                <option value="">Select subject</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Category</Label>
                            <select
                                value={form.category}
                                onChange={(e) => updateField('category', e.target.value)}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
                            >
                                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Priority + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Priority</Label>
                            <select
                                value={form.priority}
                                onChange={(e) => updateField('priority', e.target.value)}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
                            >
                                {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Status</Label>
                            <select
                                value={form.status}
                                onChange={(e) => updateField('status', e.target.value)}
                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
                            >
                                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Notes</Label>
                        <Textarea
                            placeholder="Additional details..."
                            value={form.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                            rows={2}
                            className="bg-white/5 border-white/10 mt-1"
                        />
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between mt-4">
                    <div>
                        {isEditing && (
                            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!form.title.trim()}
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold tracking-wide hover:from-indigo-600 hover:to-violet-600"
                        >
                            {isEditing ? 'SAVE' : 'CREATE'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
