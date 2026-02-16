'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { tasksAtom, useTaskActions, useWeekNavigation, SCHEDULE } from '@/lib/atoms';
import { getWeekDays, getTimeSlots, getWeekRangeLabel, isCurrentWeek, getCurrentTimePosition, formatTime, dayjs } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, ChevronRight as ChevronRightIcon } from 'lucide-react';
import TaskModal from '@/components/tasks/task-modal';

const subjectColorMap = {
  physics: { bg: 'rgba(250,204,21,0.55)', border: '#facc15' },
  chemistry: { bg: 'rgba(244,114,182,0.55)', border: '#f472b6' },
  maths: { bg: 'rgba(239,68,68,0.55)', border: '#ef4444' },
  biology: { bg: 'rgba(52,211,153,0.55)', border: '#34d399' },
  english: { bg: 'rgba(96,165,250,0.55)', border: '#60a5fa' },
  default: { bg: 'rgba(139,92,246,0.55)', border: '#8b5cf6' },
};

function getTaskColor(subjectId = '') {
  return subjectColorMap[subjectId] || subjectColorMap.default;
}

/* ─── Status & Priority data ─── */
const statuses = [
  { value: 'pending', label: 'Pending', emoji: '⏳', color: '#fb923c' },
  { value: 'in_progress', label: 'In Progress', emoji: '🔄', color: '#22d3ee' },
  { value: 'done', label: 'Done', emoji: '✅', color: '#34d399' },
  { value: 'skipped', label: 'Skipped', emoji: '⏭️', color: '#64748b' },
  { value: 'missed', label: 'Missed', emoji: '🔴', color: '#f43f5e' },
];

const priorities = [
  { value: 'critical', label: 'Critical', emoji: '🔴', color: '#f43f5e' },
  { value: 'high', label: 'High', emoji: '🟠', color: '#fb923c' },
  { value: 'medium', label: 'Medium', emoji: '🟡', color: '#facc15' },
  { value: 'low', label: 'Low', emoji: '🟢', color: '#34d399' },
];

/* ─── Positioned Task Block ─── */
function TaskBlock({ task, style, onClick, isExpanded, onTogglePanel, onUpdateTask }) {
  const color = getTaskColor(task.subject_id);

  const handlePanelClick = (e) => {
    e.stopPropagation();
    onTogglePanel(task.id);
  };

  const handleStatusChange = (e, statusValue) => {
    e.stopPropagation();
    onUpdateTask(task.id, { status: statusValue });
  };

  const handlePriorityChange = (e, priorityValue) => {
    e.stopPropagation();
    onUpdateTask(task.id, { priority: priorityValue });
  };

  return (
    <div
      className={`task-block-abs ${task.status} ${isExpanded ? 'panel-open' : ''}`}
      style={{
        ...style,
        background: color.bg,
        borderLeftColor: color.border,
      }}
      onClick={onClick}
    >
      {/* Main content — hides when panel is open */}
      <div className="task-block-content">
        <div className="task-block-title" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{task.title}</div>
        <div className="task-block-time" style={{ color: 'rgba(255,255,255,0.8)' }}>{formatTime(task.start_time)}–{formatTime(task.end_time)}</div>
        <div className="task-block-category" style={{ color: 'rgba(255,255,255,0.65)' }}>{task.category}</div>
      </div>

      {/* Side panel toggle tab */}
      <button
        type="button"
        className={`task-side-tab ${isExpanded ? 'is-open' : ''}`}
        title="Task options"
        onClick={handlePanelClick}
      >
        <ChevronRightIcon size={11} strokeWidth={2.5} />
      </button>

      {/* Collapsible side panel — overlays from right */}
      <div className={`task-side-panel ${isExpanded ? 'is-open' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Status row */}
        <div className="panel-row">
          <div className="panel-section-label">STATUS</div>
          <div className="panel-chips">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`panel-chip ${task.status === s.value ? 'active' : ''}`}
                style={{
                  '--chip-color': s.color,
                  background: task.status === s.value ? `${s.color}25` : 'rgba(255,255,255,0.04)',
                  borderColor: task.status === s.value ? `${s.color}60` : 'rgba(255,255,255,0.08)',
                  color: task.status === s.value ? s.color : 'rgba(255,255,255,0.45)',
                }}
                onClick={(e) => handleStatusChange(e, s.value)}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>
        {/* Priority row */}
        <div className="panel-row">
          <div className="panel-section-label">PRIORITY</div>
          <div className="panel-chips">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`panel-chip ${task.priority === p.value ? 'active' : ''}`}
                style={{
                  '--chip-color': p.color,
                  background: task.priority === p.value ? `${p.color}25` : 'rgba(255,255,255,0.04)',
                  borderColor: task.priority === p.value ? `${p.color}60` : 'rgba(255,255,255,0.08)',
                  color: task.priority === p.value ? p.color : 'rgba(255,255,255,0.45)',
                }}
                onClick={(e) => handlePriorityChange(e, p.value)}
                title={p.label}
              >
                {p.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
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
const SLOT_HEIGHT = 80; // increased from 54 for taller rows
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
  const [expandedTaskId, setExpandedTaskId] = useState(null);
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

  const handleTogglePanel = useCallback((taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  const handleUpdateTask = useCallback((id, updates) => {
    updateTask(id, updates);
  }, [updateTask]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!expandedTaskId) return;
    const handler = (e) => {
      if (!e.target.closest('.task-block-abs')) {
        setExpandedTaskId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expandedTaskId]);

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
            className={`h-7 text-xs font-semibold tracking-wide ${isThisWeek ? 'bg-teal-500/15 text-teal-300 hover:bg-teal-500/20' : 'text-zinc-400'}`}
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
          className="h-7 text-xs font-semibold bg-teal-500/15 text-teal-300 hover:bg-teal-500/25"
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
                  isExpanded={expandedTaskId === task.id}
                  onTogglePanel={handleTogglePanel}
                  onUpdateTask={handleUpdateTask}
                  style={{
                    position: 'absolute',
                    top: `${pos.top}px`,
                    height: `${pos.height}px`,
                    left: colLeft,
                    width: `calc(${colWidthPercent} - 6px)`,
                    zIndex: expandedTaskId === task.id ? 50 : 5,
                    overflow: 'visible',
                  }}
                  onClick={(e) => handleTaskClick(e, task)}
                />
              );
            });
          })}

          {/* Today column electric border overlay */}
          {isThisWeek && (() => {
            const todayIdx = weekDays.findIndex((d) => d.isToday);
            if (todayIdx < 0) return null;
            const colLeft = `calc(${TIME_COL_WIDTH}px + ${todayIdx} * (100% - ${TIME_COL_WIDTH}px) / 7)`;
            const colWidth = `calc((100% - ${TIME_COL_WIDTH}px) / 7)`;
            return (
              <div
                className="today-column-glow"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: colLeft,
                  width: colWidth,
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <div className="saber-beam saber-cyan" />
                <div className="saber-beam saber-magenta" />
              </div>
            );
          })()}

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
