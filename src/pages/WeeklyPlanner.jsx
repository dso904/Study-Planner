import { Box, Group, ActionIcon, Button, Text, Badge } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useUIStore, useTaskStore, SCHEDULE } from '../lib/store';
import { getWeekDays, getTimeSlots, getWeekRangeLabel, isCurrentWeek, getCurrentTimePosition, formatTime, dayjs } from '../lib/dates';
import { useState, useEffect, useMemo, useCallback } from 'react';
import TaskModal from '../components/tasks/TaskModal';
import '../styles/weekly-grid.css';

const subjectColorMap = {
    physics: { bg: 'var(--subject-physics-bg)', border: 'var(--subject-physics)', text: 'var(--subject-physics)' },
    chemistry: { bg: 'var(--subject-chemistry-bg)', border: 'var(--subject-chemistry)', text: 'var(--subject-chemistry)' },
    maths: { bg: 'var(--subject-maths-bg)', border: 'var(--subject-maths)', text: 'var(--subject-maths)' },
    biology: { bg: 'var(--subject-biology-bg)', border: 'var(--subject-biology)', text: 'var(--subject-biology)' },
    default: { bg: 'rgba(167, 139, 250, 0.12)', border: 'var(--neon-violet)', text: 'var(--neon-violet)' },
};

function getTaskColor(subjectName = '') {
    return subjectColorMap[subjectName.toLowerCase()] || subjectColorMap.default;
}

/* ─── Draggable Task Block ─── */
function DraggableTask({ task, onClick, onDoubleClick }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } });
    const color = getTaskColor(task.subject_name);
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`task-block ${task.status}`}
            style={{
                background: color.bg,
                borderLeftColor: color.border,
                opacity: isDragging ? 0.3 : 1,
                cursor: 'grab',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            <div className="task-block-title">{task.title}</div>
            <div className="task-block-time">{formatTime(task.start_time)}–{formatTime(task.end_time)}</div>
            <div className="task-block-category">{task.category}</div>
        </div>
    );
}

/* ─── Droppable Cell ─── */
function DroppableCell({ id, isToday, children, onClick }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`time-slot-cell ${isToday ? 'today' : ''} ${isOver ? 'drop-target' : ''}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

/* ─── Drag Overlay (ghost preview) ─── */
function TaskOverlay({ task }) {
    const color = getTaskColor(task.subject_name);
    return (
        <div
            className="task-block"
            style={{
                background: color.bg,
                borderLeftColor: color.border,
                opacity: 0.85,
                boxShadow: '0 4px 20px rgba(167,139,250,0.3)',
                width: 140,
                pointerEvents: 'none',
            }}
        >
            <div className="task-block-title">{task.title}</div>
            <div className="task-block-time">{formatTime(task.start_time)}–{formatTime(task.end_time)}</div>
        </div>
    );
}


export default function WeeklyPlanner() {
    const { currentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek } = useUIStore();
    const tasks = useTaskStore((s) => s.tasks);
    const moveTask = useTaskStore((s) => s.moveTask);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [timePosition, setTimePosition] = useState(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));

    // Pointer sensor with activation distance to avoid accidental drags on clicks
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
    const timeSlots = useMemo(() => getTimeSlots(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour, 60), []);

    // Map tasks into correct grid slot
    const getTasksForSlot = useCallback((date, slotTime) => {
        const slotStart = dayjs(slotTime, 'HH:mm');
        const slotEnd = slotStart.add(60, 'minute');
        return tasks.filter((t) => {
            if (t.date !== date || !t.start_time) return false;
            const taskStart = dayjs(t.start_time, 'HH:mm');
            return taskStart.isSame(slotStart) || (taskStart.isAfter(slotStart) && taskStart.isBefore(slotEnd));
        });
    }, [tasks]);

    const handleSlotClick = (date, time) => {
        setSelectedSlot({ date, time });
        setEditingTask(null);
        setTaskModalOpen(true);
    };

    const handleTaskClick = (e, task) => {
        e.stopPropagation();
        setEditingTask(task);
        setSelectedSlot(null);
        setTaskModalOpen(true);
    };

    const handleQuickToggle = (e, task) => {
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        useTaskStore.getState().updateTask(task.id, { status: newStatus });
    };

    /* DnD handlers */
    const handleDragStart = (event) => {
        setActiveTask(event.active.data.current.task);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over || !active) return;

        const task = active.data.current.task;
        // droppable id format: "date_time" e.g. "2026-02-14_09:00"
        const [newDate, newTime] = over.id.split('_');
        if (!newDate || !newTime) return;
        // Skip if same cell
        if (task.date === newDate && task.start_time === newTime) return;

        // Calculate duration to preserve it
        const duration = task.start_time && task.end_time
            ? dayjs(task.end_time, 'HH:mm').diff(dayjs(task.start_time, 'HH:mm'), 'minute')
            : 60;
        const newEndTime = dayjs(newTime, 'HH:mm').add(duration, 'minute').format('HH:mm');
        moveTask(task.id, newDate, newTime, newEndTime);
    };

    const handleDragCancel = () => setActiveTask(null);

    const isThisWeek = isCurrentWeek(currentWeekStart);

    return (
        <>
            {/* Top bar */}
            <Group justify="space-between" mb={10}>
                <Group gap={6}>
                    <ActionIcon variant="subtle" size="sm" radius="md" onClick={goToPreviousWeek}>
                        <IconChevronLeft size={14} color="var(--text-secondary)" />
                    </ActionIcon>
                    <Button variant={isThisWeek ? 'light' : 'subtle'} color="violet" size="xs" radius="md" leftSection={<IconCalendarEvent size={14} />} onClick={goToThisWeek} styles={{ root: { fontWeight: 600, letterSpacing: '0.02em' } }}>
                        NOW
                    </Button>
                    <Badge size="xs" variant="outline" color="violet" radius="sm" className="mono" styles={{ root: { borderColor: 'var(--border-glow)', color: 'var(--text-muted)', padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.03em' } }}>
                        {getWeekRangeLabel(currentWeekStart)}
                    </Badge>
                    <ActionIcon variant="subtle" size="sm" radius="md" onClick={goToNextWeek}>
                        <IconChevronRight size={14} color="var(--text-secondary)" />
                    </ActionIcon>
                </Group>

                <Group gap={8}>
                    <Button variant="light" color="violet" size="xs" radius="md" leftSection={<IconPlus size={14} />}
                        onClick={() => { setSelectedSlot({ date: dayjs().format('YYYY-MM-DD'), time: '09:00' }); setEditingTask(null); setTaskModalOpen(true); }}
                        styles={{ root: { fontWeight: 600 } }}
                    >
                        ADD
                    </Button>
                </Group>
            </Group>

            {/* Grid with DnD */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <div className="week-grid-container">
                    <div className="week-grid" style={{ position: 'relative' }}>
                        {/* Header */}
                        <div className="week-grid-header">
                            <div className="week-grid-header-cell">
                                <Text size="8px" c="var(--text-faint)" fw={600} className="mono">TIME</Text>
                            </div>
                            {weekDays.map((day) => (
                                <div key={day.date} className={`week-grid-header-cell ${day.isToday ? 'today' : ''}`}>
                                    <div className="day-header-name">{day.dayName}</div>
                                    <div className={`day-header-number ${day.isToday ? 'today' : ''}`}>{day.dayNumber}</div>
                                    <div className="day-header-month">{day.monthName}</div>
                                </div>
                            ))}
                        </div>

                        {/* Time rows */}
                        {timeSlots.map((slot) => (
                            <div key={slot.time} className="week-grid-header">
                                <div className="time-label-cell">{slot.label}</div>
                                {weekDays.map((day) => {
                                    const cellId = `${day.date}_${slot.time}`;
                                    const cellTasks = getTasksForSlot(day.date, slot.time);
                                    return (
                                        <DroppableCell key={cellId} id={cellId} isToday={day.isToday} onClick={() => handleSlotClick(day.date, slot.time)}>
                                            {cellTasks.map((task) => (
                                                <DraggableTask
                                                    key={task.id}
                                                    task={task}
                                                    onClick={(e) => handleTaskClick(e, task)}
                                                    onDoubleClick={(e) => handleQuickToggle(e, task)}
                                                />
                                            ))}
                                            {cellTasks.length === 0 && (
                                                <div className="empty-slot-hint"><IconPlus size={10} color="var(--text-faint)" /></div>
                                            )}
                                        </DroppableCell>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Current time line */}
                        {isThisWeek && <div className="current-time-line" style={{ top: `calc(${timePosition}% + 50px)` }} />}
                    </div>
                </div>

                {/* Drag overlay - rendered outside grid for smooth rendering */}
                <DragOverlay dropAnimation={null}>
                    {activeTask && <TaskOverlay task={activeTask} />}
                </DragOverlay>
            </DndContext>

            <TaskModal opened={taskModalOpen} onClose={() => { setTaskModalOpen(false); setEditingTask(null); setSelectedSlot(null); }} task={editingTask} defaultDate={selectedSlot?.date} defaultTime={selectedSlot?.time} />
        </>
    );
}
