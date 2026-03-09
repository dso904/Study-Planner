'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { SUBJECTS, chaptersAtom, booksAtom, useTaskActions } from '@/lib/atoms';
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
import { toast } from 'sonner';

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

    // UX-H FIX: Allow direct keyboard input for hours and minutes
    // R1-FIX: Handle empty string from backspace — set to 0 so user can retype
    const handleHourInput = (e) => {
        if (e.target.value === '') { update(0, minutes); return; }
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 23) update(val, minutes);
    };
    const handleMinInput = (e) => {
        if (e.target.value === '') { update(hours, 0); return; }
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 59) update(hours, val);
    };
    const selectOnFocus = (e) => e.target.select();

    return (
        <div>
            <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">{label}</Label>
            <div className="flex items-center gap-1 mt-1 rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Hours */}
                <div className="flex flex-col items-center" onWheel={(e) => handleWheel(e, 'hour')}>
                    <button type="button" onClick={incHour} className="text-zinc-400 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-white/5">
                        <ChevronUp size={14} />
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={String(hours).padStart(2, '0')}
                        onChange={handleHourInput}
                        onFocus={selectOnFocus}
                        className="text-sm font-semibold text-zinc-200 mono w-6 text-center bg-transparent outline-none border-none appearance-none select-all"
                        maxLength={2}
                    />
                    <button type="button" onClick={decHour} className="text-zinc-400 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-white/5">
                        <ChevronDown size={14} />
                    </button>
                </div>

                <span className="text-zinc-400 font-bold text-sm select-none">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center" onWheel={(e) => handleWheel(e, 'minute')}>
                    <button type="button" onClick={incMin} className="text-zinc-400 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-white/5">
                        <ChevronUp size={14} />
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={String(minutes).padStart(2, '0')}
                        onChange={handleMinInput}
                        onFocus={selectOnFocus}
                        className="text-sm font-semibold text-zinc-200 mono w-6 text-center bg-transparent outline-none border-none appearance-none select-all"
                        maxLength={2}
                    />
                    <button type="button" onClick={decMin} className="text-zinc-400 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-white/5">
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* AM/PM label */}
                <span className="text-[9px] font-semibold text-zinc-400 mono ml-1 select-none">
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
    { value: 'test', label: 'Tests / Mock / Assignments', emoji: '📝', color: '#f472b6' },
    { value: 'school', label: 'School', emoji: '🏫', color: '#64748b' },
    { value: 'tuition', label: 'Tuition', emoji: '🎓', color: '#f43f5e' },
    { value: 'others', label: 'Others', emoji: '📦', color: '#a1a1aa' },
];

const priorities = [
    { value: 'high', label: 'High', emoji: '🟠', color: '#fb923c' },
    { value: 'medium', label: 'Medium', emoji: '🟡', color: '#facc15' },
    { value: 'low', label: 'Low', emoji: '🟢', color: '#34d399' },
];

const statuses = [
    { value: 'done', label: 'Completed', emoji: '✅', color: '#34d399' },
    { value: 'skipped', label: 'Skipped', emoji: '⏭️', color: '#64748b' },
];

/* ─── Reusable Modular Dropdown ─── */
function ModularSelect({ value, onChange, options, placeholder, label, accentColor = '#8b5cf6' }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
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

    // R3-FIX: Close dropdown when modal body scrolls (fixed dropdown would detach)
    useEffect(() => {
        if (!open) return;
        const scrollParent = containerRef.current?.closest('.task-modal-body');
        if (!scrollParent) return;
        const onScroll = () => setOpen(false);
        scrollParent.addEventListener('scroll', onScroll, { passive: true });
        return () => scrollParent.removeEventListener('scroll', onScroll);
    }, [open]);

    // UX-C FIX: Calculate dropdown position from trigger button viewport rect
    // so it floats above the modal's overflow boundary instead of being clipped
    const handleOpen = () => {
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setOpen(!open);
    };

    const displayColor = current?.color || '#64748b';

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={handleOpen}
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
                        className="p-1.5 rounded-xl max-h-[200px] overflow-auto custom-scrollbar"
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            zIndex: 9999,
                            background: 'rgba(15,14,42,0.98)',
                            border: `1px solid ${accentColor}30`,
                            boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 20px ${accentColor}08`,
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        {label && (
                            <p className="px-2 py-1 text-[8px] mono font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
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

// H8-FIX: Default status is 'pending' (not '') to avoid false backlog detection
const initialForm = {
    title: '', subject_id: '', subject_name: '', chapter_id: '',
    book_id: '',
    category: 'lecture', priority: 'medium', status: 'pending',
    date: '', start_time: '', end_time: '', notes: '',
};

export default function TaskModal({ open, onClose, task, defaultDate, defaultTime }) {
    const subjects = SUBJECTS;
    const allChapters = useAtomValue(chaptersAtom) || [];
    const allBooks = useAtomValue(booksAtom) || [];
    const { addTask, updateTask, deleteTask } = useTaskActions();
    const [form, setForm] = useState(initialForm);
    const [wasEditing, setWasEditing] = useState(false);
    const isEditing = open ? !!task : wasEditing;

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

    const bookOptions = useMemo(() => {
        if (!form.subject_id) return [];
        const filtered = allBooks.filter((b) => b.subject_id === form.subject_id);
        if (filtered.length === 0) return [];
        const subj = subjects.find((s) => s.id === form.subject_id);
        return [
            { value: '', label: 'No book', emoji: '📂', color: '#64748b' },
            ...filtered.map((b) => ({
                value: b.id, label: b.title, emoji: '📕', color: subj?.color || '#8b5cf6',
            })),
        ];
    }, [allBooks, form.subject_id, subjects]);

    useEffect(() => {
        if (!open) return; // Don't reset form when closing — prevents flash
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWasEditing(!!task);
        if (task) {
            setForm({
                title: task.title || '', subject_id: task.subject_id || '', subject_name: task.subject_name || '',
                chapter_id: task.chapter_id || '', book_id: task.book_id || '',
                category: task.category || 'lecture', priority: task.priority || 'medium',
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
        setForm((p) => ({ ...p, subject_id: id, subject_name: s?.name || '', chapter_id: '', book_id: '' }));
    };

    const handleSave = () => {
        // Validate required fields with toast notifications
        const missing = [];
        if (!form.title.trim()) missing.push('Task title');
        if (!form.subject_id) missing.push('Subject');
        if (!form.date) missing.push('Date');
        if (!form.start_time) missing.push('Start time');
        if (!form.end_time) missing.push('End time');
        if (!form.category) missing.push('Category');

        if (missing.length > 0) {
            toast.error(`Missing required fields`, {
                description: missing.join(', '),
                duration: 4000,
            });
            return;
        }

        // Note: We removed the end_time > start_time check to allow overnight tasks (e.g. 23:00 to 01:00)

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
            <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-white/10 overflow-visible max-h-[100dvh] sm:max-h-[85vh] task-modal-content flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="neon-text font-extrabold text-lg">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</span>
                        {isEditing && (
                            <Badge variant="outline" className="mono text-[10px] tracking-wider border-white/10" style={{ color: statusColor }}>
                                {form.status.toUpperCase().replaceAll('_', ' ')}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-visible flex-1 overflow-y-auto min-h-0 task-modal-body">
                    {/* ─── Section 1: Task Info ─── */}
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3.5 space-y-3">
                        <p className="mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300 flex items-center gap-1.5">
                            <span>📋</span> Task Info
                        </p>
                        {/* Title */}
                        <div>
                            <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Task</Label>
                            <Input
                                placeholder="e.g., Kinematics — HCV Ch.4"
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                autoFocus
                                className="bg-white/5 border-white/10 focus:border-rose-500/40 mt-1"
                            />
                        </div>
                        {/* Subject + Chapter */}
                        <div className={`grid gap-3 ${form.subject_id ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            <div>
                                <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Subject</Label>
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
                                    <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Chapter</Label>
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
                        {/* Book from Library — hidden for lecture, tuition, school, test */}
                        {form.subject_id && bookOptions.length > 1 && !['lecture', 'tuition', 'school', 'test'].includes(form.category) && (
                            <div>
                                <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">📕 Book (from Library)</Label>
                                <ModularSelect
                                    value={form.book_id}
                                    onChange={(v) => updateField('book_id', v)}
                                    options={bookOptions}
                                    placeholder="Select a book"
                                    label="BOOKS"
                                    accentColor={subjects.find((s) => s.id === form.subject_id)?.color || '#8b5cf6'}
                                />
                            </div>
                        )}
                        {/* Category */}
                        <div>
                            <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Category</Label>
                            <ModularSelect
                                value={form.category}
                                onChange={(v) => updateField('category', v)}
                                options={categories}
                                placeholder="Select category"
                                label="CATEGORY"
                                accentColor="#f472b6"
                            />
                        </div>
                    </div>

                    {/* ─── Section 2: Schedule & Details ─── */}
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3.5 space-y-3">
                        <p className="mono text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300 flex items-center gap-1.5">
                            <span>🕐</span> Schedule & Details
                        </p>
                        {/* Date + Times */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Date</Label>
                                <Input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className="bg-white/5 border-white/10 mt-1" />
                            </div>
                            <TimeSpinner label="Start" value={form.start_time} onChange={(v) => updateField('start_time', v)} />
                            <TimeSpinner label="End" value={form.end_time} onChange={(v) => updateField('end_time', v)} />
                        </div>
                        {/* Notes */}
                        <div>
                            <Label className="text-zinc-300 mono text-[11px] uppercase tracking-wider">Notes</Label>
                            <Textarea
                                placeholder="Additional details..."
                                value={form.notes}
                                onChange={(e) => updateField('notes', e.target.value)}
                                rows={2}
                                className="bg-white/5 border-white/10 mt-1"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between mt-4 shrink-0 task-modal-footer">
                    <div>
                        {isEditing && (
                            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-zinc-300 hover:text-zinc-200">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!form.title.trim()} className="font-bold tracking-wider text-white text-xs bg-violet-600 hover:bg-violet-500">
                            {isEditing ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
