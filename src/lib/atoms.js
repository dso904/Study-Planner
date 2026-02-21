'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { timerLinkedTaskAtom } from './timer-atoms';
import { useRef, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { toast } from 'sonner';
dayjs.extend(isoWeek);

// ─── Supabase Helpers ────────────────────────────────────────
// Cloud-Only: all mutations update React state (optimistic UI), then push to Supabase.
// No localStorage caching — data is always fetched fresh from the database on load.

async function dbUpsert(table, data) {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
        if (error) {
            console.warn(`[DB] upsert ${table}:`, error.message);
            toast.error(`Failed to save to ${table}`, { description: error.message });
            return false;
        }
        return true;
    } catch (e) {
        console.warn(`[DB] upsert ${table} failed:`, e.message);
        toast.error(`Network error saving to ${table}`, { description: e.message });
        return false;
    }
}

async function dbDelete(table, id) {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.warn(`[DB] delete ${table}:`, error.message);
            toast.error(`Failed to delete from ${table}`, { description: error.message });
            return false;
        }
        return true;
    } catch (e) {
        console.warn(`[DB] delete ${table} failed:`, e.message);
        toast.error(`Network error deleting from ${table}`, { description: e.message });
        return false;
    }
}

// L6-FIX: Make the 180-day cutoff explicit via logging and documentation
// Note: Tasks older than `daysBack` days are NOT fetched from the server.
// If the user needs historical data beyond this window, increase the value.
async function dbFetchTasks(daysBack = 180) {
    if (!supabase) return null;
    try {
        const cutoff = dayjs().subtract(daysBack, 'day').format('YYYY-MM-DD');
        console.info(`[DB] Fetching tasks from ${cutoff} onward (${daysBack}-day window, plus backlogs)`);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .or(`date.gte.${cutoff},is_backlog.eq.true`)
            .order('created_at', { ascending: true });
        if (error) { console.warn(`[DB] fetch tasks:`, error.message); return null; }
        return Array.isArray(data) ? data : null;
    } catch (e) {
        console.warn(`[DB] fetch tasks failed:`, e.message);
        return null;
    }
}

async function dbFetchAll(table, orderBy = 'created_at') {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: true });
        if (error) { console.warn(`[DB] fetch ${table}:`, error.message); return null; }
        return Array.isArray(data) ? data : null;
    } catch (e) {
        console.warn(`[DB] fetch ${table} failed:`, e.message);
        return null;
    }
}

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

// Global debounce mapping to prevent concurrent UI components from stepping on each other's Supabase network calls
const globalDebounce = {
    tasks: {},
    chapters: {},
    notes: {}
};

// ─── Task Actions Hook (Cloud-Only) ──────────────────────────
export function useTaskActions() {
    const [tasks, setTasks] = useAtom(tasksAtom);
    const [linkedTask, setLinkedTask] = useAtom(timerLinkedTaskAtom);
    const tasksRef = useRef(tasks);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);

    const addTask = useCallback((task) => {
        const record = { ...task, updated_at: task.updated_at || new Date().toISOString() };
        setTasks((prev) => [...prev, record]);
        dbUpsert('tasks', record);
    }, [setTasks]);

    const updateTask = useCallback((id, updates) => {
        const updated = { ...updates, updated_at: new Date().toISOString() };
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updated } : t));
        // Read latest from ref to push complete record to cloud
        if (globalDebounce.tasks[id]) clearTimeout(globalDebounce.tasks[id]);

        globalDebounce.tasks[id] = setTimeout(() => {
            const current = tasksRef.current.find((t) => t.id === id);
            if (current) dbUpsert('tasks', current);
            delete globalDebounce.tasks[id];
        }, 500);
    }, [setTasks]);

    const deleteTask = useCallback((id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (linkedTask && linkedTask.id === id) {
            setLinkedTask(null);
        }
        dbDelete('tasks', id);
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
        dbUpsert('chapters', record);
    }, [setChapters]);

    const updateChapter = useCallback((id, updates) => {
        const updated = { ...updates, updated_at: new Date().toISOString() };
        setChapters((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c));
        if (globalDebounce.chapters[id]) clearTimeout(globalDebounce.chapters[id]);

        globalDebounce.chapters[id] = setTimeout(() => {
            const c = chaptersRef.current.find((x) => x.id === id);
            if (c) dbUpsert('chapters', c);
            delete globalDebounce.chapters[id];
        }, 500);
    }, [setChapters]);

    const deleteChapter = useCallback((id) => {
        setChapters((prev) => prev.filter((c) => c.id !== id));
        dbDelete('chapters', id);
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
        dbUpsert('notes', note);
    }, [setNotes]);

    const toggleNote = useCallback((id) => {
        setNotes((prev) => prev.map((n) =>
            n.id === id ? { ...n, done: !n.done, updated_at: new Date().toISOString() } : n
        ));
        if (globalDebounce.notes[id]) clearTimeout(globalDebounce.notes[id]);

        globalDebounce.notes[id] = setTimeout(() => {
            const note = notesRef.current.find((n) => n.id === id);
            if (note) dbUpsert('notes', note);
            delete globalDebounce.notes[id];
        }, 500);
    }, [setNotes]);

    const deleteNote = useCallback((id) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        dbDelete('notes', id);
    }, [setNotes]);

    const editNote = useCallback((id, text) => {
        const updated_at = new Date().toISOString();
        setNotes((prev) => prev.map((n) =>
            n.id === id ? { ...n, text, updated_at } : n
        ));
        if (globalDebounce.notes[id]) clearTimeout(globalDebounce.notes[id]);

        globalDebounce.notes[id] = setTimeout(() => {
            const note = notesRef.current.find((n) => n.id === id);
            if (note) dbUpsert('notes', note);
            delete globalDebounce.notes[id];
        }, 1000);
    }, [setNotes]);

    return { notes, addNote, toggleNote, deleteNote, editNote };
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

// ─── Load from Supabase (Cloud-Only) ─────────────────────────
export async function loadFromSupabase(setTasks, setChapters, setNotes) {
    if (!supabase) return;
    try {
        const [serverTasks, serverChapters, serverNotes] = await Promise.all([
            dbFetchTasks(180),
            dbFetchAll('chapters'),
            dbFetchAll('notes'),
        ]);

        if (serverTasks) setTasks(serverTasks);
        if (serverChapters) setChapters(serverChapters);
        if (serverNotes) setNotes(serverNotes);
    } catch (e) {
        console.warn('[DB] Failed to load data from Supabase:', e.message);
    }
}
