'use client';

import { useMemo } from 'react';
import CircularProgress from './circular-progress';

function formatLapTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const ms = Math.floor((seconds % 1) * 100);
    if (mins > 0) {
        return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    return `${secs}.${String(ms).padStart(2, '0')}`;
}

export default function StopwatchDisplay({ seconds, isRunning, formatTime, color }) {
    const progress = useMemo(() => {
        return (seconds % 60) / 60 * 100;
    }, [seconds]);

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    // Use .toFixed(2) for milliseconds to ensure we get "00" through "99"
    // (seconds % 1) gives the fractional part. * 100 gives 0-99.
    const ms = Math.floor((seconds % 1) * 100);

    return (
        <div className="stopwatch-container">
            <CircularProgress progress={progress} color={color} isRunning={isRunning}>
                <div className="timer-display-inner">
                    <div className="timer-time">
                        {hrs > 0 && <span className="timer-hours">{hrs}:</span>}
                        <span>{String(mins).padStart(2, '0')}</span>
                        <span className="timer-separator">:</span>
                        <span>{String(secs).padStart(2, '0')}</span>
                        <span className="timer-separator" style={{ opacity: 0.5, fontSize: '0.8em' }}>.</span>
                        <span style={{ fontSize: '0.8em', opacity: 0.8, width: '1.5em', display: 'inline-block' }}>{String(ms).padStart(2, '0')}</span>
                    </div>
                    <div className="timer-meta">
                        <span className="timer-label">{isRunning ? 'Running' : 'Stopped'}</span>
                    </div>
                </div>
            </CircularProgress>
        </div>
    );
}
