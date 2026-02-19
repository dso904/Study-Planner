'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTimerActions, TIMER_MODES } from '@/lib/timer-atoms';
import { useTaskActions } from '@/lib/atoms';

// Singleton AudioContext to avoid recreation and varying browser policies
let audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
}

function playCompletionSound() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
        ctx.resume().catch(console.error);
    }

    try {
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        const now = ctx.currentTime;

        frequencies.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = now + i * 0.15;

            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

export function useTimer() {
    const {
        mode,
        seconds,
        target,
        isRunning,
        linkedTask,
        preset,
        setIsRunning,
        setSeconds,
        resetTimer,
    } = useTimerActions();

    const { updateTask } = useTaskActions();

    // Refs for high-precision timing
    const requestRef = useRef(null);
    const startTimeRef = useRef(null);
    const baseSecondsRef = useRef(seconds); // Snapshot of seconds when timer starts
    const lastTaskUpdateRef = useRef(0); // For tracking accumulated time for tasks

    // H4-FIX: Store linkedTask in a ref so the animation loop always reads
    // the latest value without restarting the effect (which resets timing baselines).
    const linkedTaskRef = useRef(linkedTask);
    useEffect(() => { linkedTaskRef.current = linkedTask; }, [linkedTask]);

    // Also keep updateTask in a ref to avoid effect restarts
    const updateTaskRef = useRef(updateTask);
    useEffect(() => { updateTaskRef.current = updateTask; }, [updateTask]);

    // Sync baseSeconds when not running, so manual edits or resets are captured
    useEffect(() => {
        if (!isRunning) {
            baseSecondsRef.current = seconds;
        }
    }, [seconds, isRunning]);

    // Cleanup navigation/unmount
    useEffect(() => {
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    // Main Timer Loop
    // H4-FIX: linkedTask and updateTask removed from deps — read from refs instead
    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = performance.now();
            baseSecondsRef.current = seconds;
            lastTaskUpdateRef.current = seconds;

            const animate = (time) => {
                const elapsed = (time - startTimeRef.current) / 1000;

                if (mode === TIMER_MODES.TIMER) {
                    const newSeconds = Math.max(0, baseSecondsRef.current - elapsed);
                    setSeconds(newSeconds);

                    if (newSeconds <= 0) {
                        setIsRunning(false);
                        playCompletionSound();
                        const task = linkedTaskRef.current;
                        if (task && target > 0) {
                            updateTaskRef.current(task.id, {
                                time_spent: (task.time_spent || 0) + target,
                            });
                        }
                    } else {
                        requestRef.current = requestAnimationFrame(animate);
                    }
                } else {
                    // Stopwatch Mode
                    const newSeconds = baseSecondsRef.current + elapsed;
                    setSeconds(newSeconds);

                    // Robust Task Update: Check if we crossed a minute boundary
                    const task = linkedTaskRef.current;
                    if (task) {
                        const timeSinceLastUpdate = newSeconds - lastTaskUpdateRef.current;
                        if (timeSinceLastUpdate >= 60) {
                            updateTaskRef.current(task.id, {
                                time_spent: (task.time_spent || 0) + 60,
                            });
                            // Advance the ref by exactly 60s to prevent drift
                            lastTaskUpdateRef.current += 60;
                        }
                    }

                    requestRef.current = requestAnimationFrame(animate);
                }
            };

            requestRef.current = requestAnimationFrame(animate);

            return () => {
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, mode, target, setSeconds, setIsRunning]);

    const toggle = useCallback(() => {
        // Ensure AudioContext is ready/resumed on user interaction
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
        setIsRunning(!isRunning);
    }, [isRunning, setIsRunning]);

    const reset = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    const getProgress = useCallback(() => {
        if (mode === TIMER_MODES.TIMER) {
            return target > 0 ? ((target - seconds) / target) * 100 : 0;
        }
        return 0;
    }, [mode, target, seconds]);

    const formatTime = useCallback((totalSeconds) => {
        const total = Math.floor(totalSeconds); // Floor for display
        const hrs = Math.floor(total / 3600);
        const mins = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, []);

    return {
        seconds,
        target,
        isRunning,
        toggle,
        reset,
        getProgress,
        formatTime,
        preset,
    };
}

