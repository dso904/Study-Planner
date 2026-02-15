'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useRef, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import dayjs from 'dayjs';

// ─── Supabase Helpers ────────────────────────────────────────
// Cloud-first: all mutations write to Supabase FIRST, then update local state.
// localStorage is only a cache for instant hydration on load.

async function dbUpsert(table, data) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
        if (error) console.warn(`[DB] upsert ${table}:`, error.message);
    } catch (e) {
        console.warn(`[DB] upsert ${table} failed:`, e.message);
    }
}

async function dbDelete(table, id) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.warn(`[DB] delete ${table}:`, error.message);
    } catch (e) {
        console.warn(`[DB] delete ${table} failed:`, e.message);
    }
}

async function dbFetchTasks(daysBack = 180) {
    if (!supabase) return null;
    try {
        const cutoff = dayjs().subtract(daysBack, 'day').format('YYYY-MM-DD');
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .gte('date', cutoff)
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
    { id: 'physics', name: 'Physics', emoji: '⚛️', icon: '🔬', color: '#22d3ee' },
    { id: 'chemistry', name: 'Chemistry', emoji: '🧪', icon: '⚗️', color: '#f472b6' },
    { id: 'maths', name: 'Maths', emoji: '📐', icon: '🧮', color: '#fb923c' },
    { id: 'biology', name: 'Biology', emoji: '🧬', icon: '🌿', color: '#34d399' },
    { id: 'english', name: 'English', emoji: '📝', icon: '📖', color: '#a78bfa' },
];

// ─── Base Atoms (localStorage = cache only) ──────────────────
export const tasksAtom = atomWithStorage('dp-tasks', []);
export const chaptersAtom = atomWithStorage('dp-chapters', []);
export const notesAtom = atomWithStorage('dp-notes', []);

// ─── UI Atoms ────────────────────────────────────────────────
export const sidebarCollapsedAtom = atomWithStorage('dp-sidebar-collapsed', false);
export const notesPanelOpenAtom = atom(false);
export const currentWeekStartAtom = atom(
    dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
);

// ─── Schedule Config ─────────────────────────────────────────
export const SCHEDULE = {
    slotDuration: 60,
    dayStartHour: 6,
    dayEndHour: 24,
    weekStartDay: 1,
};

// ─── Task Actions Hook (Cloud-First) ─────────────────────────
export function useTaskActions() {
    const [tasks, setTasks] = useAtom(tasksAtom);
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
        setTimeout(() => {
            const current = tasksRef.current.find((t) => t.id === id);
            if (current) dbUpsert('tasks', current);
        }, 50);
    }, [setTasks]);

    const deleteTask = useCallback((id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        dbDelete('tasks', id);
    }, [setTasks]);

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

// ─── Chapter Actions Hook (Cloud-First) ──────────────────────
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
        setTimeout(() => {
            const c = chaptersRef.current.find((x) => x.id === id);
            if (c) dbUpsert('chapters', c);
        }, 50);
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

// ─── Note Actions Hook (Cloud-First) ─────────────────────────
export function useNoteActions() {
    const [notes, setNotes] = useAtom(notesAtom);

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
        // Read latest after state update
        setTimeout(() => {
            const stored = JSON.parse(localStorage.getItem('dp-notes') || '[]');
            const note = stored.find((n) => n.id === id);
            if (note) dbUpsert('notes', note);
        }, 50);
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
        setTimeout(() => {
            const stored = JSON.parse(localStorage.getItem('dp-notes') || '[]');
            const note = stored.find((n) => n.id === id);
            if (note) dbUpsert('notes', note);
        }, 50);
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
        setCurrentWeekStart(dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'));
    };

    return { currentWeekStart, setCurrentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek };
}

// ─── Conflict Resolution ─────────────────────────────────────
function mergeRecords(localRecords, serverRecords) {
    const serverMap = new Map();
    for (const s of serverRecords) serverMap.set(s.id, s);

    const localMap = new Map();
    for (const l of localRecords) localMap.set(l.id, l);

    const merged = [];
    const toSyncUp = [];

    for (const local of localRecords) {
        const server = serverMap.get(local.id);
        if (!server) {
            merged.push(local);
            toSyncUp.push(local);
        } else {
            const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
            const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
            if (serverTime > localTime) {
                merged.push(server);
            } else {
                merged.push(local);
                if (localTime > serverTime) toSyncUp.push(local);
            }
        }
    }

    for (const server of serverRecords) {
        if (!localMap.has(server.id)) merged.push(server);
    }

    return { merged, toSyncUp };
}

// ─── Hydrate from Supabase (Cloud → Local merge) ────────────
export async function hydrateFromSupabase(setTasks, setChapters, setNotes, getLocalTasks, getLocalChapters, getLocalNotes) {
    if (!supabase) return;
    try {
        const [serverTasks, serverChapters, serverNotes] = await Promise.all([
            dbFetchTasks(180),
            dbFetchAll('chapters'),
            dbFetchAll('notes'),
        ]);

        if (serverTasks) {
            const { merged, toSyncUp } = mergeRecords(getLocalTasks(), serverTasks);
            setTasks(merged);
            for (const t of toSyncUp) dbUpsert('tasks', t);
            if (toSyncUp.length) console.info(`[Sync] Pushed ${toSyncUp.length} local tasks to cloud`);
        }

        if (serverChapters) {
            const { merged, toSyncUp } = mergeRecords(getLocalChapters(), serverChapters);
            setChapters(merged);
            for (const c of toSyncUp) dbUpsert('chapters', c);
            if (toSyncUp.length) console.info(`[Sync] Pushed ${toSyncUp.length} local chapters to cloud`);
        }

        if (serverNotes) {
            const { merged, toSyncUp } = mergeRecords(getLocalNotes(), serverNotes);
            setNotes(merged);
            for (const n of toSyncUp) dbUpsert('notes', n);
            if (toSyncUp.length) console.info(`[Sync] Pushed ${toSyncUp.length} local notes to cloud`);
        }
    } catch (e) {
        console.warn('[DB] hydration failed, using localStorage fallback:', e.message);
    }
}
