-- The academic year a student belongs to, as the Hebrew year number
-- (5786 = תשפ"ו, 5787 = תשפ"ז). Instructors filter their students by it.
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year INTEGER;

-- Existing students: academic years run August–July, so a student created in
-- June 2026 belongs to 5786 (תשפ"ו) and one created in September 2026 to 5787 (תשפ"ז).
UPDATE public.students
SET academic_year = EXTRACT(YEAR FROM created_at)::int + 3761
                  - CASE WHEN EXTRACT(MONTH FROM created_at) < 8 THEN 1 ELSE 0 END
WHERE academic_year IS NULL;
