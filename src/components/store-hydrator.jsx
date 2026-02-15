'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { tasksAtom, chaptersAtom, notesAtom, hydrateFromSupabase } from '@/lib/atoms';

export default function StoreHydrator() {
    const [tasks, setTasks] = useAtom(tasksAtom);
    const [chapters, setChapters] = useAtom(chaptersAtom);
    const [notes, setNotes] = useAtom(notesAtom);

    useEffect(() => {
        hydrateFromSupabase(
            setTasks,
            setChapters,
            setNotes,
            () => tasks,
            () => chapters,
            () => notes,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTasks, setChapters, setNotes]);

    return null;
}
