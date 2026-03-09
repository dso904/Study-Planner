'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { booksAtom, useBookActions, SUBJECTS } from '@/lib/atoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, BookOpen, Library, User, Building2, X } from 'lucide-react';
import PageTransition from '@/components/layout/page-transition';

/* ─── Book spine color palette — derived from subject color with variation ─── */
const SPINE_PALETTES = {
    physics: ['#facc15', '#eab308', '#fbbf24', '#f59e0b', '#d97706', '#ca8a04'],
    chemistry: ['#f472b6', '#ec4899', '#db2777', '#f9a8d4', '#e879f9', '#d946ef'],
    maths: ['#ef4444', '#dc2626', '#f87171', '#fb923c', '#f97316', '#ea580c'],
    biology: ['#34d399', '#10b981', '#059669', '#6ee7b7', '#a7f3d0', '#14b8a6'],
    english: ['#60a5fa', '#3b82f6', '#2563eb', '#818cf8', '#93c5fd', '#6366f1'],
};

function getSpineColor(subjectId, index) {
    const palette = SPINE_PALETTES[subjectId] || ['#8b5cf6', '#7c3aed', '#a78bfa', '#6d28d9', '#c4b5fd', '#5b21b6'];
    return palette[index % palette.length];
}

/* ─── Book Component — spine on shelf with hover tooltip card ─── */
function BookSpine({ book, index, onEdit, onDelete, subjectColor, isRightEdge }) {
    const spineColor = getSpineColor(book.subject_id, index);
    const [hovered, setHovered] = useState(false);
    const subject = SUBJECTS.find(s => s.id === book.subject_id);

    // Generate deterministic height/width variation for visual interest
    const heightVariation = 180 + ((book.title.length * 7 + index * 13) % 40);
    const widthVariation = 48 + ((book.title.length * 3 + index * 5) % 16);

    return (
        <motion.div
            className="book-on-shelf"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.45, delay: index * 0.06, ease: [0.23, 1.0, 0.32, 1.0] }}
            layout
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ position: 'relative', zIndex: hovered ? 100 : 1 }}
        >
            {/* ── The book spine ── */}
            <motion.div
                animate={{
                    y: hovered ? -6 : 0,
                    scale: hovered ? 1.04 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    width: `${widthVariation}px`,
                    height: `${heightVariation}px`,
                    cursor: 'pointer',
                    position: 'relative',
                }}
                onClick={() => onEdit(book)}
            >
                {/* Book Spine face */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(180deg, ${spineColor}ee 0%, ${spineColor}cc 40%, ${spineColor}aa 100%)`,
                        borderRadius: '3px 6px 6px 3px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 6px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: hovered
                            ? `3px 4px 16px rgba(0,0,0,0.5), inset -2px 0 6px rgba(0,0,0,0.2), inset 2px 0 4px rgba(255,255,255,0.15), 0 0 20px ${spineColor}25`
                            : `2px 2px 8px rgba(0,0,0,0.4), inset -2px 0 6px rgba(0,0,0,0.2), inset 2px 0 4px rgba(255,255,255,0.15)`,
                        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                    }}
                >
                    {/* Top decorative band */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))',
                        borderRadius: '3px 6px 0 0',
                    }} />

                    {/* Spine groove lines */}
                    <div style={{ position: 'absolute', top: '18px', left: '4px', right: '4px', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ position: 'absolute', bottom: '18px', left: '4px', right: '4px', height: '1px', background: 'rgba(0,0,0,0.2)' }} />

                    {/* Book title — vertical */}
                    <div style={{
                        writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                        fontSize: '11px', fontWeight: 800, color: 'rgba(0,0,0,0.75)',
                        letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.3,
                        maxHeight: `${heightVariation - 60}px`, overflow: 'hidden',
                        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                    }}>
                        {book.title}
                    </div>

                    {/* Bottom decorative band */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))',
                        borderRadius: '0 0 6px 3px',
                    }} />
                </div>

                {/* Book edge (depth illusion) */}
                <div style={{
                    position: 'absolute', top: '2px', right: '-3px', width: '3px', height: 'calc(100% - 4px)',
                    background: `linear-gradient(180deg, ${spineColor}80, ${spineColor}40)`,
                    borderRadius: '0 2px 2px 0', boxShadow: '1px 0 4px rgba(0,0,0,0.3)',
                }} />

                {/* Book bottom pages edge */}
                <div style={{
                    position: 'absolute', bottom: '-2px', left: '3px', right: '0', height: '3px',
                    background: 'linear-gradient(90deg, #e8ddc8, #f5f0e6, #e8ddc8)',
                    borderRadius: '0 0 2px 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
            </motion.div>

            {/* ── Shadow beneath book ── */}
            <div style={{
                width: `${widthVariation - 4}px`, height: '8px',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                marginTop: '-2px', borderRadius: '50%', filter: 'blur(2px)',
            }} />

            {/* ── Floating Tooltip Card (appears to the right of book) ── */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: isRightEdge ? 6 : -6, scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: isRightEdge ? 6 : -6, scale: 0.92 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '0',
                            // R4-FIX: Render tooltip left for rightmost books to prevent off-screen overflow
                            ...(isRightEdge
                                ? { right: 'calc(100% + 12px)' }
                                : { left: 'calc(100% + 12px)' }),
                            minWidth: '200px',
                            maxWidth: '240px',
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: 'rgba(12,11,38,0.97)',
                            border: `1.5px solid ${spineColor}40`,
                            boxShadow: `0 12px 48px rgba(0,0,0,0.7), 0 0 30px ${spineColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
                            backdropFilter: 'blur(20px)',
                            pointerEvents: 'auto',
                            zIndex: 200,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* R4-FIX: Arrow points toward the book (left or right depending on edge) */}
                        <div style={{
                            position: 'absolute', top: '16px',
                            ...(isRightEdge
                                ? { right: '-6px', transform: 'rotate(45deg)', borderRight: `1.5px solid ${spineColor}40`, borderTop: `1.5px solid ${spineColor}40` }
                                : { left: '-6px', transform: 'rotate(45deg)', borderLeft: `1.5px solid ${spineColor}40`, borderBottom: `1.5px solid ${spineColor}40` }),
                            width: '10px', height: '10px',
                            background: 'rgba(12,11,38,0.97)',
                        }} />

                        {/* Subject badge */}
                        {subject && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 8px', borderRadius: '6px', marginBottom: '8px',
                                background: `${subject.color}15`, border: `1px solid ${subject.color}30`,
                                fontSize: '9px', fontWeight: 700, color: subject.color,
                                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
                            }}>
                                {subject.emoji} {subject.name}
                            </div>
                        )}

                        {/* Title */}
                        <p style={{
                            fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.3,
                            marginBottom: '6px', textShadow: `0 0 10px ${spineColor}40`,
                        }}>
                            {book.title}
                        </p>

                        {/* Author */}
                        {book.author && (
                            <p style={{
                                fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
                                marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                                <User size={10} style={{ opacity: 0.6 }} /> {book.author}
                            </p>
                        )}

                        {/* Publisher */}
                        {book.publisher && (
                            <p style={{
                                fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
                                marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                                <Building2 size={10} style={{ opacity: 0.5 }} /> {book.publisher}
                            </p>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                                style={{
                                    flex: 1, padding: '6px 10px', borderRadius: '8px',
                                    background: `${spineColor}15`, border: `1px solid ${spineColor}30`,
                                    color: spineColor, fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = `${spineColor}30`; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = `${spineColor}15`; }}
                            >
                                <Pencil size={10} /> Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                                style={{
                                    flex: 1, padding: '6px 10px', borderRadius: '8px',
                                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                                    color: '#f87171', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; }}
                            >
                                <Trash2 size={10} /> Remove
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ─── Bookshelf Row ─── */
function BookshelfRow({ books, onEdit, onDelete, subjectColor, shelfIndex }) {
    return (
        <div className="bookshelf-row" style={{ position: 'relative', marginBottom: '12px' }}>
            {/* Books standing on shelf */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '6px',
                padding: '0 20px 0 16px',
                minHeight: '200px',
                flexWrap: 'wrap',
            }}>
                <AnimatePresence mode="popLayout">
                    {books.map((book, i) => (
                        <BookSpine
                            key={book.id}
                            book={book}
                            index={i + shelfIndex * 10}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            subjectColor={subjectColor}
                            isRightEdge={i >= books.length - 2}
                        />
                    ))}
                </AnimatePresence>

                {books.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '140px',
                            gap: '8px',
                        }}
                    >
                        <BookOpen size={28} style={{ color: 'rgba(255,255,255,0.12)' }} />
                        <p style={{
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.25)',
                            fontWeight: 600,
                        }}>
                            No books on this shelf yet
                        </p>
                    </motion.div>
                )}
            </div>

            {/* ── Physical shelf plank ── */}
            <div style={{
                height: '12px',
                background: 'linear-gradient(180deg, #3d2b1f 0%, #2a1d14 40%, #1a1108 100%)',
                borderRadius: '0 0 4px 4px',
                boxShadow: `
                    0 4px 12px rgba(0,0,0,0.5),
                    0 2px 4px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.08),
                    inset 0 -1px 0 rgba(0,0,0,0.3)
                `,
                position: 'relative',
            }}>
                {/* Wood grain texture lines */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '0 0 4px 4px',
                    background: `repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 30px,
                        rgba(255,255,255,0.02) 30px,
                        rgba(255,255,255,0.02) 31px
                    )`,
                }} />
            </div>

            {/* Shelf bracket left */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '8px',
                width: '6px',
                height: '20px',
                background: 'linear-gradient(180deg, #3d2b1f, #1a1108)',
                borderRadius: '0 0 2px 2px',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.4)',
            }} />
            {/* Shelf bracket right */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                right: '8px',
                width: '6px',
                height: '20px',
                background: 'linear-gradient(180deg, #3d2b1f, #1a1108)',
                borderRadius: '0 0 2px 2px',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.4)',
            }} />
        </div>
    );
}

/* ─── Add / Edit Book Modal ─── */
function BookModal({ open, onClose, book, subjectId, subjectColor }) {
    const { addBook, updateBook } = useBookActions();
    const isEditing = !!book;
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(subjectId || 'physics');

    useEffect(() => {
        if (!open) return;
        if (book) {
            setTitle(book.title || '');
            setAuthor(book.author || '');
            setPublisher(book.publisher || '');
            setSelectedSubject(book.subject_id || subjectId || 'physics');
        } else {
            setTitle('');
            setAuthor('');
            setPublisher('');
            setSelectedSubject(subjectId || 'physics');
        }
    }, [open, book, subjectId]);

    const currentSubject = SUBJECTS.find(s => s.id === selectedSubject) || SUBJECTS[0];
    const accentColor = isEditing ? subjectColor : currentSubject?.color || '#8b5cf6';

    const handleSave = () => {
        if (!title.trim()) return;
        if (isEditing) {
            updateBook(book.id, {
                title: title.trim(),
                author: author.trim(),
                publisher: publisher.trim(),
            });
        } else {
            addBook({
                id: crypto.randomUUID(),
                subject_id: selectedSubject,
                title: title.trim(),
                author: author.trim(),
                publisher: publisher.trim(),
                created_at: new Date().toISOString(),
            });
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent
                className="sm:max-w-[440px] backdrop-blur-2xl"
                style={{
                    background: 'rgba(12,11,38,0.96)',
                    border: `1.5px solid ${accentColor}35`,
                    boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${accentColor}12`,
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{
                                background: `${accentColor}15`,
                                border: `1px solid ${accentColor}25`,
                                boxShadow: `0 0 16px ${accentColor}12`,
                            }}
                        >
                            📕
                        </div>
                        <div>
                            <span style={{ color: accentColor }} className="font-extrabold text-base">
                                {isEditing ? 'Edit Book' : 'Add Book'}
                            </span>
                            <p className="text-[10px] text-zinc-400 font-medium mono tracking-wider mt-0.5">
                                {currentSubject?.name || 'LIBRARY'} • {isEditing ? 'MODIFY' : 'NEW ENTRY'}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                    {/* Subject Selector — only for new books */}
                    {!isEditing && (
                        <div>
                            <Label className="text-zinc-400 mono text-[10px] font-bold uppercase tracking-[0.12em]">
                                Subject
                            </Label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {SUBJECTS.map(s => {
                                    const isActive = selectedSubject === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSelectedSubject(s.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200"
                                            style={{
                                                color: isActive ? s.color : 'rgba(255,255,255,0.4)',
                                                background: isActive ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                                                border: `1.5px solid ${isActive ? `${s.color}50` : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: isActive ? `0 0 12px ${s.color}15` : 'none',
                                            }}
                                        >
                                            <span className="text-sm">{s.emoji}</span>
                                            {s.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <Label className="text-zinc-400 mono text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5">
                            <BookOpen size={11} /> Title
                        </Label>
                        <Input
                            placeholder="e.g., HC Verma Vol 1, NCERT Physics..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1.5 h-11 text-[14px] font-semibold text-zinc-100 placeholder:text-zinc-500"
                            style={{
                                background: `${accentColor}06`,
                                border: `1.5px solid ${accentColor}20`,
                                borderRadius: '12px',
                            }}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSave(); }}
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-400 mono text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5">
                            <User size={11} /> Author
                        </Label>
                        <Input
                            placeholder="e.g., H.C. Verma, R.D. Sharma..."
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="mt-1.5 h-10 text-[13px] font-medium text-zinc-200 placeholder:text-zinc-500"
                            style={{
                                background: `${accentColor}04`,
                                border: `1.5px solid ${accentColor}15`,
                                borderRadius: '12px',
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSave(); }}
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-400 mono text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5">
                            <Building2 size={11} /> Publisher
                        </Label>
                        <Input
                            placeholder="e.g., Bharati Bhawan, S. Chand..."
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="mt-1.5 h-10 text-[13px] font-medium text-zinc-200 placeholder:text-zinc-500"
                            style={{
                                background: `${accentColor}04`,
                                border: `1.5px solid ${accentColor}15`,
                                borderRadius: '12px',
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSave(); }}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-3">
                    <Button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="font-extrabold tracking-wider text-white text-xs h-10 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}90)`,
                            boxShadow: `0 4px 20px ${accentColor}30`,
                        }}
                    >
                        {isEditing ? (
                            <><Pencil size={14} className="mr-1.5" /> SAVE CHANGES</>
                        ) : (
                            <><Plus size={14} className="mr-1.5" /> ADD TO SHELF</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Subject Tab ─── */
function SubjectTab({ subject, active, onClick, bookCount }) {
    return (
        <motion.button
            onClick={onClick}
            className="relative px-4 py-2.5 rounded-xl text-[12px] font-extrabold mono tracking-wider transition-all duration-200"
            style={{
                color: active ? subject.color : 'rgba(255,255,255,0.35)',
                background: active ? `${subject.color}12` : 'transparent',
                border: `1.5px solid ${active ? `${subject.color}40` : 'transparent'}`,
                boxShadow: active ? `0 0 20px ${subject.color}10, inset 0 0 12px ${subject.color}06` : 'none',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.color = subject.color;
                    e.currentTarget.style.background = `${subject.color}08`;
                    e.currentTarget.style.borderColor = `${subject.color}20`;
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                }
            }}
        >
            <span className="text-base mr-1.5">{subject.emoji}</span>
            {subject.name}
            {bookCount > 0 && (
                <Badge
                    variant="outline"
                    className="ml-2 text-[8px] px-1.5 py-0 border-white/10 mono"
                    style={{ color: subject.color }}
                >
                    {bookCount}
                </Badge>
            )}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${subject.color}, transparent)`,
                        boxShadow: `0 0 8px ${subject.color}60`,
                    }}
                    transition={{ duration: 0.3, ease: [0.23, 1.0, 0.32, 1.0] }}
                />
            )}
        </motion.button>
    );
}

/* ─── "All" Tab ─── */
function AllTab({ active, onClick, totalBooks }) {
    return (
        <motion.button
            onClick={onClick}
            className="relative px-4 py-2.5 rounded-xl text-[12px] font-extrabold mono tracking-wider transition-all duration-200"
            style={{
                color: active ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                border: `1.5px solid ${active ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                boxShadow: active ? '0 0 20px rgba(139,92,246,0.1)' : 'none',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
        >
            <Library size={14} className="inline mr-1.5" style={{ verticalAlign: '-2px' }} />
            All Books
            {totalBooks > 0 && (
                <Badge variant="outline" className="ml-2 text-[8px] px-1.5 py-0 border-white/10 mono text-violet-400">
                    {totalBooks}
                </Badge>
            )}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-px left-3 right-3 h-[2px] rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
                        boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                    }}
                    transition={{ duration: 0.3, ease: [0.23, 1.0, 0.32, 1.0] }}
                />
            )}
        </motion.button>
    );
}


/* ─── Main Library Page ─── */
export default function LibraryPage() {
    const allBooks = useAtomValue(booksAtom) || [];
    const { deleteBook } = useBookActions();
    const [activeSubject, setActiveSubject] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    const filteredBooks = useMemo(() => {
        if (activeSubject === 'all') return allBooks;
        return allBooks.filter(b => b.subject_id === activeSubject);
    }, [allBooks, activeSubject]);

    // Group books into shelves (max ~8 per shelf for visual balance)
    const BOOKS_PER_SHELF = 8;
    const shelves = useMemo(() => {
        const result = [];
        for (let i = 0; i < filteredBooks.length; i += BOOKS_PER_SHELF) {
            result.push(filteredBooks.slice(i, i + BOOKS_PER_SHELF));
        }
        if (result.length === 0) result.push([]);
        return result;
    }, [filteredBooks]);

    const activeSubjectData = SUBJECTS.find(s => s.id === activeSubject);
    const activeColor = activeSubjectData?.color || '#8b5cf6';

    const handleEdit = (book) => {
        setEditingBook(book);
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        deleteBook(id);
    };

    const handleAdd = () => {
        setEditingBook(null);
        setModalOpen(true);
    };

    const bookCountBySubject = useMemo(() => {
        const counts = {};
        for (const b of allBooks) {
            counts[b.subject_id] = (counts[b.subject_id] || 0) + 1;
        }
        return counts;
    }, [allBooks]);

    return (
        <PageTransition>
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(244,114,182,0.15))',
                            border: '1px solid rgba(139,92,246,0.25)',
                            boxShadow: '0 0 20px rgba(139,92,246,0.15)',
                        }}
                    >
                        <Library size={20} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-zinc-100 tracking-tight">My Library</h1>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] mono text-zinc-400">
                            📚 {allBooks.length} {allBooks.length === 1 ? 'Book' : 'Books'} across {SUBJECTS.length} subjects
                        </p>
                    </div>
                </div>

                <Button
                    size="sm"
                    className="h-8 text-xs font-extrabold tracking-wider bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/25 hover:border-violet-500/40 transition-all duration-200 hover:scale-105"
                    onClick={handleAdd}
                >
                    <Plus size={14} className="mr-1" /> ADD BOOK
                </Button>
            </div>

            {/* ─── Subject Tabs ─── */}
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 custom-scrollbar"
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <AllTab
                    active={activeSubject === 'all'}
                    onClick={() => setActiveSubject('all')}
                    totalBooks={allBooks.length}
                />
                {SUBJECTS.map(subject => (
                    <SubjectTab
                        key={subject.id}
                        subject={subject}
                        active={activeSubject === subject.id}
                        onClick={() => setActiveSubject(subject.id)}
                        bookCount={bookCountBySubject[subject.id] || 0}
                    />
                ))}
            </div>

            {/* ─── Bookshelf Container ─── */}
            <motion.div
                className="library-bookcase"
                style={{
                    background: `
                        linear-gradient(180deg, rgba(30,20,15,0.3) 0%, rgba(20,14,10,0.5) 100%),
                        radial-gradient(ellipse 80% 40% at 50% 0%, ${activeColor}08, transparent 60%)
                    `,
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '20px 12px 24px',
                    minHeight: '400px',
                    position: 'relative',
                    overflow: 'visible',
                    boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.04),
                        0 8px 32px rgba(0,0,0,0.3)
                    `,
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Ambient glow */}
                <div style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '300px',
                    height: '100px',
                    background: `radial-gradient(ellipse, ${activeColor}12, transparent 70%)`,
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                }} />

                {/* Bookshelf label */}
                <div className="flex items-center justify-between mb-3 px-3">
                    <p className="mono text-[9px] font-extrabold uppercase tracking-[0.2em]"
                        style={{ color: `${activeColor}80`, textShadow: `0 0 12px ${activeColor}30` }}
                    >
                        {activeSubject === 'all' ? '📚 Complete Collection' : `${activeSubjectData?.emoji || '📚'} ${activeSubjectData?.name || ''} Shelf`}
                    </p>
                    <p className="mono text-[9px] font-bold tracking-wider text-zinc-500">
                        {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
                    </p>
                </div>

                {/* Shelves */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSubject}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >
                        {shelves.map((shelfBooks, i) => (
                            <BookshelfRow
                                key={`shelf-${i}`}
                                books={shelfBooks}
                                shelfIndex={i}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                subjectColor={activeColor}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Add book shortcut on empty shelf */}
                {filteredBooks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center mt-2"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-[11px] font-extrabold mono tracking-widest border border-dashed rounded-xl hover:scale-[1.03] transition-all duration-200"
                            style={{
                                color: activeColor,
                                borderColor: `${activeColor}30`,
                                background: `${activeColor}06`,
                            }}
                            onClick={handleAdd}
                        >
                            <Plus size={14} className="mr-1.5" /> ADD YOUR FIRST BOOK
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            {/* ─── Book Modal ─── */}
            <BookModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingBook(null); }}
                book={editingBook}
                subjectId={editingBook?.subject_id || (activeSubject !== 'all' ? activeSubject : 'physics')}
                subjectColor={editingBook
                    ? SUBJECTS.find(s => s.id === editingBook.subject_id)?.color
                    : (activeSubject !== 'all'
                        ? SUBJECTS.find(s => s.id === activeSubject)?.color
                        : '#8b5cf6')
                }
            />
        </PageTransition>
    );
}
