ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onesignal_player_id text,
  ADD COLUMN IF NOT EXISTS reminder_time time DEFAULT '08:00:00';