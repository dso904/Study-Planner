'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, SUBJECTS, getSubjectColorById } from '@/lib/atoms';
import { dayjs } from '@/lib/dates';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Clock } from 'lucide-react';

// I1-FIX: Removed local subjectColors map — using centralized getSubjectColorById

export default function TaskLinker({ linkedTask, onLink, onUnlink }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const tasksRaw = useAtomValue(tasksAtom);
    const tasks = tasksRaw || [];

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const availableTasks = useMemo(() => {
        const today = dayjs().format('YYYY-MM-DD');
        return tasks
            .filter((t) => t.status !== 'done' && t.status !== 'skipped')
            .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                if (a.date === today && b.date !== today) return -1;
                if (a.date !== today && b.date === today) return 1;
                return (a.date || '').localeCompare(b.date || '');
            })
            .slice(0, 10);
    }, [tasks, search]);

    const getTaskColor = (task) => {
        return getSubjectColorById(task.subject_id);
    };

    const formatTaskDate = (date) => {
        const today = dayjs().format('YYYY-MM-DD');
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        if (date === today) return 'Today';
        if (date === tomorrow) return 'Tomorrow';
        return dayjs(date).format('MMM D');
    };

    const formatTimeSpent = (seconds) => {
        if (!seconds) return '0m';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    if (linkedTask) {
        const color = getTaskColor(linkedTask);
        return (
            <div className="task-linker-linked">
                <div className="task-linker-info">
                    <div
                        className="task-linker-dot"
                        style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
                    />
                    <div className="task-linker-details">
                        <span className="task-linker-title">{linkedTask.title}</span>
                        <span className="task-linker-meta">
                            {linkedTask.subject_name}
                            {linkedTask.time_spent > 0 && (
                                <span className="task-linker-time">
                                    <Clock size={9} />
                                    {formatTimeSpent(linkedTask.time_spent)}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onUnlink}
                    className="task-linker-unlink"
                    title="Unlink task"
                >
                    <X size={12} />
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="task-linker">
            <button
                onClick={() => setOpen(!open)}
                className="task-linker-trigger"
            >
                <span className="task-linker-placeholder">Link to task...</span>
                <ChevronDown
                    size={14}
                    className={`task-linker-chevron ${open ? 'open' : ''}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="task-linker-dropdown"
                    >
                        <div className="task-linker-search">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="task-linker-list">
                            {availableTasks.length === 0 ? (
                                <div className="task-linker-empty">
                                    No tasks available
                                </div>
                            ) : (
                                availableTasks.map((task) => {
                                    const color = getTaskColor(task);
                                    return (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                onLink(task);
                                                setOpen(false);
                                                setSearch('');
                                            }}
                                            className="task-linker-item"
                                        >
                                            <div
                                                className="task-linker-item-dot"
                                                style={{ background: color }}
                                            />
                                            <div className="task-linker-item-content">
                                                <span className="task-linker-item-title">
                                                    {task.title}
                                                </span>
                                                <span className="task-linker-item-meta">
                                                    {task.subject_name} · {formatTaskDate(task.date)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
