'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { supabase } from './supabase';
import dayjs from 'dayjs';

// ─── Supabase Helpers ────────────────────────────────────────
const debounceTimers = {};
function debounce(key, fn, ms = 300) {
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(fn, ms);
}

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
];

// ─── Base Atoms (persisted to localStorage) ──────────────────
export const tasksAtom = atomWithStorage('dp-tasks', []);
export const chaptersAtom = atomWithStorage('dp-chapters', []);

// ─── UI Atoms ────────────────────────────────────────────────
export const sidebarCollapsedAtom = atomWithStorage('dp-sidebar-collapsed', false);
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

// ─── Task Actions Hook ───────────────────────────────────────
export function useTaskActions() {
    const [tasks, setTasks] = useAtom(tasksAtom);

    const addTask = (task) => {
        setTasks((prev) => [...prev, task]);
        debounce(`task-add-${task.id}`, () => dbUpsert('tasks', task));
    };

    const updateTask = (id, updates) => {
        const updated = { ...updates, updated_at: new Date().toISOString() };
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updated } : t));
        debounce(`task-upd-${id}`, () => {
            // Re-read from current state after debounce
            const current = tasks.find((t) => t.id === id);
            if (current) dbUpsert('tasks', { ...current, ...updated });
        });
    };

    const deleteTask = (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        dbDelete('tasks', id);
    };

    const moveTask = (id, newDate, newStartTime, newEndTime) => {
        const updated = { date: newDate, start_time: newStartTime, end_time: newEndTime, updated_at: new Date().toISOString() };
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updated } : t));
        debounce(`task-move-${id}`, () => {
            const current = tasks.find((t) => t.id === id);
            if (current) dbUpsert('tasks', { ...current, ...updated });
        });
    };

    const getTasksForDate = (date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return (tasks || []).filter((t) => t.date === dateStr);
    };

    const getTasksForWeek = (weekStart) => {
        const start = dayjs(weekStart).startOf('day');
        const end = start.add(6, 'day').endOf('day');
        return (tasks || []).filter((t) => {
            const taskDate = dayjs(t.date);
            return taskDate.isAfter(start.subtract(1, 'day')) && taskDate.isBefore(end.add(1, 'day'));
        });
    };

    const getBacklogs = () => {
        return (tasks || []).filter((t) => t.is_backlog || (
            t.status !== 'done' && t.status !== 'skipped' &&
            dayjs(t.date).isBefore(dayjs(), 'day')
        ));
    };

    return { tasks, addTask, updateTask, deleteTask, moveTask, getTasksForDate, getTasksForWeek, getBacklogs };
}


// ─── Chapter Actions Hook ────────────────────────────────────
export function useChapterActions() {
    const [chapters, setChapters] = useAtom(chaptersAtom);

    const addChapter = (chapter) => {
        setChapters((prev) => [...prev, chapter]);
        debounce(`ch-add-${chapter.id}`, () => dbUpsert('chapters', chapter));
    };

    const updateChapter = (id, updates) => {
        setChapters((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
        debounce(`ch-upd-${id}`, () => {
            const c = chapters.find((x) => x.id === id);
            if (c) dbUpsert('chapters', { ...c, ...updates });
        });
    };

    const deleteChapter = (id) => {
        setChapters((prev) => prev.filter((c) => c.id !== id));
        dbDelete('chapters', id);
    };

    const getChaptersBySubject = (subjectId) => {
        return (chapters || []).filter((c) => c.subject_id === subjectId);
    };

    return { chapters, addChapter, updateChapter, deleteChapter, getChaptersBySubject };
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

// ─── Hydrate from Supabase (non-blocking) ────────────────────
export async function hydrateFromSupabase(setTasks, setChapters) {
    if (!supabase) return;
    try {
        const [tasksData, chaptersData] = await Promise.all([
            dbFetchAll('tasks'),
            dbFetchAll('chapters'),
        ]);
        if (tasksData && tasksData.length > 0) setTasks(tasksData);
        if (chaptersData && chaptersData.length > 0) setChapters(chaptersData);
    } catch (e) {
        console.warn('[DB] hydration failed, using localStorage fallback:', e.message);
    }
}
