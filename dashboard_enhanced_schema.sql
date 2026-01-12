-- Add child_id to generated_books
ALTER TABLE public.generated_books
ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id);

-- Optional: You might want to backfill data if possible, but for now we leave it null for old books.
