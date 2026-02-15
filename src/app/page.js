'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, useTaskActions, useWeekNavigation, SCHEDULE } from '@/lib/atoms';
import { getWeekDays, getTimeSlots, getWeekRangeLabel, isCurrentWeek, getCurrentTimePosition, formatTime, dayjs } from '@/lib/dates';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import TaskModal from '@/components/tasks/task-modal';

const subjectColorMap = {
  physics: { bg: 'rgba(34,211,238,0.12)', border: '#22d3ee' },
  chemistry: { bg: 'rgba(244,114,182,0.12)', border: '#f472b6' },
  maths: { bg: 'rgba(251,146,60,0.12)', border: '#fb923c' },
  biology: { bg: 'rgba(52,211,153,0.12)', border: '#34d399' },
  default: { bg: 'rgba(167,139,250,0.12)', border: '#8b5cf6' },
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

/* ─── Drag Overlay ─── */
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

export default function WeeklyPlannerPage() {
  const { currentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek } = useWeekNavigation();
  const tasks = useAtomValue(tasksAtom) || [];
  const { moveTask, updateTask } = useTaskActions();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [timePosition, setTimePosition] = useState(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const timeSlots = useMemo(() => getTimeSlots(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour, 60), []);

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
    updateTask(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
  };

  const handleDragStart = (event) => setActiveTask(event.active.data.current.task);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !active) return;
    const task = active.data.current.task;
    const [newDate, newTime] = over.id.split('_');
    if (!newDate || !newTime) return;
    if (task.date === newDate && task.start_time === newTime) return;
    const duration = task.start_time && task.end_time
      ? dayjs(task.end_time, 'HH:mm').diff(dayjs(task.start_time, 'HH:mm'), 'minute')
      : 60;
    const newEndTime = dayjs(newTime, 'HH:mm').add(duration, 'minute').format('HH:mm');
    moveTask(task.id, newDate, newTime, newEndTime);
  };

  const isThisWeek = isCurrentWeek(currentWeekStart);

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200" onClick={goToPreviousWeek}>
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant={isThisWeek ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-7 text-xs font-semibold tracking-wide ${isThisWeek ? 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/20' : 'text-zinc-400'}`}
            onClick={goToThisWeek}
          >
            <CalendarDays size={14} className="mr-1" />
            NOW
          </Button>
          <Badge variant="outline" className="mono text-[10px] tracking-wider border-white/10 text-zinc-500 px-2 py-0.5">
            {getWeekRangeLabel(currentWeekStart)}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200" onClick={goToNextWeek}>
            <ChevronRight size={14} />
          </Button>
        </div>

        <Button
          size="sm"
          className="h-7 text-xs font-semibold bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
          onClick={() => { setSelectedSlot({ date: dayjs().format('YYYY-MM-DD'), time: '09:00' }); setEditingTask(null); setTaskModalOpen(true); }}
        >
          <Plus size={14} className="mr-1" />
          ADD
        </Button>
      </div>

      {/* Grid with DnD */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTask(null)}>
        <div className="week-grid-container">
          <div className="week-grid" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="week-grid-header">
              <div className="week-grid-header-cell">
                <span className="mono text-[8px] font-semibold text-zinc-600">TIME</span>
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
                        <div className="empty-slot-hint">
                          <Plus size={10} className="text-zinc-700" />
                        </div>
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

        <DragOverlay dropAnimation={null}>
          {activeTask && <TaskOverlay task={activeTask} />}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); setSelectedSlot(null); }}
        task={editingTask}
        defaultDate={selectedSlot?.date}
        defaultTime={selectedSlot?.time}
      />
    </>
  );
}
