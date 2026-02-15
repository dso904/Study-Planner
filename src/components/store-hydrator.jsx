'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { tasksAtom, chaptersAtom, hydrateFromSupabase } from '@/lib/atoms';

export default function StoreHydrator() {
    const setTasks = useSetAtom(tasksAtom);
    const setChapters = useSetAtom(chaptersAtom);

    useEffect(() => {
        hydrateFromSupabase(setTasks, setChapters);
    }, [setTasks, setChapters]);

    return null;
}
