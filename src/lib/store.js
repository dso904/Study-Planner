import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import { supabase } from './supabase';

// ─── Supabase Helpers ────────────────────────────────────────
// Debounce writes to avoid hammering the API
const debounceTimers = {};
function debounce(key, fn, ms = 300) {
    clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(fn, ms);
}

async function dbUpsert(table, data) {
    if (!supabase) return;
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    if (error) console.warn(`[DB] upsert ${table}:`, error.message);
}

async function dbDelete(table, id) {
    if (!supabase) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[DB] delete ${table}:`, error.message);
}

async function dbFetchAll(table, orderBy = 'created_at') {
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: true });
    if (error) { console.warn(`[DB] fetch ${table}:`, error.message); return null; }
    return data;
}

// ─── Task Store ──────────────────────────────────────────────
export const useTaskStore = create(
    persist(
        (set, get) => ({
            tasks: [],
            loading: false,
            error: null,
            _hydrated: false,

            setTasks: (tasks) => set({ tasks }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            // Load from Supabase on app start
            hydrate: async () => {
                if (get()._hydrated) return;
                set({ loading: true });
                const data = await dbFetchAll('tasks');
                if (data) set({ tasks: data });
                set({ loading: false, _hydrated: true });
            },

            addTask: (task) => {
                set((state) => ({ tasks: [...state.tasks, task] }));
                debounce(`task-add-${task.id}`, () => dbUpsert('tasks', task));
            },

            updateTask: (id, updates) => {
                const updated = { ...updates, updated_at: new Date().toISOString() };
                set((state) => ({
                    tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updated } : t),
                }));
                debounce(`task-upd-${id}`, () => {
                    const task = get().tasks.find((t) => t.id === id);
                    if (task) dbUpsert('tasks', task);
                });
            },

            deleteTask: (id) => {
                set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
                dbDelete('tasks', id);
            },

            moveTask: (id, newDate, newStartTime, newEndTime) => {
                const updated = { date: newDate, start_time: newStartTime, end_time: newEndTime, updated_at: new Date().toISOString() };
                set((state) => ({
                    tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updated } : t),
                }));
                debounce(`task-move-${id}`, () => {
                    const task = get().tasks.find((t) => t.id === id);
                    if (task) dbUpsert('tasks', task);
                });
            },

            getTasksForDate: (date) => {
                const dateStr = dayjs(date).format('YYYY-MM-DD');
                return get().tasks.filter((t) => t.date === dateStr);
            },

            getTasksForWeek: (weekStart) => {
                const start = dayjs(weekStart).startOf('day');
                const end = start.add(6, 'day').endOf('day');
                return get().tasks.filter((t) => {
                    const taskDate = dayjs(t.date);
                    return taskDate.isAfter(start.subtract(1, 'day')) && taskDate.isBefore(end.add(1, 'day'));
                });
            },

            getBacklogs: () => {
                return get().tasks.filter((t) => t.is_backlog || (
                    t.status !== 'done' && t.status !== 'skipped' &&
                    dayjs(t.date).isBefore(dayjs(), 'day')
                ));
            },
        }),
        { name: 'dp-tasks', partialize: (state) => ({ tasks: state.tasks }) }
    )
);


// ─── Subject Store ───────────────────────────────────────────
export const useSubjectStore = create(
    persist(
        (set, get) => ({
            subjects: [],
            loading: false,
            _hydrated: false,

            setSubjects: (subjects) => set({ subjects }),
            setLoading: (loading) => set({ loading }),

            hydrate: async () => {
                if (get()._hydrated) return;
                set({ loading: true });
                const data = await dbFetchAll('subjects');
                if (data) set({ subjects: data });
                set({ loading: false, _hydrated: true });
            },

            addSubject: (subject) => {
                set((state) => ({ subjects: [...state.subjects, subject] }));
                debounce(`subj-add-${subject.id}`, () => dbUpsert('subjects', subject));
            },

            updateSubject: (id, updates) => {
                set((state) => ({
                    subjects: state.subjects.map((s) => s.id === id ? { ...s, ...updates } : s),
                }));
                debounce(`subj-upd-${id}`, () => {
                    const s = get().subjects.find((x) => x.id === id);
                    if (s) dbUpsert('subjects', s);
                });
            },

            deleteSubject: (id) => {
                set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
                dbDelete('subjects', id);
            },
        }),
        { name: 'dp-subjects', partialize: (state) => ({ subjects: state.subjects }) }
    )
);


// ─── Chapter Store ───────────────────────────────────────────
export const useChapterStore = create(
    persist(
        (set, get) => ({
            chapters: [],
            loading: false,
            _hydrated: false,

            setChapters: (chapters) => set({ chapters }),
            setLoading: (loading) => set({ loading }),

            hydrate: async () => {
                if (get()._hydrated) return;
                set({ loading: true });
                const data = await dbFetchAll('chapters');
                if (data) set({ chapters: data });
                set({ loading: false, _hydrated: true });
            },

            addChapter: (chapter) => {
                set((state) => ({ chapters: [...state.chapters, chapter] }));
                debounce(`ch-add-${chapter.id}`, () => dbUpsert('chapters', chapter));
            },

            updateChapter: (id, updates) => {
                set((state) => ({
                    chapters: state.chapters.map((c) => c.id === id ? { ...c, ...updates } : c),
                }));
                debounce(`ch-upd-${id}`, () => {
                    const c = get().chapters.find((x) => x.id === id);
                    if (c) dbUpsert('chapters', c);
                });
            },

            deleteChapter: (id) => {
                set((state) => ({ chapters: state.chapters.filter((c) => c.id !== id) }));
                dbDelete('chapters', id);
            },

            getChaptersBySubject: (subjectId) => {
                return get().chapters.filter((c) => c.subject_id === subjectId);
            },
        }),
        { name: 'dp-chapters', partialize: (state) => ({ chapters: state.chapters }) }
    )
);


// ─── Settings (hardcoded) ────────────────────────────────────
export const SCHEDULE = {
    slotDuration: 60,
    dayStartHour: 6,
    dayEndHour: 24,
    weekStartDay: 1,
};


// ─── UI Store ────────────────────────────────────────────────
export const useUIStore = create((set) => ({
    currentWeekStart: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),

    setCurrentWeekStart: (date) => set({ currentWeekStart: date }),

    goToPreviousWeek: () => set((state) => ({
        currentWeekStart: dayjs(state.currentWeekStart).subtract(7, 'day').format('YYYY-MM-DD'),
    })),

    goToNextWeek: () => set((state) => ({
        currentWeekStart: dayjs(state.currentWeekStart).add(7, 'day').format('YYYY-MM-DD'),
    })),

    goToThisWeek: () => set({
        currentWeekStart: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
    }),
}));


// ─── Hydrate all stores on app start ─────────────────────────
export async function hydrateAllStores() {
    await Promise.all([
        useTaskStore.getState().hydrate(),
        useSubjectStore.getState().hydrate(),
        useChapterStore.getState().hydrate(),
    ]);
}
