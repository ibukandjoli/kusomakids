-- Add generation tracking fields to generated_books table
-- Run this in Supabase SQL Editor

ALTER TABLE generated_books 
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS generation_error TEXT,
ADD COLUMN IF NOT EXISTS images_generated_count INTEGER DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_books_status ON generated_books(generation_status);

-- Add comment for documentation
COMMENT ON COLUMN generated_books.generation_status IS 'Status of image generation: pending, processing, completed, failed';
COMMENT ON COLUMN generated_books.images_generated_count IS 'Number of images successfully generated (should be 10 for complete book)';

-- Update existing books to 'pending' if they don't have images
UPDATE generated_books 
SET generation_status = 'pending'
WHERE generation_status IS NULL;
