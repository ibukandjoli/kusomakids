-- Migration: Add Custom Story Support
-- Run this in Supabase SQL Editor

-- 1. Add fields for custom stories
ALTER TABLE public.generated_books
ADD COLUMN IF NOT EXISTS is_custom_story boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_prompt text;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.generated_books.is_custom_story IS 'True if the story was generated from scratch via Magic Story';
COMMENT ON COLUMN public.generated_books.user_prompt IS 'The original user idea/prompt for the story';

-- 3. Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'generated_books' AND column_name IN ('is_custom_story', 'user_prompt');
