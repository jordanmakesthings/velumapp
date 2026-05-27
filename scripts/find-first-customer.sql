-- Find your first paying customer + everything we know about their path
-- Run in Supabase SQL editor

-- Replace with their email from Stripe
-- (Stripe Dashboard → Customers → newest → copy email)
\set target_email 'CUSTOMER_EMAIL_HERE'

select
  email,
  full_name,
  created_at as signed_up_at,
  trial_started_at,
  subscription_status,
  subscription_plan,
  stripe_customer_id,
  -- how long between signup and paid conversion
  age(now(), created_at) as time_in_funnel,
  -- did they come through /trial-free first?
  case
    when trial_started_at is not null then 'used /trial-free path'
    else 'went straight to /signup → Stripe'
  end as funnel_path
from profiles
where email = :'target_email';
