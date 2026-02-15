'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { subjectsAtom, chaptersAtom, useSubjectActions, useChapterActions } from '@/lib/atoms';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight, BookOpen, Trash2 } from 'lucide-react';

const subjectColors = [
    { label: 'Cyan', value: '#22d3ee' },
    { label: 'Pink', value: '#f472b6' },
    { label: 'Orange', value: '#fb923c' },
    { label: 'Green', value: '#34d399' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Indigo', value: '#818cf8' },
    { label: 'Red', value: '#f43f5e' },
    { label: 'Yellow', value: '#facc15' },
];

const chapterStatuses = [
    { value: 'not_started', label: '🔲 Not Started', color: '#64748b' },
    { value: 'in_progress', label: '🔄 In Progress', color: '#22d3ee' },
    { value: 'revision_1', label: '📝 Revision 1', color: '#fb923c' },
    { value: 'revision_2', label: '📕 Revision 2', color: '#a78bfa' },
    { value: 'completed', label: '✅ Completed', color: '#34d399' },
];

function SubjectCard({ subject }) {
    const chapters = useAtomValue(chaptersAtom) || [];
    const { deleteSubject } = useSubjectActions();
    const { addChapter, updateChapter, deleteChapter, getChaptersBySubject } = useChapterActions();
    const [open, setOpen] = useState(false);
    const [chapterModalOpen, setChapterModalOpen] = useState(false);
    const [newChapterName, setNewChapterName] = useState('');
    const color = subject.color || '#8b5cf6';

    const subjectChapters = getChaptersBySubject(subject.id);
    const completed = subjectChapters.filter((c) => c.status === 'completed').length;
    const total = subjectChapters.length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const handleAddChapter = () => {
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
        <Card className="bg-card border-white/6 overflow-hidden">
            <div
                className="p-3 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
                        <span className="text-sm font-semibold text-zinc-200">{subject.name}</span>
                        <Badge variant="outline" className="mono text-[9px] border-white/10 text-zinc-500">
                            {completed}/{total}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        {open ? <ChevronDown size={14} className="text-zinc-600" /> : <ChevronRight size={14} className="text-zinc-600" />}
                    </div>
                </div>
                <Progress value={pct} className="h-1 mt-2" />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 border-t border-white/6 pt-2">
                            {subjectChapters.length === 0 ? (
                                <p className="text-xs text-zinc-600 text-center py-2">No chapters yet</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {subjectChapters.map((ch) => {
                                        const statusInfo = chapterStatuses.find((s) => s.value === ch.status) || chapterStatuses[0];
                                        return (
                                            <div key={ch.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-white/3">
                                                <span className="text-xs text-zinc-300">{ch.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={ch.status}
                                                        onChange={(e) => updateChapter(ch.id, { status: e.target.value })}
                                                        className="bg-transparent text-[10px] border-none focus:outline-none cursor-pointer"
                                                        style={{ color: statusInfo.color }}
                                                    >
                                                        {chapterStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                    </select>
                                                    <button onClick={() => deleteChapter(ch.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/6">
                                <Button variant="ghost" size="sm" className="text-[10px] text-violet-400 h-6 px-2" onClick={() => setChapterModalOpen(true)}>
                                    <Plus size={11} className="mr-1" /> Chapter
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-700 hover:text-red-400" onClick={() => deleteSubject(subject.id)}>
                                    <Trash2 size={11} />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={chapterModalOpen} onOpenChange={setChapterModalOpen}>
                <DialogContent className="sm:max-w-[360px] bg-zinc-900 border-white/10">
                    <DialogHeader><DialogTitle className="neon-text font-bold text-sm">Add Chapter</DialogTitle></DialogHeader>
                    <div>
                        <Label className="text-zinc-500 mono text-[10px] uppercase">Chapter Name</Label>
                        <Input
                            placeholder="e.g., Kinematics"
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            className="bg-white/5 border-white/10 mt-1"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddChapter(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddChapter} disabled={!newChapterName.trim()} className="bg-violet-500 hover:bg-violet-600 text-white text-xs">
                            ADD
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default function SubjectsPage() {
    const subjects = useAtomValue(subjectsAtom) || [];
    const { addSubject } = useSubjectActions();
    const [modalOpen, setModalOpen] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [selectedColor, setSelectedColor] = useState(subjectColors[0].value);

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        addSubject({
            id: crypto.randomUUID(),
            name: newSubjectName.trim(),
            color: selectedColor,
            created_at: new Date().toISOString(),
        });
        setNewSubjectName('');
        setSelectedColor(subjectColors[0].value);
        setModalOpen(false);
    };

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-violet-400" />
                    <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Subjects & Chapters</h2>
                </div>
                <Button size="sm" className="h-7 text-xs bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" onClick={() => setModalOpen(true)}>
                    <Plus size={14} className="mr-1" /> Subject
                </Button>
            </div>

            {subjects.length === 0 ? (
                <Card className="p-8 text-center bg-card border-white/6">
                    <BookOpen size={32} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-600">No subjects yet. Add one to get started!</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-zinc-900 border-white/10">
                    <DialogHeader><DialogTitle className="neon-text font-bold text-sm">Add Subject</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase">Subject Name</Label>
                            <Input
                                placeholder="e.g., Physics"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                className="bg-white/5 border-white/10 mt-1"
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label className="text-zinc-500 mono text-[10px] uppercase">Color</Label>
                            <div className="flex gap-2 mt-1">
                                {subjectColors.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedColor(c.value)}
                                        className="w-6 h-6 rounded-md transition-transform"
                                        style={{
                                            background: c.value,
                                            transform: selectedColor === c.value ? 'scale(1.3)' : 'scale(1)',
                                            boxShadow: selectedColor === c.value ? `0 0 12px ${c.value}60` : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddSubject} disabled={!newSubjectName.trim()} className="bg-violet-500 hover:bg-violet-600 text-white text-xs">
                            ADD
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
