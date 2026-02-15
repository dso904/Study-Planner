'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { chaptersAtom, useChapterActions, SUBJECTS } from '@/lib/atoms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ChevronDown } from 'lucide-react';

const chapterStatuses = [
    { value: 'not_started', label: 'Not Started', emoji: '⏸️', color: '#64748b', bg: '#64748b15' },
    { value: 'in_progress', label: 'In Progress', emoji: '📖', color: '#22d3ee', bg: '#22d3ee15' },
    { value: 'revision_1', label: 'Revision 1', emoji: '🔁', color: '#fb923c', bg: '#fb923c15' },
    { value: 'revision_2', label: 'Revision 2', emoji: '🔄', color: '#a78bfa', bg: '#a78bfa15' },
    { value: 'completed', label: 'Completed', emoji: '✅', color: '#34d399', bg: '#34d39915' },
];

/* ─── Chapter Status Selector ─── */
function StatusSelector({ value, onChange, parentColor }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const current = chapterStatuses.find((s) => s.value === value) || chapterStatuses[0];

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={containerRef} className="relative" style={{ zIndex: open ? 50 : 'auto' }}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold mono tracking-wider transition-all duration-200 hover:scale-105"
                style={{
                    color: current.color,
                    background: current.bg,
                    border: `1px solid ${current.color}25`,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${current.color}60`;
                    e.currentTarget.style.boxShadow = `0 0 10px ${current.color}20`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${current.color}25`;
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <span className="text-xs">{current.emoji}</span>
                <span>{current.label}</span>
                <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 min-w-[180px] p-1.5 rounded-xl"
                        style={{
                            zIndex: 9999,
                            background: 'rgba(15,14,42,0.98)',
                            border: `1px solid ${parentColor}30`,
                            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${parentColor}10`,
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <p className="px-2 py-1 text-[8px] mono font-bold uppercase tracking-widest text-zinc-600 mb-1">
                            CHAPTER STATUS
                        </p>
                        {chapterStatuses.map((s) => {
                            const isActive = s.value === value;
                            return (
                                <button
                                    key={s.value}
                                    onClick={(e) => { e.stopPropagation(); onChange(s.value); setOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150"
                                    style={{
                                        background: isActive ? s.bg : 'transparent',
                                        border: `1px solid ${isActive ? `${s.color}30` : 'transparent'}`,
                                    }}
                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = `${s.color}08`; }}
                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? s.bg : 'transparent'; }}
                                >
                                    <span className="text-sm">{s.emoji}</span>
                                    <span className="flex-1 text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                                    {isActive && <Check size={12} style={{ color: s.color }} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Subject Quadrant Card ─── */
function SubjectQuadrant({ subject }) {
    const allChapters = useAtomValue(chaptersAtom) || [];
    const { addChapter, updateChapter, deleteChapter } = useChapterActions();
    const [chapterModalOpen, setChapterModalOpen] = useState(false);
    const [newChapterName, setNewChapterName] = useState('');

    const chapters = useMemo(
        () => allChapters.filter((c) => c.subject_id === subject.id),
        [allChapters, subject.id],
    );

    const completed = chapters.filter((c) => c.status === 'completed').length;
    const total = chapters.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const handleAdd = () => {
        if (!newChapterName.trim()) return;
        addChapter({
            id: crypto.randomUUID(),
            subject_id: subject.id,
            name: newChapterName.trim(),
            status: 'not_started',
            created_at: new Date().toISOString(),
        });
        setNewChapterName('');
        setChapterModalOpen(false);
    };

    return (
        <div
            className="relative flex flex-col rounded-2xl transition-all duration-300 h-full"
            style={{
                background: `linear-gradient(145deg, ${subject.color}0a 0%, ${subject.color}04 50%, transparent 100%)`,
                border: `1px solid ${subject.color}22`,
                boxShadow: `inset 0 1px 0 ${subject.color}10`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${subject.color}45`;
                e.currentTarget.style.boxShadow = `0 0 30px ${subject.color}12, inset 0 1px 0 ${subject.color}18`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${subject.color}22`;
                e.currentTarget.style.boxShadow = `inset 0 1px 0 ${subject.color}10`;
            }}
        >
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{
                                background: `${subject.color}15`,
                                border: `1px solid ${subject.color}20`,
                                boxShadow: `0 0 20px ${subject.color}10`,
                            }}
                        >
                            {subject.emoji}
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">{subject.name}</h2>
                            <p className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] mono" style={{ color: subject.color }}>
                                    {subject.icon} SUBJECT MODULE
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-sm" style={{ background: '#34d399', boxShadow: '0 0 6px #34d39960' }} />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 mono">ACTIVE</span>
                        </div>
                        {total > 0 && (
                            <Badge variant="outline" className="mono text-[9px] px-1.5 py-0 border-white/10" style={{ color: subject.color }}>
                                {completed}/{total} • {pct}%
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${subject.color}90, ${subject.color})`, boxShadow: `0 0 10px ${subject.color}50` }}
                    />
                </div>
            </div>

            {/* Chapters List — scrolls independently */}
            <div className="flex-1 overflow-auto px-5 pb-2 custom-scrollbar">
                {chapters.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-[11px] text-zinc-600 mono">No chapters yet</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {chapters.map((ch, idx) => {
                            const shadeOpacity = Math.max(0.06, 0.18 - idx * 0.02);
                            const borderOpacity = Math.max(0.08, 0.22 - idx * 0.025);
                            return (
                                <div
                                    key={ch.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 group/ch hover:scale-[1.01]"
                                    style={{
                                        background: `${subject.color}${Math.round(shadeOpacity * 255).toString(16).padStart(2, '0')}`,
                                        border: `1px solid ${subject.color}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-1 h-5 rounded-full shrink-0"
                                            style={{ background: subject.color, opacity: Math.max(0.3, 1 - idx * 0.1) }}
                                        />
                                        <span className="text-[12px] font-medium text-zinc-200 truncate">{ch.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <StatusSelector
                                            value={ch.status}
                                            onChange={(newStatus) => updateChapter(ch.id, { status: newStatus })}
                                            parentColor={subject.color}
                                        />
                                        <button
                                            onClick={() => deleteChapter(ch.id)}
                                            className="opacity-0 group-hover/ch:opacity-100 text-zinc-700 hover:text-red-400 transition-all p-0.5"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Chapter Button */}
            <div className="px-5 pb-4 pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-[10px] font-bold mono tracking-widest border border-dashed rounded-lg hover:scale-[1.01] transition-transform"
                    style={{ color: subject.color, borderColor: `${subject.color}25` }}
                    onClick={() => setChapterModalOpen(true)}
                >
                    <Plus size={13} className="mr-1.5" /> ADD CHAPTER
                </Button>
            </div>

            {/* Add Chapter Dialog */}
            <Dialog open={chapterModalOpen} onOpenChange={setChapterModalOpen}>
                <DialogContent className="sm:max-w-[380px] bg-zinc-900/95 backdrop-blur-xl" style={{ border: `1px solid ${subject.color}30` }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{subject.emoji}</span>
                            <span style={{ color: subject.color }} className="font-extrabold">{subject.name}</span>
                            <span className="text-zinc-500 font-normal">— Add Chapter</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase tracking-wider">Chapter Name</Label>
                        <Input
                            placeholder={
                                subject.id === 'physics' ? 'e.g., Kinematics, Thermodynamics...' :
                                    subject.id === 'chemistry' ? 'e.g., Organic Chemistry, Bonding...' :
                                        subject.id === 'maths' ? 'e.g., Calculus, Algebra...' :
                                            subject.id === 'biology' ? 'e.g., Genetics, Cell Biology...' :
                                                subject.id === 'english' ? 'e.g., Grammar, Literature...' :
                                                    'e.g., Chapter details...'
                            }
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            className="bg-white/5 border-white/10 mt-1.5"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleAdd}
                            disabled={!newChapterName.trim()}
                            className="font-bold tracking-wider text-white text-xs"
                            style={{ background: `linear-gradient(135deg, ${subject.color}cc, ${subject.color}90)` }}
                        >
                            ADD CHAPTER
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ─── Page ─── */
export default function SubjectsPage() {
    const coreSubjects = SUBJECTS.filter((s) => s.id !== 'english');
    const english = SUBJECTS.find((s) => s.id === 'english');

    return (
        <div className="space-y-3">
            {/* 2×2 grid for Physics, Chemistry, Maths, Biology — fills viewport */}
            <div className="grid grid-cols-2 grid-rows-2 gap-3" style={{ height: 'calc(100vh - var(--topbar-h) - 3.5rem)' }}>
                {coreSubjects.map((subject, i) => (
                    <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                    >
                        <SubjectQuadrant subject={subject} />
                    </motion.div>
                ))}
            </div>

            {/* English — full-width block below, scroll to see */}
            {english && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.32 }}
                    style={{ height: '280px' }}
                >
                    <SubjectQuadrant subject={english} />
                </motion.div>
            )}
        </div>
    );
}

