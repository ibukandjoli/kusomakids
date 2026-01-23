-- Migration: Fix PDF Credits & Unlocking
-- Purpose: Separate "Streaming Access" (is_unlocked) from "PDF Ownership" (pdf_unlocked)

-- 1. Add pdf_unlocked column
ALTER TABLE public.generated_books 
ADD COLUMN IF NOT EXISTS pdf_unlocked boolean DEFAULT false;

COMMENT ON COLUMN public.generated_books.pdf_unlocked IS 'Whether the PDF version has been purchased or unlocked with a credit';

-- 2. Backfill: 
-- Ideally, we only unlock PDFs for One-Time Purchases, not Club creations.
-- But we can't easily distinguish past data without payment records.
-- Strategy: Unlock ALL existing "is_unlocked" books to prevent breaking access for existing customers.
-- Moving forward, new Club creations will default to pdf_unlocked = false.
UPDATE public.generated_books 
SET pdf_unlocked = true 
WHERE is_unlocked = true;

-- 3. Ensure profiles has monthly_credits (should already exist, but safe to verify)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_credits integer DEFAULT 0;
