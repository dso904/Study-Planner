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
-- Set NEXT_PUBLIC_SUPABASE_APP_SECRET in .env.local and configure
-- the DB secret with:
--   ALTER DATABASE postgres SET app.settings.app_secret = 'YOUR_SECRET';

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
