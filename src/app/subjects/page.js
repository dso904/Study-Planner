'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { chaptersAtom, useChapterActions, SUBJECTS } from '@/lib/atoms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const chapterStatuses = [
    { value: 'not_started', label: 'Not Started', color: '#64748b' },
    { value: 'in_progress', label: 'In Progress', color: '#22d3ee' },
    { value: 'revision_1', label: 'Revision 1', color: '#fb923c' },
    { value: 'revision_2', label: 'Revision 2', color: '#a78bfa' },
    { value: 'completed', label: 'Completed', color: '#34d399' },
];

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
            className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 h-full"
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

            {/* Chapters List */}
            <div className="flex-1 overflow-auto px-5 pb-2 custom-scrollbar">
                {chapters.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                        <p className="text-[11px] text-zinc-600 mono">No chapters yet</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {chapters.map((ch, idx) => {
                            const statusInfo = chapterStatuses.find((s) => s.value === ch.status) || chapterStatuses[0];
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
                                        <select
                                            value={ch.status}
                                            onChange={(e) => updateChapter(ch.id, { status: e.target.value })}
                                            className="bg-transparent text-[9px] mono font-semibold border-none focus:outline-none cursor-pointer appearance-none"
                                            style={{ color: statusInfo.color }}
                                        >
                                            {chapterStatuses.map((s) => (
                                                <option key={s.value} value={s.value} style={{ background: '#0f0e2a' }}>{s.label}</option>
                                            ))}
                                        </select>
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
                            placeholder="e.g., Kinematics, Thermodynamics..."
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
    return (
        <div className="h-[calc(100vh-var(--topbar-h)-3.5rem)] flex flex-col">
            {/* Grid: 2×2 quadrants */}
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
                {SUBJECTS.map((subject, i) => (
                    <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                        className="min-h-0"
                    >
                        <SubjectQuadrant subject={subject} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
