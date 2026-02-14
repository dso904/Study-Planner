import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

// ─── Task Store ──────────────────────────────────────────────
export const useTaskStore = create(
    persist(
        (set, get) => ({
            tasks: [],
            loading: false,
            error: null,

            setTasks: (tasks) => set({ tasks }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            addTask: (task) => set((state) => ({
                tasks: [...state.tasks, task],
            })),

            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
                ),
            })),

            deleteTask: (id) => set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== id),
            })),

            moveTask: (id, newDate, newStartTime, newEndTime) => set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id ? { ...t, date: newDate, start_time: newStartTime, end_time: newEndTime, updated_at: new Date().toISOString() } : t
                ),
            })),

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
        (set) => ({
            subjects: [],
            loading: false,

            setSubjects: (subjects) => set({ subjects }),
            setLoading: (loading) => set({ loading }),

            addSubject: (subject) => set((state) => ({
                subjects: [...state.subjects, subject],
            })),

            updateSubject: (id, updates) => set((state) => ({
                subjects: state.subjects.map((s) =>
                    s.id === id ? { ...s, ...updates } : s
                ),
            })),

            deleteSubject: (id) => set((state) => ({
                subjects: state.subjects.filter((s) => s.id !== id),
            })),
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

            setChapters: (chapters) => set({ chapters }),
            setLoading: (loading) => set({ loading }),

            addChapter: (chapter) => set((state) => ({
                chapters: [...state.chapters, chapter],
            })),

            updateChapter: (id, updates) => set((state) => ({
                chapters: state.chapters.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
            })),

            deleteChapter: (id) => set((state) => ({
                chapters: state.chapters.filter((c) => c.id !== id),
            })),

            getChaptersBySubject: (subjectId) => {
                return get().chapters.filter((c) => c.subject_id === subjectId);
            },
        }),
        { name: 'dp-chapters', partialize: (state) => ({ chapters: state.chapters }) }
    )
);


// ─── Settings (hardcoded) ────────────────────────────────────
export const SCHEDULE = {
    slotDuration: 60,        // grid row = 1 hour
    dayStartHour: 6,         // 6:00
    dayEndHour: 24,          // 24:00 (midnight)
    weekStartDay: 1,         // Monday
};


// ─── UI Store ────────────────────────────────────────────────
export const useUIStore = create((set) => ({
    currentWeekStart: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'), // Monday

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
