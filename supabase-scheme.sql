-- =============================================
-- Day Planner — Supabase Schema (Cloud-First)
-- Run this in your Supabase SQL Editor
-- Drop all existing tables first if starting fresh:
--   DROP TABLE IF EXISTS tasks, chapters, subjects, notes CASCADE;
-- =============================================

-- ─── Tasks ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    subject_id  TEXT DEFAULT '',
    subject_name TEXT DEFAULT '',
    chapter_id  TEXT DEFAULT '',
    category    TEXT DEFAULT 'lecture',
    priority    TEXT DEFAULT 'medium',
    status      TEXT DEFAULT 'pending',
    date        DATE NOT NULL,
    start_time  TEXT DEFAULT '',
    end_time    TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    is_backlog  BOOLEAN DEFAULT FALSE,
    original_date DATE,
    time_spent  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Chapters ────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  TEXT NOT NULL,
    name        TEXT NOT NULL,
    status      TEXT DEFAULT 'not_started',
    sort_order  INT DEFAULT 0,
    notes       TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Notes (Quick Memos) ─────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text        TEXT NOT NULL,
    done        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ────────────────
-- Strategy: Custom header check using x-app-secret.
-- Set NEXT_PUBLIC_SUPABASE_APP_SECRET in .env.local to match the value below.
-- Security note: The Supabase URL is in .env.local (gitignored), so the
-- secret here is safe — nobody can connect without the URL.

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Require app secret" ON tasks;
DROP POLICY IF EXISTS "Require app secret" ON chapters;
DROP POLICY IF EXISTS "Require app secret" ON notes;

CREATE POLICY "Require app secret" ON tasks
    FOR ALL USING (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    ) WITH CHECK (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    );

CREATE POLICY "Require app secret" ON chapters
    FOR ALL USING (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    ) WITH CHECK (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    );

CREATE POLICY "Require app secret" ON notes
    FOR ALL USING (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    ) WITH CHECK (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    );

-- ─── Indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_done ON notes(done);

-- ─── I3-FIX: Auto-update updated_at on any row modification ────────────
-- This ensures updated_at is correct even for direct DB edits,
-- which is critical for conflict resolution in the merge logic.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tasks') THEN
        CREATE TRIGGER set_updated_at_tasks
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_chapters') THEN
        CREATE TRIGGER set_updated_at_chapters
            BEFORE UPDATE ON chapters
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_notes') THEN
        CREATE TRIGGER set_updated_at_notes
            BEFORE UPDATE ON notes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ─── Migration: Add time_spent column (run if table exists) ───────────
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0;

-- ─── Books (Library) ─────────────────────────────
CREATE TABLE IF NOT EXISTS books (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    author      TEXT DEFAULT '',
    publisher   TEXT DEFAULT '',
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Require app secret" ON books;
CREATE POLICY "Require app secret" ON books
    FOR ALL USING (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    ) WITH CHECK (
        current_setting('request.headers', true)::json->>'x-app-secret' = 'H6V$f%x@bN'
    );

CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_books') THEN
        CREATE TRIGGER set_updated_at_books
            BEFORE UPDATE ON books
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ─── Migration: Add book_id to tasks ─────────────
-- L3-FIX: Uncommented — this migration MUST be run if the books/library feature is active.
-- Without this column, task-modal book_id field will be silently dropped on upsert.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS book_id TEXT DEFAULT '';

-- L4-NOTE: subject_id is TEXT (not a foreign key) by design — subjects are hardcoded in
-- the frontend SUBJECTS array (atoms.js). If subjects are ever made dynamic, add a
-- subjects table and convert this to a proper FK.