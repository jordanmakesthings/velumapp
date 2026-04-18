-- Referral system: give-a-month-get-a-month

-- 1. Add referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit_months INTEGER NOT NULL DEFAULT 0;

-- 2. Generate referral codes for existing users (8-char alphanumeric, uppercase)
UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 3. Referrals table — one row per invited-signup pair
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up','subscribed','credited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 4. RLS — users can read their own referral rows (as referrer); service role does writes
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own outgoing referrals" ON public.referrals;
CREATE POLICY "users see own outgoing referrals" ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

-- 5. Generate referral_code automatically on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    -- 8-char uppercase alphanumeric, collision-retry up to 5x
    FOR attempt IN 1..5 LOOP
      NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT || attempt::TEXT) FROM 1 FOR 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = NEW.referral_code AND id <> NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- 6. Helper: attribute a new user to a referrer (called from client after signup)
CREATE OR REPLACE FUNCTION public.attribute_referral(p_referral_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_id UUID;
BEGIN
  v_referred_id := auth.uid();
  IF v_referred_id IS NULL THEN RETURN; END IF;

  -- Look up referrer by code (case-insensitive safety)
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE UPPER(referral_code) = UPPER(p_referral_code);

  IF v_referrer_id IS NULL OR v_referrer_id = v_referred_id THEN RETURN; END IF;

  -- Only set once
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = v_referred_id AND referred_by IS NULL;

  -- Insert referrals row if not already attributed
  INSERT INTO public.referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, v_referred_id, 'signed_up')
  ON CONFLICT (referred_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attribute_referral(TEXT) TO authenticated;

-- 7. Helper: count paid lifetime purchases for founding counter
-- (Uses profiles.subscription_plan='lifetime' as proxy for all lifetime purchases.
--  Webhook sets this regardless of price, which is correct for the counter.)
CREATE OR REPLACE FUNCTION public.founding_lifetime_remaining()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 100 - (
    SELECT COUNT(*)::INTEGER FROM public.profiles
    WHERE subscription_plan = 'lifetime'
  ));
$$;

GRANT EXECUTE ON FUNCTION public.founding_lifetime_remaining() TO anon, authenticated;
