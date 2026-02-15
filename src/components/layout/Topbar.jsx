'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAtom, useAtomValue } from 'jotai';
import { currentWeekStartAtom, notesPanelOpenAtom, notesAtom } from '@/lib/atoms';
import { getWeekRangeLabel, isCurrentWeek } from '@/lib/dates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Search, Printer, StickyNote } from 'lucide-react';
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

    return (
        <>
            <header
                className="no-print h-16 min-h-16 px-6 flex items-center justify-between border-b border-white/8 sticky top-0 z-40"
                style={{
                    background: 'oklch(0.14 0.012 280 / 80%)',
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
                                ? 'bg-violet-500/10 text-violet-300'
                                : 'bg-white/4 text-zinc-500'
                                }`}
                        >
                            {getWeekRangeLabel(currentWeekStart)}
                        </span>
                    )}
                </div>

                {/* Right: Search + Notes + Print */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 w-56 bg-white/4 border-transparent focus:bg-white/8 focus:border-violet-500/40 text-sm"
                        />
                    </div>

                    {/* Quick Notes toggle */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`relative text-zinc-500 hover:text-zinc-200 ${notesOpen ? 'text-amber-400 bg-amber-500/10' : ''}`}
                                    onClick={() => setNotesOpen(!notesOpen)}
                                >
                                    <StickyNote size={18} />
                                    {undoneCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-violet-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
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
                                    className="text-zinc-500 hover:text-zinc-200"
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
