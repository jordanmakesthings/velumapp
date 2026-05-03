-- Recovery cohort: hit Stripe Checkout but never converted
-- Run in Supabase SQL editor (project: etghaosktmxloqivquvu)

select
  email,
  full_name,
  stripe_customer_id,
  subscription_status,
  subscription_plan,
  trial_started_at,
  created_at,
  case
    when trial_started_at is not null then 'already-used-trial-free'
    when stripe_customer_id is not null and subscription_status is null then 'abandoned-checkout'
    when subscription_status = 'past_due' then 'card-failed'
    when subscription_status = 'canceled' then 'canceled'
    else 'other'
  end as bucket
from profiles
where
  stripe_customer_id is not null
  and (subscription_status is null
       or subscription_status not in ('active','trialing'))
  and subscription_plan is distinct from 'lifetime'
order by created_at desc;
