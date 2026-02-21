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
    Menu,
} from 'lucide-react';

const navItems = [
    { key: '/', label: 'Week Planner', icon: CalendarDays },
    { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: '/subjects', label: 'Subjects', icon: BookOpen },
    { key: '/backlogs', label: 'Backlogs', icon: AlertTriangle },
];

function NavItem({ item, active, collapsed }) {
    const content = (
        <Link
            href={item.key}
            aria-current={active ? 'page' : undefined}
            className={`
                sidebar-nav-item
                flex items-center gap-3 w-full rounded-xl transition-all duration-200 relative
                ${collapsed ? 'justify-center py-3 px-0' : 'py-2.5 px-4'}
                ${active ? 'active font-semibold text-white' : 'text-zinc-500 hover:text-zinc-200'}
            `}
        >
            <item.icon size={20} strokeWidth={1.8} className="relative z-10 shrink-0" />
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap text-sm relative z-10"
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
            className="no-print fixed left-0 top-0 bottom-0 flex flex-col overflow-hidden z-50 transition-[width] duration-300 border-r border-white/8"
            style={{
                width: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
                background: 'rgba(13,12,35,0.82)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            {/* Header: Hamburger + Logo */}
            <div
                className={`flex items-center border-b border-white/8 min-h-16 ${collapsed ? 'justify-center px-3 py-5' : 'px-4 py-5'}`}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/6 hover:text-zinc-200 transition-all flex-shrink-0"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Menu size={18} strokeWidth={2} />
                </button>

                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-3 ml-3 overflow-hidden"
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' }}>
                                <span className="text-white font-bold text-lg leading-none">D</span>
                            </div>
                            <span className="text-zinc-100 font-bold whitespace-nowrap">
                                Day Planner
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav items */}
            <div className={`flex-1 flex flex-col gap-1.5 ${collapsed ? 'px-2 py-4' : 'px-3 py-4'}`}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.key}
                        item={item}
                        active={pathname === item.key}
                        collapsed={collapsed}
                    />
                ))}
            </div>
        </nav>
    );
}
