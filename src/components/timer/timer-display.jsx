'use client';

import { motion } from 'framer-motion';
import CircularProgress from './circular-progress';

export default function TimerDisplay({ seconds, target, isRunning, formatTime, color }) {
    const progress = target > 0 ? ((target - seconds) / target) * 100 : 0;
    const timeString = formatTime(seconds);

    const minutes = Math.floor(seconds / 60);
    const percentage = target > 0 ? Math.round((seconds / target) * 100) : 0;

    return (
        <CircularProgress progress={progress} color={color} isRunning={isRunning}>
            <div className="timer-display-inner">
                <motion.div
                    className="timer-time"
                    initial={{ scale: 1 }}
                    animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                    transition={{ duration: 2, repeat: isRunning ? Infinity : 0, ease: 'easeInOut' }}
                >
                    {timeString}
                </motion.div>
                <div className="timer-meta">
                    <span className="timer-percentage">{percentage}%</span>
                    <span className="timer-remaining">
                        {minutes} min {isRunning ? 'left' : 'remaining'}
                    </span>
                </div>
            </div>
        </CircularProgress>
    );
}
