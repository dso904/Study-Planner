'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const RADIUS = 85;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 6;

export default function CircularProgress({ progress, color = '#22d3ee', isRunning, children }) {
    const strokeDashoffset = useMemo(() => {
        return CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
    }, [progress]);

    return (
        <div className="timer-ring-container">
            <svg className="timer-ring-svg" viewBox="0 0 200 200">
                <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="50%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="timerGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <circle
                    className="timer-ring-bg"
                    cx="100"
                    cy="100"
                    r={RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={STROKE_WIDTH}
                />

                <motion.circle
                    className="timer-ring-progress"
                    cx="100"
                    cy="100"
                    r={RADIUS}
                    fill="none"
                    stroke="url(#timerGradient)"
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 100 100)"
                    filter="url(#timerGlow)"
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: isRunning ? 0 : 0.3,
                        ease: isRunning ? 'linear' : 'easeOut'
                    }}
                    style={{
                        opacity: isRunning ? 1 : 0.7,
                    }}
                />

                {isRunning && (
                    <circle
                        className="timer-ring-glow"
                        cx="100"
                        cy="100"
                        r={RADIUS + 8}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.15"
                        style={{
                            filter: 'blur(8px)',
                            strokeDasharray: CIRCUMFERENCE,
                            strokeDashoffset,
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                        }}
                    />
                )}
            </svg>

            <div className="timer-ring-content">
                {children}
            </div>
        </div>
    );
}
