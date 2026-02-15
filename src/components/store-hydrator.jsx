'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { tasksAtom, subjectsAtom, chaptersAtom, hydrateFromSupabase } from '@/lib/atoms';

export default function StoreHydrator() {
    const setTasks = useSetAtom(tasksAtom);
    const setSubjects = useSetAtom(subjectsAtom);
    const setChapters = useSetAtom(chaptersAtom);

    useEffect(() => {
        hydrateFromSupabase(setTasks, setSubjects, setChapters);
    }, [setTasks, setSubjects, setChapters]);

    return null;
}
