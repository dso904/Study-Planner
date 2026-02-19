'use client';

import { useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { tasksAtom, chaptersAtom, notesAtom, hydrationStatusAtom, hydrateFromSupabase } from '@/lib/atoms';

export default function StoreHydrator() {
    const [tasks, setTasks] = useAtom(tasksAtom);
    const [chapters, setChapters] = useAtom(chaptersAtom);
    const [notes, setNotes] = useAtom(notesAtom);
    const setHydrationStatus = useSetAtom(hydrationStatusAtom);

    // H1-FIX: Use refs so hydrateFromSupabase always reads the latest local
    // state, not the empty arrays captured in the initial closure.
    const tasksRef = useRef(tasks);
    const chaptersRef = useRef(chapters);
    const notesRef = useRef(notes);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);
    useEffect(() => { chaptersRef.current = chapters; }, [chapters]);
    useEffect(() => { notesRef.current = notes; }, [notes]);

    useEffect(() => {
        // L5-FIX: Track hydration state for loading indicators
        setHydrationStatus('syncing');
        hydrateFromSupabase(
            setTasks,
            setChapters,
            setNotes,
            () => tasksRef.current,
            () => chaptersRef.current,
            () => notesRef.current,
        ).then(() => {
            setHydrationStatus('done');
        }).catch(() => {
            setHydrationStatus('error');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTasks, setChapters, setNotes, setHydrationStatus]);

    return null;
}

