-- Add Child Metadata to generated_books for re-generation context
ALTER TABLE generated_books ADD COLUMN IF NOT EXISTS child_age INTEGER;
ALTER TABLE generated_books ADD COLUMN IF NOT EXISTS child_gender TEXT;
ALTER TABLE generated_books ADD COLUMN IF NOT EXISTS child_photo_url TEXT;
