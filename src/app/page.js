'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, useTaskActions, useWeekNavigation, SCHEDULE } from '@/lib/atoms';
import { getWeekDays, getTimeSlots, getWeekRangeLabel, isCurrentWeek, getCurrentTimePosition, formatTime, dayjs } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import TaskModal from '@/components/tasks/task-modal';

const subjectColorMap = {
  physics: { bg: 'rgba(34,211,238,0.12)', border: '#22d3ee' },
  chemistry: { bg: 'rgba(244,114,182,0.12)', border: '#f472b6' },
  maths: { bg: 'rgba(251,146,60,0.12)', border: '#fb923c' },
  biology: { bg: 'rgba(52,211,153,0.12)', border: '#34d399' },
  english: { bg: 'rgba(167,139,250,0.12)', border: '#a78bfa' },
  default: { bg: 'rgba(167,139,250,0.12)', border: '#8b5cf6' },
};

function getTaskColor(subjectId = '') {
  return subjectColorMap[subjectId] || subjectColorMap.default;
}

/* ─── Task Block ─── */
function TaskBlock({ task, onClick, onDoubleClick }) {
  const color = getTaskColor(task.subject_id);
  return (
    <div
      className={`task-block ${task.status}`}
      style={{
        background: color.bg,
        borderLeftColor: color.border,
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

/* ─── Time Slot Cell ─── */
function TimeSlotCell({ isToday, children, onClick }) {
  return (
    <div
      className={`time-slot-cell ${isToday ? 'today' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default function WeeklyPlannerPage() {
  const { currentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek } = useWeekNavigation();
  const tasks = useAtomValue(tasksAtom) || [];
  const { updateTask } = useTaskActions();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [timePosition, setTimePosition] = useState(null);

  useEffect(() => {
    // Immediately set correct position using client's local time (fixes SSR timezone mismatch)
    setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
    const interval = setInterval(() => {
      setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const timeSlots = useMemo(() => getTimeSlots(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour, 60), []);

  // Pre-bucket tasks into a Map for O(1) lookup per cell
  const tasksBySlot = useMemo(() => {
    const map = new Map();
    const weekDateSet = new Set(weekDays.map((d) => d.date));
    for (const t of tasks) {
      if (!t.date || !t.start_time || !weekDateSet.has(t.date)) continue;
      const hour = parseInt(t.start_time.split(':')[0], 10);
      const slotKey = `${t.date}_${String(hour).padStart(2, '0')}:00`;
      if (!map.has(slotKey)) map.set(slotKey, []);
      map.get(slotKey).push(t);
    }
    return map;
  }, [tasks, weekDays]);

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

      {/* Grid */}
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
                const cellTasks = tasksBySlot.get(cellId) || [];
                return (
                  <TimeSlotCell key={cellId} isToday={day.isToday} onClick={() => handleSlotClick(day.date, slot.time)}>
                    {cellTasks.map((task) => (
                      <TaskBlock
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
                  </TimeSlotCell>
                );
              })}
            </div>
          ))}

          {/* Current time line */}
          {isThisWeek && timePosition !== null && <div className="current-time-line" style={{ top: `calc(${timePosition}% + 50px)` }} />}
        </div>
      </div>

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
