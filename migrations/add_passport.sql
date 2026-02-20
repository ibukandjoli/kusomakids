-- Add passport/gamification fields to children table
ALTER TABLE children
ADD COLUMN IF NOT EXISTS passport_badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS books_read INTEGER DEFAULT 0;

-- Optional: Since reading progress is per book, we could also track "finished" state in a new table or just simple array.
-- For now, let's keep it simple and increment `books_read` when a book is generated/unlocked or read to the end.
