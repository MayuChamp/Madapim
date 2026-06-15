-- Add material_date to files: the date the material was created/taught,
-- separate from uploaded_at (when the file was uploaded to the system).
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS material_date DATE;
