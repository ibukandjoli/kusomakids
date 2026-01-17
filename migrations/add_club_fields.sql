-- Migration: Add Club Subscription and Onboarding Fields to Profiles
-- Run this in Supabase SQL Editor

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_credits integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing users to have onboarding_completed = true if they have a full_name
-- (Assume users with names have completed onboarding)
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE full_name IS NOT NULL AND full_name != '';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.monthly_credits IS 'Number of free PDF downloads remaining for club members (resets monthly)';
COMMENT ON COLUMN public.profiles.subscription_started_at IS 'Timestamp when user subscribed to Club Kusoma';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding process';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
