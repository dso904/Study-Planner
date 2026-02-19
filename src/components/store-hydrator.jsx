'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { tasksAtom, chaptersAtom, notesAtom, hydrationStatusAtom, loadFromSupabase } from '@/lib/atoms';

export default function StoreHydrator() {
    const setTasks = useSetAtom(tasksAtom);
    const setChapters = useSetAtom(chaptersAtom);
    const setNotes = useSetAtom(notesAtom);
    const setHydrationStatus = useSetAtom(hydrationStatusAtom);

    useEffect(() => {
        const doLoad = () => {
            setHydrationStatus('loading');
            loadFromSupabase(setTasks, setChapters, setNotes)
                .then(() => setHydrationStatus('done'))
                .catch(() => setHydrationStatus('error'));
        };

        // Initial load
        doLoad();

        // Re-sync when coming back online after a connection drop
        window.addEventListener('online', doLoad);
        return () => window.removeEventListener('online', doLoad);
    }, [setTasks, setChapters, setNotes, setHydrationStatus]);

    return null;
}
