-- =============================================
-- Day Planner — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- ─── Tasks ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    subject_id  UUID,
    subject_name TEXT DEFAULT '',
    chapter_id  UUID,
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

-- ─── Subjects ────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    color       TEXT DEFAULT '#8b5cf6',
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Chapters ────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    status      TEXT DEFAULT 'not_started',
    sort_order  INT DEFAULT 0,
    notes       TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ────────────────
-- Disable RLS for simplicity (single-user app, using anon key)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon role (single-user, no auth)
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON chapters FOR ALL USING (true) WITH CHECK (true);

-- ─── Indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
