-- Add subscription fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_plan text,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;