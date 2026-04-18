-- Drip-unlock system for course lessons
-- Lessons with drip_day_offset = N unlock N days after user's trial_started_at.
-- NULL = available immediately (legacy behavior).

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS drip_day_offset INTEGER;

COMMENT ON COLUMN public.lessons.drip_day_offset IS
  'Number of days after profile.trial_started_at before this lesson unlocks. NULL = available immediately.';

-- Set Meditation Made Easy: day 0 (now), day 1, day 2, ... in order
UPDATE public.lessons
SET drip_day_offset = order_index
WHERE course_id = 'cae02e1a-61a0-4c0f-a1b9-ae2297954b9d';
