'use client';

import { useState, useEffect } from 'react';

// M1-FIX: Shared hook — single source of truth for mobile viewport detection
// Previously duplicated in client-layout.jsx and topbar.jsx
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [breakpoint]);
    return isMobile;
}
