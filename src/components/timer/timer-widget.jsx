'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Flag, Timer, Clock, X, Minus, Maximize2, Settings } from 'lucide-react';
import { useTimerActions, TIMER_MODES, TIMER_PRESETS } from '@/lib/timer-atoms';
import { useTimer } from '@/hooks/use-timer';
import TimerDisplay from './timer-display';
import StopwatchDisplay from './stopwatch-display';
import TaskLinker from './task-linker';

const WIDGET_WIDTH = 320;
const WIDGET_HEIGHT_MINIMIZED = 56;
const WIDGET_PADDING = 20;

export default function TimerWidget() {
    const {
        isOpen,
        isMinimized,
        position,
        mode,
        seconds,
        linkedTask,
        preset,
        setIsRunning,
        setPosition,
        closeWidget,
        toggleMinimize,
        switchMode,
        selectPreset,
        linkTask,
        unlinkTask,
    } = useTimerActions();

    const { isRunning, toggle, reset, formatTime } = useTimer();

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customMinutes, setCustomMinutes] = useState(25);
    const widgetRef = useRef(null);

    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('.timer-widget-controls') ||
            e.target.closest('.timer-widget-header-actions') ||
            e.target.closest('.task-linker') ||
            e.target.closest('.timer-presets')) {
            return;
        }
        setIsDragging(true);
        const rect = widgetRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    }, []);

    // I4-FIX: Touch event handlers for mobile drag support
    const handleTouchStart = useCallback((e) => {
        if (e.target.closest('.timer-widget-controls') ||
            e.target.closest('.timer-widget-header-actions') ||
            e.target.closest('.task-linker') ||
            e.target.closest('.timer-presets')) {
            return;
        }
        const touch = e.touches[0];
        setIsDragging(true);
        const rect = widgetRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
            });
        }
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        const newX = Math.max(0, Math.min(
            window.innerWidth - WIDGET_WIDTH - WIDGET_PADDING,
            e.clientX - dragOffset.x
        ));
        const newY = Math.max(0, Math.min(
            window.innerHeight - (isMinimized ? WIDGET_HEIGHT_MINIMIZED : 500) - WIDGET_PADDING,
            e.clientY - dragOffset.y
        ));
        setPosition({ x: newX, y: newY });
    }, [isDragging, dragOffset, setPosition, isMinimized]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault(); // prevent scrolling while dragging
        const touch = e.touches[0];
        const newX = Math.max(0, Math.min(
            window.innerWidth - WIDGET_WIDTH - WIDGET_PADDING,
            touch.clientX - dragOffset.x
        ));
        const newY = Math.max(0, Math.min(
            window.innerHeight - (isMinimized ? WIDGET_HEIGHT_MINIMIZED : 500) - WIDGET_PADDING,
            touch.clientY - dragOffset.y
        ));
        setPosition({ x: newX, y: newY });
    }, [isDragging, dragOffset, setPosition, isMinimized]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    // UX2-FIX: Clamp widget position when window is resized so it can't go off-screen
    useEffect(() => {
        const handleResize = () => {
            setPosition((prev) => ({
                x: Math.max(0, Math.min(prev.x, window.innerWidth - WIDGET_WIDTH - WIDGET_PADDING)),
                y: Math.max(0, Math.min(prev.y, window.innerHeight - (isMinimized ? WIDGET_HEIGHT_MINIMIZED : 200) - WIDGET_PADDING)),
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setPosition, isMinimized]);

    const handlePresetClick = (p) => {
        if (p.id === 'preset-custom') {
            setShowCustomInput(true);
        } else {
            selectPreset(p);
            setShowCustomInput(false);
        }
    };

    const handleCustomSet = () => {
        const secs = Math.max(1, Math.min(180, customMinutes)) * 60;
        selectPreset({ ...TIMER_PRESETS[3], seconds: secs });
        setShowCustomInput(false);
    };

    const handleLinkTask = (task) => {
        linkTask(task);
    };

    const activeColor = mode === TIMER_MODES.TIMER ? preset.color : '#22d3ee';

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={widgetRef}
                className={`timer-widget ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                    left: position.x,
                    top: position.y,
                    width: WIDGET_WIDTH,
                }}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                <div
                    className="timer-widget-drag-handle"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    role="application"
                    aria-label={`${mode === TIMER_MODES.TIMER ? 'Timer' : 'Stopwatch'} widget — drag to move`}
                >
                    <div className="timer-widget-header">
                        <div className="timer-widget-header-left">
                            <div
                                className="timer-widget-icon"
                                style={{
                                    background: `linear-gradient(135deg, ${activeColor}30, ${activeColor}10)`,
                                    boxShadow: `0 0 16px ${activeColor}20`,
                                }}
                            >
                                {mode === TIMER_MODES.TIMER ? (
                                    <Timer size={14} style={{ color: activeColor }} />
                                ) : (
                                    <Clock size={14} style={{ color: activeColor }} />
                                )}
                            </div>
                            {!isMinimized && (
                                <div className="timer-widget-modes">
                                    <button
                                        className={`timer-mode-btn ${mode === TIMER_MODES.TIMER ? 'active' : ''}`}
                                        onClick={() => switchMode(TIMER_MODES.TIMER)}
                                        style={{ '--mode-color': TIMER_PRESETS[1].color }}
                                    >
                                        Timer
                                    </button>
                                    <button
                                        className={`timer-mode-btn ${mode === TIMER_MODES.STOPWATCH ? 'active' : ''}`}
                                        onClick={() => switchMode(TIMER_MODES.STOPWATCH)}
                                        style={{ '--mode-color': '#22d3ee' }}
                                    >
                                        Stopwatch
                                    </button>
                                </div>
                            )}
                            {isMinimized && (
                                <span className="timer-widget-mini-time" style={{ color: activeColor }}>
                                    {formatTime(seconds)}
                                </span>
                            )}
                        </div>

                        <div className="timer-widget-header-actions">
                            {isRunning && !isMinimized && (
                                <span className="timer-running-indicator" />
                            )}
                            <button
                                className="timer-action-btn"
                                onClick={toggleMinimize}
                                title={isMinimized ? 'Expand' : 'Minimize'}
                            >
                                {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                            </button>
                            <button
                                className="timer-action-btn close"
                                onClick={closeWidget}
                                title="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="timer-widget-body">
                        <div className="timer-display-wrapper">
                            {mode === TIMER_MODES.TIMER ? (
                                <TimerDisplay
                                    seconds={seconds}
                                    target={preset.seconds}
                                    isRunning={isRunning}
                                    formatTime={formatTime}
                                    color={preset.color}
                                />
                            ) : (
                                <StopwatchDisplay
                                    seconds={seconds}
                                    isRunning={isRunning}
                                    formatTime={formatTime}
                                    color="#22d3ee"
                                />
                            )}
                        </div>

                        {mode === TIMER_MODES.TIMER && (
                            <div className="timer-presets">
                                {TIMER_PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        className={`timer-preset-btn ${preset.id === p.id ? 'active' : ''}`}
                                        onClick={() => handlePresetClick(p)}
                                        style={{ '--preset-color': p.color }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showCustomInput && (
                            <div className="timer-custom-input">
                                <input
                                    type="number"
                                    min="1"
                                    max="180"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSet()}
                                    placeholder="Minutes"
                                    autoFocus
                                />
                                <span className="timer-custom-label">minutes</span>
                                <button onClick={handleCustomSet} className="timer-custom-set">
                                    Set
                                </button>
                            </div>
                        )}

                        <div className="timer-widget-controls">
                            <button
                                className="timer-ctrl-btn secondary"
                                onClick={reset}
                                title="Reset"
                            >
                                <RotateCcw size={16} />
                            </button>

                            <button
                                className={`timer-ctrl-btn primary ${isRunning ? 'running' : ''}`}
                                onClick={toggle}
                                style={{ '--ctrl-color': activeColor }}
                            >
                                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                        </div>

                        <div className="timer-task-linker">
                            <TaskLinker
                                linkedTask={linkedTask}
                                onLink={handleLinkTask}
                                onUnlink={unlinkTask}
                            />
                        </div>
                    </div>
                )}

                {isMinimized && (
                    <div className="timer-widget-mini-controls">
                        <button
                            className={`timer-mini-btn ${isRunning ? 'running' : ''}`}
                            onClick={toggle}
                            style={{ '--mini-color': activeColor }}
                        >
                            {isRunning ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
