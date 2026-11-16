-- How to weigh a written lesson plan against the lesson actually taught, when the
-- two disagree on a criterion-3 indicator. Set once per instructor in program settings.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_vs_execution TEXT NOT NULL DEFAULT 'balanced'
  CHECK (plan_vs_execution IN ('execution', 'balanced', 'planning'));
