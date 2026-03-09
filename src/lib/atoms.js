'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { timerLinkedTaskAtom } from './timer-atoms';
import { useRef, useEffect, useCallback } from 'react';
import { apiFetch, apiUpsert, apiDelete } from './api';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { toast } from 'sonner';
dayjs.extend(isoWeek);

// ─── Hardcoded Subjects ──────────────────────────────────────
export const SUBJECTS = [
    { id: 'physics', name: 'Physics', emoji: '⚛️', icon: '🔬', color: '#facc15' },
    { id: 'chemistry', name: 'Chemistry', emoji: '🧪', icon: '⚗️', color: '#f472b6' },
    { id: 'maths', name: 'Maths', emoji: '📐', icon: '🧮', color: '#ef4444' },
    { id: 'biology', name: 'Biology', emoji: '🧬', icon: '🌿', color: '#34d399' },
    { id: 'english', name: 'English', emoji: '📝', icon: '📖', color: '#60a5fa' },
];

// I1-FIX: Single source of truth for subject colors — derive from SUBJECTS
export const SUBJECT_COLOR_MAP = Object.fromEntries(
    SUBJECTS.map((s) => [s.id, s.color])
);
const DEFAULT_SUBJECT_COLOR = '#8b5cf6';

/** Get a subject's color by its id. Returns a default purple if not found. */
export function getSubjectColorById(subjectId) {
    return SUBJECT_COLOR_MAP[subjectId] || DEFAULT_SUBJECT_COLOR;
}

// ─── Base Atoms (Cloud-Only — no localStorage) ──────────────
export const tasksAtom = atom([]);
export const chaptersAtom = atom([]);
export const notesAtom = atom([]);
export const booksAtom = atom([]);

// Track loading status so UI can show loading indicators
// Values: 'idle' | 'loading' | 'done' | 'error'
export const hydrationStatusAtom = atom('idle');

// ─── UI Atoms ────────────────────────────────────────────────
export const sidebarCollapsedAtom = atomWithStorage('dp-sidebar-collapsed', false);
export const notesPanelOpenAtom = atom(false);
export const currentWeekStartAtom = atom(
    dayjs().startOf('isoWeek').format('YYYY-MM-DD')
);

// ─── Schedule Config ─────────────────────────────────────────
export const SCHEDULE = {
    slotDuration: 60,
    dayStartHour: 6,
    dayEndHour: 24,
    weekStartDay: 1,
};

// Global debounce mapping to prevent concurrent UI components from stepping on each other's network calls
const globalDebounce = {
    tasks: {},
    chapters: {},
    notes: {},
    books: {}
};

// M10-FIX: Cancel all pending debounced API calls (called before data reload to prevent stale pushes)
function clearAllDebounce() {
    for (const table of Object.keys(globalDebounce)) {
        for (const id of Object.keys(globalDebounce[table])) {
            clearTimeout(globalDebounce[table][id]);
            delete globalDebounce[table][id];
        }
    }
}

// ─── Task Actions Hook (Cloud-Only) ──────────────────────────
export function useTaskActions() {
    const [tasks, setTasks] = useAtom(tasksAtom);
    const [linkedTask, setLinkedTask] = useAtom(timerLinkedTaskAtom);
    const tasksRef = useRef(tasks);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);

    const addTask = useCallback((task) => {
        const record = { ...task, updated_at: task.updated_at || new Date().toISOString() };
        // H5-FIX: Prevent duplicate task IDs (guards against double-clicks or stale replays)
        setTasks((prev) => prev.some((t) => t.id === record.id) ? prev : [...prev, record]);
        apiUpsert('tasks', record);
    }, [setTasks]);

    // H2-FIX: Support function updater pattern: updateTask(id, (currentTask) => updates)
    // This ensures the latest task state is read at update time, preventing stale overwrites.
    const updateTask = useCallback((id, updatesOrFn) => {
        // UX-F FIX: Capture the fully-merged record at SET time (inside React's batch),
        // so the debounced cloud push always has the latest truth even if React hasn't
        // flushed tasksRef.current yet.
        let mergedRecord = null;
        setTasks((prev) => prev.map((t) => {
            if (t.id !== id) return t;
            const updates = typeof updatesOrFn === 'function' ? updatesOrFn(t) : updatesOrFn;
            mergedRecord = { ...t, ...updates, updated_at: new Date().toISOString() };
            return mergedRecord;
        }));
        // Debounce the cloud push — uses the captured mergedRecord from above
        if (globalDebounce.tasks[id]) clearTimeout(globalDebounce.tasks[id]);

        globalDebounce.tasks[id] = setTimeout(() => {
            // Use captured record if available, fallback to ref
            const record = mergedRecord || tasksRef.current.find((t) => t.id === id);
            if (record) apiUpsert('tasks', record);
            delete globalDebounce.tasks[id];
        }, 500);
    }, [setTasks]);

    const deleteTask = useCallback((id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (linkedTask && linkedTask.id === id) {
            setLinkedTask(null);
        }
        apiDelete('tasks', id);
    }, [setTasks, linkedTask, setLinkedTask]);

    const getTasksForDate = useCallback((date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return (tasksRef.current || []).filter((t) => t.date === dateStr);
    }, []);

    const getTasksForWeek = useCallback((weekStart) => {
        const start = dayjs(weekStart).startOf('day');
        const end = start.add(6, 'day').endOf('day');
        return (tasksRef.current || []).filter((t) => {
            const taskDate = dayjs(t.date);
            return taskDate.isAfter(start.subtract(1, 'day')) && taskDate.isBefore(end.add(1, 'day'));
        });
    }, []);

    const getBacklogs = useCallback(() => {
        return (tasksRef.current || []).filter((t) => t.is_backlog || (
            t.status !== 'done' && t.status !== 'skipped' &&
            dayjs(t.date).isBefore(dayjs(), 'day')
        ));
    }, []);

    return { tasks, addTask, updateTask, deleteTask, getTasksForDate, getTasksForWeek, getBacklogs };
}

// ─── Chapter Actions Hook (Cloud-Only) ───────────────────────
export function useChapterActions() {
    const [chapters, setChapters] = useAtom(chaptersAtom);
    const chaptersRef = useRef(chapters);
    useEffect(() => { chaptersRef.current = chapters; }, [chapters]);

    const addChapter = useCallback((chapter) => {
        const record = { ...chapter, updated_at: new Date().toISOString() };
        setChapters((prev) => [...prev, record]);
        apiUpsert('chapters', record);
    }, [setChapters]);

    const updateChapter = useCallback((id, updates) => {
        const updated = { ...updates, updated_at: new Date().toISOString() };
        setChapters((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
        if (globalDebounce.chapters[id]) clearTimeout(globalDebounce.chapters[id]);

        globalDebounce.chapters[id] = setTimeout(() => {
            const c = chaptersRef.current.find((x) => x.id === id);
            if (c) apiUpsert('chapters', c);
            delete globalDebounce.chapters[id];
        }, 500);
    }, [setChapters]);

    const deleteChapter = useCallback((id) => {
        setChapters((prev) => prev.filter((c) => c.id !== id));
        apiDelete('chapters', id);
    }, [setChapters]);

    const getChaptersBySubject = useCallback((subjectId) => {
        return (chaptersRef.current || []).filter((c) => c.subject_id === subjectId);
    }, []);

    return { chapters, addChapter, updateChapter, deleteChapter, getChaptersBySubject };
}

// ─── Note Actions Hook (Cloud-Only) ──────────────────────────
export function useNoteActions() {
    const [notes, setNotes] = useAtom(notesAtom);
    const notesRef = useRef(notes);
    useEffect(() => { notesRef.current = notes; }, [notes]);

    const addNote = useCallback((text) => {
        const note = {
            id: crypto.randomUUID(),
            text,
            done: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setNotes((prev) => [note, ...prev]);
        apiUpsert('notes', note);
    }, [setNotes]);

    const toggleNote = useCallback((id) => {
        setNotes((prev) => prev.map((n) =>
            n.id === id ? { ...n, done: !n.done, updated_at: new Date().toISOString() } : n
        ));
        if (globalDebounce.notes[id]) clearTimeout(globalDebounce.notes[id]);

        globalDebounce.notes[id] = setTimeout(() => {
            const note = notesRef.current.find((n) => n.id === id);
            if (note) apiUpsert('notes', note);
            delete globalDebounce.notes[id];
        }, 500);
    }, [setNotes]);

    const deleteNote = useCallback((id) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        apiDelete('notes', id);
    }, [setNotes]);

    const editNote = useCallback((id, text) => {
        const updated_at = new Date().toISOString();
        setNotes((prev) => prev.map((n) =>
            n.id === id ? { ...n, text, updated_at } : n
        ));
        if (globalDebounce.notes[id]) clearTimeout(globalDebounce.notes[id]);

        globalDebounce.notes[id] = setTimeout(() => {
            const note = notesRef.current.find((n) => n.id === id);
            if (note) apiUpsert('notes', note);
            delete globalDebounce.notes[id];
        }, 1000);
    }, [setNotes]);

    return { notes, addNote, toggleNote, deleteNote, editNote };
}

// ─── Book Actions Hook (Cloud-Only) ──────────────────────────
export function useBookActions() {
    const [books, setBooks] = useAtom(booksAtom);
    const booksRef = useRef(books);
    useEffect(() => { booksRef.current = books; }, [books]);

    const addBook = useCallback((book) => {
        const record = { ...book, updated_at: book.updated_at || new Date().toISOString() };
        setBooks((prev) => [...prev, record]);
        apiUpsert('books', record);
    }, [setBooks]);

    const updateBook = useCallback((id, updates) => {
        const updated = { ...updates, updated_at: new Date().toISOString() };
        setBooks((prev) => prev.map((b) => b.id === id ? { ...b, ...updated } : b));
        if (globalDebounce.books[id]) clearTimeout(globalDebounce.books[id]);

        globalDebounce.books[id] = setTimeout(() => {
            const current = booksRef.current.find((b) => b.id === id);
            if (current) apiUpsert('books', current);
            delete globalDebounce.books[id];
        }, 500);
    }, [setBooks]);

    const deleteBook = useCallback((id) => {
        setBooks((prev) => prev.filter((b) => b.id !== id));
        apiDelete('books', id);
    }, [setBooks]);

    const getBooksBySubject = useCallback((subjectId) => {
        return (booksRef.current || []).filter((b) => b.subject_id === subjectId);
    }, []);

    return { books, addBook, updateBook, deleteBook, getBooksBySubject };
}

// ─── Week Navigation Hook ────────────────────────────────────
export function useWeekNavigation() {
    const [currentWeekStart, setCurrentWeekStart] = useAtom(currentWeekStartAtom);

    const goToPreviousWeek = () => {
        setCurrentWeekStart(dayjs(currentWeekStart).subtract(7, 'day').format('YYYY-MM-DD'));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(dayjs(currentWeekStart).add(7, 'day').format('YYYY-MM-DD'));
    };

    const goToThisWeek = () => {
        setCurrentWeekStart(dayjs().startOf('isoWeek').format('YYYY-MM-DD'));
    };

    return { currentWeekStart, setCurrentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek };
}

// ─── Load from Server (Cloud-Only) ───────────────────────────
export async function loadFromServer(setTasks, setChapters, setNotes, setBooks) {
    // M10-FIX: Cancel pending debounced writes before overwriting atoms with fresh server data
    clearAllDebounce();
    try {
        const [serverTasks, serverChapters, serverNotes, serverBooks] = await Promise.all([
            apiFetch('tasks', { daysBack: 180 }),
            apiFetch('chapters'),
            apiFetch('notes'),
            apiFetch('books'),
        ]);

        if (serverTasks) setTasks(serverTasks);
        if (serverChapters) setChapters(serverChapters);
        if (serverNotes) setNotes(serverNotes);
        if (serverBooks) setBooks(serverBooks);
    } catch (e) {
        console.warn('[API] Failed to load data from server:', e.message);
    }
}
