'use client';

import { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { notesPanelOpenAtom, useNoteActions } from '@/lib/atoms';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, StickyNote, Plus } from 'lucide-react';

/* ─── Single Note Item ─── */
function NoteItem({ note, onToggle, onDelete, onEdit }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(note.text);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setText(note.text);
    }, [note.text]);

    const save = () => {
        const trimmed = text.trim();
        if (trimmed && trimmed !== note.text) onEdit(note.id, trimmed);
        setEditing(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="group flex items-start gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.03]"
        >
            {/* Checkbox */}
            <button
                onClick={() => onToggle(note.id)}
                className={`mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${note.done
                    ? 'bg-rose-500/80 border-rose-500/80'
                    : 'border-zinc-600 hover:border-rose-400'
                    }`}
            >
                {note.done && <Check size={11} strokeWidth={3} className="text-white" />}
            </button>

            {/* Text */}
            {editing ? (
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={save}
                    onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setText(note.text); setEditing(false); } }}
                    className="flex-1 bg-transparent text-sm text-zinc-200 outline-none border-b border-rose-500/40 pb-0.5"
                />
            ) : (
                <span
                    className={`flex-1 text-sm leading-relaxed cursor-pointer transition-all ${note.done ? 'line-through text-zinc-600' : 'text-zinc-300'
                        }`}
                    onDoubleClick={() => { if (!note.done) { setEditing(true); } }}
                >
                    {note.text}
                </span>
            )}

            {/* Delete */}
            <button
                onClick={() => onDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 mt-0.5 text-zinc-600 hover:text-red-400 transition-all"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    );
}

/* ─── Quick Notes Panel ─── */
export default function QuickNotes() {
    const [open, setOpen] = useAtom(notesPanelOpenAtom);
    const { notes, addNote, toggleNote, deleteNote, editNote } = useNoteActions();
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [open]);

    const handleAdd = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        addNote(trimmed);
        setInput('');
    };

    const undone = (notes || []).filter((n) => !n.done);
    const done = (notes || []).filter((n) => n.done);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 z-[60]"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="fixed right-0 top-0 bottom-0 w-[360px] z-[61] flex flex-col overflow-hidden border-l border-white/8"
                        style={{
                            background: 'oklch(0.13 0.015 280 / 95%)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                    <StickyNote size={16} className="text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-100">Quick Notes</h2>
                                    <p className="text-[10px] text-zinc-500 mono tracking-wide">
                                        {undone.length} pending · {done.length} done
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/6 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-b border-white/6">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                                    placeholder="Add a note..."
                                    className="flex-1 bg-white/[0.04] text-sm text-zinc-200 placeholder-zinc-600 px-3 py-2 rounded-lg border border-white/8 outline-none focus:border-rose-500/40 focus:bg-white/[0.06] transition-all"
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!input.trim()}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Notes list */}
                        <div className="flex-1 overflow-y-auto px-1 py-2">
                            {(!notes || notes.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
                                    <StickyNote size={40} strokeWidth={1} className="opacity-30" />
                                    <p className="text-sm">No notes yet</p>
                                    <p className="text-xs text-zinc-700">Jot down reminders, errands, ideas...</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {/* Undone notes first */}
                                    {undone.map((note) => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onToggle={toggleNote}
                                            onDelete={deleteNote}
                                            onEdit={editNote}
                                        />
                                    ))}

                                    {/* Divider if both exist */}
                                    {undone.length > 0 && done.length > 0 && (
                                        <div className="flex items-center gap-3 px-4 py-2 my-1">
                                            <div className="flex-1 h-px bg-white/6" />
                                            <span className="text-[9px] mono font-semibold text-zinc-600 uppercase tracking-widest">
                                                Completed
                                            </span>
                                            <div className="flex-1 h-px bg-white/6" />
                                        </div>
                                    )}

                                    {/* Done notes */}
                                    {done.map((note) => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onToggle={toggleNote}
                                            onDelete={deleteNote}
                                            onEdit={editNote}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {done.length > 0 && (
                            <div className="px-4 py-3 border-t border-white/6">
                                <button
                                    onClick={() => done.forEach((n) => deleteNote(n.id))}
                                    className="w-full text-xs text-zinc-600 hover:text-red-400 transition-colors py-1"
                                >
                                    Clear {done.length} completed note{done.length > 1 ? 's' : ''}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
