
-- Add journal_prompt column to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS journal_prompt text;

-- Create course_journal_entries table
CREATE TABLE public.course_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses_v2(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  day_number integer NOT NULL DEFAULT 1,
  prompt text,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own course journal entries"
  ON public.course_journal_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course journal entries"
  ON public.course_journal_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course journal entries"
  ON public.course_journal_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course journal entries"
  ON public.course_journal_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
