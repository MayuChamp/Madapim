-- Add instructor_id to students so each instructor sees only their own students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS instructor_id TEXT REFERENCES public.users(id);

-- Assign any existing students (created before this migration) to the initial admin
UPDATE public.students SET instructor_id = 'u1' WHERE instructor_id IS NULL;
