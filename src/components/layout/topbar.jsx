'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAtom, useAtomValue } from 'jotai';
import { currentWeekStartAtom, notesPanelOpenAtom, notesAtom } from '@/lib/atoms';
import { timerOpenAtom, timerRunningAtom, timerSecondsAtom, timerModeAtom } from '@/lib/timer-atoms';
import { getWeekRangeLabel, isCurrentWeek } from '@/lib/dates';
import { Printer, StickyNote, Timer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import PrintModal from '@/components/print-modal';

const viewTitles = {
    '/': 'Week Planner',
    '/dashboard': 'Dashboard',
    '/subjects': 'Subjects & Chapters',
    '/backlogs': 'Backlogs',
};

export default function Topbar() {
    const pathname = usePathname();
    const currentWeekStart = useAtomValue(currentWeekStartAtom);
    const [printOpen, setPrintOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useAtom(notesPanelOpenAtom);
    const notes = useAtomValue(notesAtom) || [];
    const undoneCount = notes.filter((n) => !n.done).length;

    const [timerOpen, setTimerOpen] = useAtom(timerOpenAtom);
    const timerRunning = useAtomValue(timerRunningAtom);
    const timerSeconds = useAtomValue(timerSecondsAtom);
    const timerMode = useAtomValue(timerModeAtom);

    const formatTimerTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <>
            <header
                className="no-print h-16 min-h-16 px-6 flex items-center justify-between border-b border-white/8 sticky top-0 z-40"
                style={{
                    background: 'oklch(0.18 0.014 280 / 80%)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                {/* Left: Title + Week range */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-zinc-100">
                        {viewTitles[pathname] || 'Day Planner'}
                    </h1>
                    {pathname === '/' && (
                        <span
                            className={`text-xs mono px-2.5 py-1 rounded-md ${isCurrentWeek(currentWeekStart)
                                ? 'bg-rose-500/10 text-rose-300'
                                : 'bg-white/4 text-zinc-400'
                                }`}
                        >
                            {getWeekRangeLabel(currentWeekStart)}
                        </span>
                    )}
                </div>

                {/* Right: Timer + Notes + Print */}
                <div className="flex items-center gap-2">

                    {/* Timer toggle */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`relative text-zinc-400 hover:text-zinc-200 ${timerOpen ? 'text-cyan-400 bg-cyan-500/10' : ''}`}
                                    onClick={() => setTimerOpen(!timerOpen)}
                                >
                                    {timerMode === 'timer' ? (
                                        <Timer size={18} />
                                    ) : (
                                        <Clock size={18} />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Timer / Stopwatch</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Quick Notes toggle */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`relative text-zinc-400 hover:text-zinc-200 ${notesOpen ? 'text-amber-400 bg-amber-500/10' : ''}`}
                                    onClick={() => setNotesOpen(!notesOpen)}
                                >
                                    <StickyNote size={18} />
                                    {undoneCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                                            {undoneCount > 9 ? '9+' : undoneCount}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Quick Notes</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-zinc-400 hover:text-zinc-200"
                                    onClick={() => setPrintOpen(true)}
                                >
                                    <Printer size={18} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print daily routine</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </header>

            <PrintModal open={printOpen} onClose={() => setPrintOpen(false)} />
        </>
    );
}
