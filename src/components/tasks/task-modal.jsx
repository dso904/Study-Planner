'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { SUBJECTS, chaptersAtom, useTaskActions } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Time Spinner Component ─── */
function TimeSpinner({ value, onChange, label }) {
    const [hours, minutes] = (value || '00:00').split(':').map(Number);

    const update = (h, m) => {
        onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };

    const incHour = () => update((hours + 1) % 24, minutes);
    const decHour = () => update((hours - 1 + 24) % 24, minutes);
    const incMin = () => update(hours, (minutes + 5) % 60);
    const decMin = () => update(hours, (minutes - 5 + 60) % 60);

    const handleWheel = (e, type) => {
        e.preventDefault();
        if (type === 'hour') {
            e.deltaY < 0 ? incHour() : decHour();
        } else {
            e.deltaY < 0 ? incMin() : decMin();
        }
    };

    return (
        <div>
            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">{label}</Label>
            <div className="flex items-center gap-1 mt-1 rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Hours */}
                <div className="flex flex-col items-center" onWheel={(e) => handleWheel(e, 'hour')}>
                    <button type="button" onClick={incHour} className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5">
                        <ChevronUp size={14} />
                    </button>
                    <span className="text-sm font-semibold text-zinc-200 mono w-6 text-center select-none">
                        {String(hours).padStart(2, '0')}
                    </span>
                    <button type="button" onClick={decHour} className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5">
                        <ChevronDown size={14} />
                    </button>
                </div>

                <span className="text-zinc-500 font-bold text-sm select-none">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center" onWheel={(e) => handleWheel(e, 'minute')}>
                    <button type="button" onClick={incMin} className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5">
                        <ChevronUp size={14} />
                    </button>
                    <span className="text-sm font-semibold text-zinc-200 mono w-6 text-center select-none">
                        {String(minutes).padStart(2, '0')}
                    </span>
                    <button type="button" onClick={decMin} className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5">
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* AM/PM label */}
                <span className="text-[9px] font-semibold text-zinc-500 mono ml-1 select-none">
                    {hours < 12 ? 'AM' : 'PM'}
                </span>
            </div>
        </div>
    );
}

const categories = [
    { value: 'lecture', label: 'Lecture', emoji: '📺', color: '#8b5cf6' },
    { value: 'theory', label: 'Theory', emoji: '📖', color: '#22d3ee' },
    { value: 'revision', label: 'Revision', emoji: '🔁', color: '#fb923c' },
    { value: 'practice', label: 'Practice', emoji: '✏️', color: '#34d399' },
    { value: 'test', label: 'Test / Mock', emoji: '📝', color: '#f472b6' },
    { value: 'assignment', label: 'Assignment', emoji: '📋', color: '#a78bfa' },
    { value: 'self_study', label: 'Self-Study', emoji: '🧠', color: '#facc15' },
    { value: 'school', label: 'School', emoji: '🏫', color: '#64748b' },
    { value: 'tuition', label: 'Tuition', emoji: '🎓', color: '#f43f5e' },
    { value: 'other', label: 'Other', emoji: '⚡', color: '#94a3b8' },
];

const priorities = [
    { value: 'critical', label: 'Critical', emoji: '🔴', color: '#f43f5e' },
    { value: 'high', label: 'High', emoji: '🟠', color: '#fb923c' },
    { value: 'medium', label: 'Medium', emoji: '🟡', color: '#facc15' },
    { value: 'low', label: 'Low', emoji: '🟢', color: '#34d399' },
];

const statuses = [
    { value: 'pending', label: 'Pending', emoji: '⏳', color: '#fb923c' },
    { value: 'in_progress', label: 'In Progress', emoji: '🔄', color: '#22d3ee' },
    { value: 'done', label: 'Done', emoji: '✅', color: '#34d399' },
    { value: 'skipped', label: 'Skipped', emoji: '⏭️', color: '#64748b' },
    { value: 'missed', label: 'Missed', emoji: '🔴', color: '#f43f5e' },
];

/* ─── Reusable Modular Dropdown ─── */
function ModularSelect({ value, onChange, options, placeholder, label, accentColor = '#8b5cf6' }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const current = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const displayColor = current?.color || '#64748b';

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200"
                style={{
                    background: current ? `${displayColor}08` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${current ? `${displayColor}25` : 'rgba(255,255,255,0.1)'}`,
                    color: current ? displayColor : '#71717a',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${displayColor}50`;
                    e.currentTarget.style.boxShadow = `0 0 12px ${displayColor}12`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = current ? `${displayColor}25` : 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {current?.emoji && <span className="text-sm">{current.emoji}</span>}
                <span className="flex-1 text-left font-medium truncate">
                    {current ? current.label : placeholder}
                </span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: '#64748b' }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 top-full mt-1 p-1.5 rounded-xl max-h-[200px] overflow-auto custom-scrollbar"
                        style={{
                            zIndex: 9999,
                            background: 'rgba(15,14,42,0.98)',
                            border: `1px solid ${accentColor}30`,
                            boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 20px ${accentColor}08`,
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        {label && (
                            <p className="px-2 py-1 text-[8px] mono font-bold uppercase tracking-widest text-zinc-600 mb-0.5">
                                {label}
                            </p>
                        )}
                        {options.map((opt) => {
                            const isActive = opt.value === value;
                            const c = opt.color || accentColor;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150"
                                    style={{
                                        background: isActive ? `${c}12` : 'transparent',
                                        border: `1px solid ${isActive ? `${c}25` : 'transparent'}`,
                                    }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = `${c}08`; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? `${c}12` : 'transparent'; }}
                                >
                                    {opt.emoji && <span className="text-sm shrink-0">{opt.emoji}</span>}
                                    <span className="flex-1 text-[11px] font-semibold" style={{ color: c }}>{opt.label}</span>
                                    {isActive && <Check size={12} style={{ color: c }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const initialForm = {
    title: '', subject_id: '', subject_name: '', chapter_id: '',
    category: 'lecture', priority: 'medium', status: 'pending',
    date: '', start_time: '', end_time: '', notes: '',
};

export default function TaskModal({ open, onClose, task, defaultDate, defaultTime }) {
    const subjects = SUBJECTS;
    const allChapters = useAtomValue(chaptersAtom) || [];
    const { addTask, updateTask, deleteTask } = useTaskActions();
    const [form, setForm] = useState(initialForm);
    const wasEditingRef = useRef(false);
    const isEditing = open ? !!task : wasEditingRef.current;

    const subjectOptions = useMemo(() => [
        { value: '', label: 'No subject', emoji: '📂', color: '#64748b' },
        ...subjects.map((s) => ({ value: s.id, label: s.name, emoji: s.emoji, color: s.color })),
    ], [subjects]);

    const chapterOptions = useMemo(() => {
        if (!form.subject_id) return [];
        const filtered = allChapters.filter((c) => c.subject_id === form.subject_id);
        return [
            { value: '', label: 'No chapter', emoji: '📄', color: '#64748b' },
            ...filtered.map((c) => {
                const subj = subjects.find((s) => s.id === form.subject_id);
                return { value: c.id, label: c.name, emoji: '📑', color: subj?.color || '#8b5cf6' };
            }),
        ];
    }, [allChapters, form.subject_id, subjects]);

    useEffect(() => {
        if (!open) return; // Don't reset form when closing — prevents flash
        wasEditingRef.current = !!task;
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
        setForm((p) => ({ ...p, subject_id: id, subject_name: s?.name || '', chapter_id: '' }));
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

    const currentStatus = statuses.find((s) => s.value === form.status);
    const statusColor = currentStatus?.color || '#64748b';

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-white/10 overflow-visible">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="neon-text font-extrabold text-lg">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</span>
                        {isEditing && (
                            <Badge variant="outline" className="mono text-[10px] tracking-wider border-white/10" style={{ color: statusColor }}>
                                {form.status.toUpperCase().replace('_', ' ')}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-visible">
                    {/* Title */}
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Task</Label>
                        <Input
                            placeholder="e.g., Kinematics — HCV Ch.4"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            autoFocus
                            className="bg-white/5 border-white/10 focus:border-rose-500/40 mt-1"
                        />
                    </div>

                    {/* Date + Times */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Date</Label>
                            <Input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                        </div>
                        <TimeSpinner label="Start" value={form.start_time} onChange={(v) => updateField('start_time', v)} />
                        <TimeSpinner label="End" value={form.end_time} onChange={(v) => updateField('end_time', v)} />
                    </div>

                    {/* Subject + Chapter */}
                    <div className={`grid gap-3 ${form.subject_id ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Subject</Label>
                            <ModularSelect
                                value={form.subject_id}
                                onChange={handleSubjectChange}
                                options={subjectOptions}
                                placeholder="Select subject"
                                label="SUBJECTS"
                                accentColor="#8b5cf6"
                            />
                        </div>
                        {form.subject_id && chapterOptions.length > 1 && (
                            <div>
                                <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Chapter</Label>
                                <ModularSelect
                                    value={form.chapter_id}
                                    onChange={(v) => updateField('chapter_id', v)}
                                    options={chapterOptions}
                                    placeholder="Select chapter"
                                    label="CHAPTERS"
                                    accentColor={subjects.find((s) => s.id === form.subject_id)?.color || '#8b5cf6'}
                                />
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Category</Label>
                        <ModularSelect
                            value={form.category}
                            onChange={(v) => updateField('category', v)}
                            options={categories}
                            placeholder="Select category"
                            label="CATEGORY"
                            accentColor="#f472b6"
                        />
                    </div>

                    {/* Priority + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Priority</Label>
                            <ModularSelect
                                value={form.priority}
                                onChange={(v) => updateField('priority', v)}
                                options={priorities}
                                placeholder="Select priority"
                                label="PRIORITY"
                                accentColor="#fb923c"
                            />
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Status</Label>
                            <ModularSelect
                                value={form.status}
                                onChange={(v) => updateField('status', v)}
                                options={statuses}
                                placeholder="Select status"
                                label="STATUS"
                                accentColor="#22d3ee"
                            />
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
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="futuristic-btn futuristic-btn-ghost">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSave} disabled={!form.title.trim()} className="futuristic-btn">
                            {isEditing ? 'Save' : 'Create'}
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
