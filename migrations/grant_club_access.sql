-- Upgrade User to Club Member (Manual Override)
-- Run this in Supabase SQL Editor

UPDATE public.profiles
SET 
  subscription_status = 'active',
  monthly_credits = 10,  -- Giving you 10 credits for testing!
  subscription_started_at = NOW()
WHERE email = 'ibuka.ndjoli@gmail.com';

-- Verify the update
SELECT email, subscription_status, monthly_credits 
FROM public.profiles 
WHERE email = 'ibuka.ndjoli@gmail.com';
