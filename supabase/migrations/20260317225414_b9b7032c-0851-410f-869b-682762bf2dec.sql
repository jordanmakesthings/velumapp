
-- New table: courses_v2 (module-based courses)
CREATE TABLE public.courses_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  course_type text NOT NULL DEFAULT 'audio',
  modules jsonb DEFAULT '[]'::jsonb,
  is_premium boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CourseV2 readable by all authenticated" ON public.courses_v2 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert courses_v2" ON public.courses_v2 FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update courses_v2" ON public.courses_v2 FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete courses_v2" ON public.courses_v2 FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- New table: lessons
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses_v2(id) ON DELETE CASCADE NOT NULL,
  media_url text,
  written_content text,
  downloadable_files jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons readable by all authenticated" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lessons" ON public.lessons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- New table: lesson_progress
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses_v2(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson_progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lesson_progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lesson_progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- New table: mastery_class_responses
CREATE TABLE public.mastery_class_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mastery_class_id uuid REFERENCES public.mastery_classes(id) ON DELETE CASCADE NOT NULL,
  mastery_class_title text,
  mastery_class_theme text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  responses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mastery_class_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mastery_class_responses" ON public.mastery_class_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mastery_class_responses" ON public.mastery_class_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add columns to tracks
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS lock_type text NOT NULL DEFAULT 'none';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS lock_days integer NOT NULL DEFAULT 0;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS order_in_course integer NOT NULL DEFAULT 0;

-- Add columns to mastery_classes
ALTER TABLE public.mastery_classes ADD COLUMN IF NOT EXISTS pause_prompts jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mastery_classes ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE public.mastery_classes ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add columns to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS estimated_weeks integer;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;
