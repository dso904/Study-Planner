'use client';

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const TIMER_MODES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
};

export const TIMER_PRESETS = [
    { id: 'preset-15', label: '15 min', seconds: 15 * 60, color: '#22d3ee' },
    { id: 'preset-25', label: '25 min', seconds: 25 * 60, color: '#8b5cf6' },
    { id: 'preset-50', label: '50 min', seconds: 50 * 60, color: '#f472b6' },
    { id: 'preset-custom', label: 'Custom', seconds: 0, color: '#fb923c' },
];

const DEFAULT_POSITION = { x: 20, y: 20 };

export const timerOpenAtom = atomWithStorage('dp-timer-open', false);
export const timerMinimizedAtom = atomWithStorage('dp-timer-minimized', false);
export const timerPositionAtom = atomWithStorage('dp-timer-position', DEFAULT_POSITION);
export const timerModeAtom = atomWithStorage('dp-timer-mode', TIMER_MODES.TIMER);
export const timerSecondsAtom = atomWithStorage('dp-timer-seconds', 25 * 60);
export const timerTargetAtom = atomWithStorage('dp-timer-target', 25 * 60);
export const timerRunningAtom = atom(false); // H3-FIX: Never persist running state — prevents stale auto-resume on reload
export const timerLinkedTaskAtom = atomWithStorage('dp-timer-linked-task', null);
export const timerPresetAtom = atomWithStorage('dp-timer-preset', TIMER_PRESETS[1]);
export const timerCustomSecondsAtom = atomWithStorage('dp-timer-custom', 25 * 60);

export function useTimerActions() {
    const [isOpen, setIsOpen] = useAtom(timerOpenAtom);
    const [isMinimized, setIsMinimized] = useAtom(timerMinimizedAtom);
    const [position, setPosition] = useAtom(timerPositionAtom);
    const [mode, setMode] = useAtom(timerModeAtom);
    const [seconds, setSeconds] = useAtom(timerSecondsAtom);
    const [target, setTarget] = useAtom(timerTargetAtom);
    const [isRunning, setIsRunning] = useAtom(timerRunningAtom);
    const [linkedTask, setLinkedTask] = useAtom(timerLinkedTaskAtom);
    const [preset, setPreset] = useAtom(timerPresetAtom);
    // H7-FIX: Read customSeconds atom (was previously missing, causing ReferenceError)
    const [customSeconds, setCustomSeconds] = useAtom(timerCustomSecondsAtom);

    const openWidget = () => setIsOpen(true);
    const closeWidget = () => {
        setIsOpen(false);
        setIsRunning(false);
    };
    const toggleWidget = () => setIsOpen((prev) => !prev);
    const toggleMinimize = () => setIsMinimized((prev) => !prev);

    // H7-FIX: For custom presets, use the seconds from the preset object (set by timer-widget)
    // and persist to the customSeconds atom. Falls back to atom value if preset has no seconds.
    const selectPreset = (newPreset) => {
        setPreset(newPreset);
        if (newPreset.id !== 'preset-custom') {
            setTarget(newPreset.seconds);
            setSeconds(newPreset.seconds);
        } else {
            const secs = newPreset.seconds || customSeconds;
            setCustomSeconds(secs);
            setTarget(secs);
            setSeconds(secs);
        }
        setIsRunning(false);
    };

    const setCustomTarget = (secs) => {
        if (preset.id === 'preset-custom') {
            setTarget(secs);
            setSeconds(secs);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsRunning(false);
        if (newMode === TIMER_MODES.TIMER) {
            setSeconds(target);
        } else {
            setSeconds(0);
        }
    };

    const linkTask = (task) => {
        setLinkedTask(task);
    };

    const unlinkTask = () => {
        setLinkedTask(null);
    };

    const resetTimer = () => {
        setIsRunning(false);
        if (mode === TIMER_MODES.TIMER) {
            setSeconds(target);
        } else {
            setSeconds(0);
        }
    };

    return {
        isOpen,
        isMinimized,
        position,
        mode,
        seconds,
        target,
        isRunning,
        linkedTask,
        preset,
        setIsRunning,
        setSeconds,
        setPosition,
        openWidget,
        closeWidget,
        toggleWidget,
        toggleMinimize,
        selectPreset,
        setCustomTarget,
        switchMode,
        linkTask,
        unlinkTask,
        resetTimer,
    };
}
