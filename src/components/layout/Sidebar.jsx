'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAtom } from 'jotai';
import { sidebarCollapsedAtom } from '@/lib/atoms';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
    CalendarDays,
    LayoutDashboard,
    BookOpen,
    AlertTriangle,
    BarChart3,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const navItems = [
    { key: '/', label: 'Week Planner', icon: CalendarDays },
    { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: '/subjects', label: 'Subjects', icon: BookOpen },
    { key: '/backlogs', label: 'Backlogs', icon: AlertTriangle },
    { key: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function NavItem({ item, active, collapsed }) {
    const content = (
        <Link
            href={item.key}
            className={`
                flex items-center gap-3 w-full rounded-[10px] transition-all duration-150 relative
                ${collapsed ? 'justify-center py-2.5 px-0' : 'py-2.5 px-4'}
                ${active
                    ? 'bg-violet-500/12 text-violet-400 font-semibold'
                    : 'text-zinc-400 hover:bg-white/4 hover:text-zinc-200'}
            `}
        >
            {active && (
                <motion.div
                    layoutId="sidebar-active"
                    className={`absolute ${collapsed
                        ? 'bottom-[-2px] left-1/2 -translate-x-1/2 w-5 h-[3px]'
                        : 'left-0 top-1/2 -translate-y-1/2 w-[3px] h-6'
                        } rounded-sm bg-violet-400`}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
            <item.icon size={20} strokeWidth={1.8} />
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap text-sm"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </Link>
    );

    if (collapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return content;
}

export default function Sidebar() {
    const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
    const pathname = usePathname();

    return (
        <nav
            className="no-print fixed left-0 top-0 bottom-0 flex flex-col overflow-hidden z-50 transition-all duration-300 border-r border-white/8"
            style={{
                width: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
                background: 'oklch(0.15 0.012 280)',
            }}
        >
            {/* Logo */}
            <div
                className={`flex items-center gap-3 border-b border-white/8 min-h-16 ${collapsed ? 'justify-center px-3 py-5' : 'px-5 py-5'}`}
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg leading-none">D</span>
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-zinc-100 font-bold whitespace-nowrap"
                        >
                            Day Planner
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav items */}
            <div className={`flex-1 flex flex-col gap-1 ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        active={pathname === item.key}
                        collapsed={collapsed}
                    />
                ))}
            </div>

            {/* Collapse toggle */}
            <div className={`py-3 px-4 border-t border-white/8 flex ${collapsed ? 'justify-center' : 'justify-end'}`}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white/6 hover:text-zinc-200 transition-all"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </nav>
    );
}
