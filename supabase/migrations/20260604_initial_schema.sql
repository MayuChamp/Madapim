-- ─── Madapim DY — Initial Schema ──────────────────────────────────────────────
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS public.users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT DEFAULT 'instructor',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rubrics (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  semester      TEXT,
  total_points  INTEGER,
  criteria      JSONB DEFAULT '[]',
  instructor_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  school        TEXT,
  grade         TEXT,
  subject_track TEXT,
  status        TEXT DEFAULT 'not_started',
  initials      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cycles (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  track_type TEXT NOT NULL CHECK(track_type IN ('lesson_plan','observation')),
  topic      TEXT,
  subject    TEXT,
  date       TEXT,
  status     TEXT DEFAULT 'not_started',
  position   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.stages (
  id           TEXT PRIMARY KEY,
  cycle_id     TEXT NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  stage_key    TEXT NOT NULL,
  done         SMALLINT DEFAULT 0,
  date         TEXT,
  summary      TEXT,
  days_waiting INTEGER,
  position     SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.files (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  cycle_id      TEXT REFERENCES public.cycles(id),
  stage_key     TEXT,
  original_name TEXT,
  stored_path   TEXT,
  parsed_text   TEXT,
  file_type     TEXT,
  description   TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id                 TEXT PRIMARY KEY,
  student_id         TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rubric_id          TEXT DEFAULT 'r1',
  status             TEXT DEFAULT 'draft',
  instructor_answers JSONB DEFAULT '{}',
  draft_json         JSONB DEFAULT '{}',
  score              INTEGER,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS — server uses service_role key which bypasses it anyway,
-- but disabling avoids confusion if policies are ever misconfigured.
ALTER TABLE public.users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations DISABLE ROW LEVEL SECURITY;
