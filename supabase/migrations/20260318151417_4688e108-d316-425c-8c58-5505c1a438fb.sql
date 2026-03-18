
-- Add content_type and steps to tracks
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'audio';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS steps jsonb;

-- Create journal_entries table for saving user responses
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  content text NOT NULL DEFAULT '',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id, step_number, entry_date)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for track media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('track-media', 'track-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for track-media
CREATE POLICY "Anyone can read track-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'track-media');

CREATE POLICY "Authenticated users can upload track-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'track-media');

CREATE POLICY "Authenticated users can update track-media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'track-media');
