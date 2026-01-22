-- Add purchase tracking columns to generated_books
ALTER TABLE generated_books 
ADD COLUMN IF NOT EXISTS purchase_type text CHECK (purchase_type IN ('stripe', 'credit', 'club_creation', 'free_gift')),
ADD COLUMN IF NOT EXISTS purchase_amount numeric DEFAULT 0;

-- Optional: Backfill existing data
-- Assume unlocked books with no purchase type are 'stripe' purchases at 3000 FCFA?
-- Or leave null to represent legacy data.
-- Let's backfill for accurate stats:
UPDATE generated_books 
SET purchase_type = 'stripe', purchase_amount = 3000 
WHERE is_unlocked = true AND purchase_type IS NULL;
