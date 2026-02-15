'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, useTaskActions, useWeekNavigation, SCHEDULE } from '@/lib/atoms';
import { getWeekDays, getTimeSlots, getWeekRangeLabel, isCurrentWeek, getCurrentTimePosition, formatTime, dayjs } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Check } from 'lucide-react';
import TaskModal from '@/components/tasks/task-modal';

const subjectColorMap = {
  physics: { bg: 'rgba(250,204,21,0.35)', border: '#facc15' },
  chemistry: { bg: 'rgba(244,114,182,0.35)', border: '#f472b6' },
  maths: { bg: 'rgba(239,68,68,0.35)', border: '#ef4444' },
  biology: { bg: 'rgba(52,211,153,0.35)', border: '#34d399' },
  english: { bg: 'rgba(167,139,250,0.35)', border: '#a78bfa' },
  default: { bg: 'rgba(167,139,250,0.35)', border: '#8b5cf6' },
};

function getTaskColor(subjectId = '') {
  return subjectColorMap[subjectId] || subjectColorMap.default;
}

/* ─── Positioned Task Block ─── */
function TaskBlock({ task, style, onClick, onToggleStatus }) {
  const color = getTaskColor(task.subject_id);
  const isDone = task.status === 'done';
  return (
    <div
      className={`task-block-abs ${task.status}`}
      style={{
        ...style,
        background: color.bg,
        borderLeftColor: color.border,
      }}
      onClick={onClick}
    >
      <div className="task-block-title" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{task.title}</div>
      <div className="task-block-time" style={{ color: 'rgba(255,255,255,0.8)' }}>{formatTime(task.start_time)}–{formatTime(task.end_time)}</div>
      <div className="task-block-category" style={{ color: 'rgba(255,255,255,0.65)' }}>{task.category}</div>
      {/* Quick-complete button */}
      <button
        type="button"
        className={`task-block-check ${isDone ? 'is-done' : ''}`}
        title={isDone ? 'Mark as pending' : 'Mark as done'}
        onClick={(e) => { e.stopPropagation(); onToggleStatus(e, task); }}
      >
        <Check size={11} strokeWidth={3} />
      </button>
    </div>
  );
}

/* ─── Time Slot Cell ─── */
function TimeSlotCell({ isToday, onClick }) {
  return (
    <div
      className={`time-slot-cell ${isToday ? 'today' : ''}`}
      onClick={onClick}
    >
      <div className="empty-slot-hint">
        <Plus size={10} className="text-zinc-700" />
      </div>
    </div>
  );
}

/* ─── Constants ─── */
const SLOT_HEIGHT = 54; // matches min-height on .time-slot-cell
const HEADER_HEIGHT = 58; // approximate height of the header row
const TIME_COL_WIDTH = 70; // width of the time label column

export default function WeeklyPlannerPage() {
  const { currentWeekStart, goToPreviousWeek, goToNextWeek, goToThisWeek } = useWeekNavigation();
  const tasks = useAtomValue(tasksAtom) || [];
  const { updateTask } = useTaskActions();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [timePosition, setTimePosition] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
    const interval = setInterval(() => {
      setTimePosition(getCurrentTimePosition(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const timeSlots = useMemo(() => getTimeSlots(SCHEDULE.dayStartHour, SCHEDULE.dayEndHour, 60), []);

  // Group tasks by date for overlay rendering
  const tasksByDate = useMemo(() => {
    const map = new Map();
    const weekDateSet = new Set(weekDays.map((d) => d.date));
    for (const t of tasks) {
      if (!t.date || !t.start_time || !weekDateSet.has(t.date)) continue;
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    return map;
  }, [tasks, weekDays]);

  const handleSlotClick = (date, time) => {
    setSelectedSlot({ date, time });
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleTaskClick = useCallback((e, task) => {
    e.stopPropagation();
    setEditingTask(task);
    setSelectedSlot(null);
    setTaskModalOpen(true);
  }, []);

  const handleQuickToggle = useCallback((e, task) => {
    e.stopPropagation();
    updateTask(task.id, { status: task.status === 'done' ? 'pending' : 'done' });
  }, [updateTask]);

  const isThisWeek = isCurrentWeek(currentWeekStart);

  // Calculate task block position in pixels
  const getTaskPosition = (task, dayIndex) => {
    const startParts = task.start_time.split(':');
    const endParts = (task.end_time || task.start_time).split(':');
    const startHour = parseInt(startParts[0], 10);
    const startMin = parseInt(startParts[1] || '0', 10);
    const endHour = parseInt(endParts[0], 10);
    const endMin = parseInt(endParts[1] || '0', 10);

    const startOffset = (startHour - SCHEDULE.dayStartHour) + startMin / 60;
    const endOffset = (endHour - SCHEDULE.dayStartHour) + endMin / 60;
    const durationSlots = Math.max(endOffset - startOffset, 0.5); // minimum half-slot

    const top = HEADER_HEIGHT + startOffset * SLOT_HEIGHT;
    const height = durationSlots * SLOT_HEIGHT - 2; // small gap

    return { top, height };
  };

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
            className={`h-7 text-xs font-semibold tracking-wide ${isThisWeek ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/20' : 'text-zinc-400'}`}
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
          className="h-7 text-xs font-semibold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
          onClick={() => { setSelectedSlot({ date: dayjs().format('YYYY-MM-DD'), time: '09:00' }); setEditingTask(null); setTaskModalOpen(true); }}
        >
          <Plus size={14} className="mr-1" />
          ADD
        </Button>
      </div>

      {/* Grid */}
      <div className="week-grid-container">
        <div className="week-grid" ref={gridRef} style={{ position: 'relative' }}>
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

          {/* Time rows (empty cells for the grid lines) */}
          {timeSlots.map((slot) => (
            <div key={slot.time} className="week-grid-header">
              <div className="time-label-cell">{slot.label}</div>
              {weekDays.map((day) => (
                <TimeSlotCell
                  key={`${day.date}_${slot.time}`}
                  isToday={day.isToday}
                  onClick={() => handleSlotClick(day.date, slot.time)}
                />
              ))}
            </div>
          ))}

          {/* Task overlay layer — absolutely positioned task blocks */}
          {weekDays.map((day, dayIndex) => {
            const dayTasks = tasksByDate.get(day.date) || [];
            if (dayTasks.length === 0) return null;
            return dayTasks.map((task) => {
              const pos = getTaskPosition(task, dayIndex);
              // Each day column is (100% - TIME_COL_WIDTH) / 7 wide
              const colWidthPercent = `calc((100% - ${TIME_COL_WIDTH}px) / 7)`;
              const colLeft = `calc(${TIME_COL_WIDTH}px + ${dayIndex} * (100% - ${TIME_COL_WIDTH}px) / 7 + 3px)`;
              return (
                <TaskBlock
                  key={task.id}
                  task={task}
                  style={{
                    position: 'absolute',
                    top: `${pos.top}px`,
                    height: `${pos.height}px`,
                    left: colLeft,
                    width: `calc(${colWidthPercent} - 6px)`,
                    zIndex: 5,
                    overflow: 'hidden',
                  }}
                  onClick={(e) => handleTaskClick(e, task)}
                  onToggleStatus={(e, t) => handleQuickToggle(e, t)}
                />
              );
            });
          })}

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

