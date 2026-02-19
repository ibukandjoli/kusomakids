-- Secure Storage and RLS
-- 1. Secure the 'book-audio' bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'book-audio';

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow users to view their own audio files
-- Assuming the file path contains the bookId, and we can link bookId to user via generated_books table
-- However, storage policies can be complex joining other tables. 
-- A simpler approach for now: If the file path starts with their User ID? No, the path is `bookId/pageIndex`.
-- We need to check if the user OWNS the book that corresponds to the folder.

-- Drop existing policies to be safe/idempotent
DROP POLICY IF EXISTS "Users can view their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Service Role has full access" ON storage.objects;

-- Create Service Role Policy (Admin) - Full Access
CREATE POLICY "Service Role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create User Policy - Download/Select
-- Users can download files from 'book-audio' bucket IF they own the book.
-- This requires a join. 
-- NOTE: Cross-schema joins (storage -> public) can be permission-tricky. 
-- Often better to rely on Signed URLs (which we are moving to via Proxy) OR a security definer function.
-- BUT, since we implemented the /api/audio/proxy which uses SERVICE_ROLE to download, 
-- we can actually just DISALLOW public access entirely and rely SOLELY on the proxy.
-- So, strictly speaking, we don't even need a user policy for `book-audio` if the frontend ONLY uses the proxy.

-- Let's confirm: The frontend now uses `/api/audio/proxy?url=...`
-- The Proxy uses `supabaseAdmin.storage.from(...).download(...)`.
-- `supabaseAdmin` uses the SERVICE_ROLE key.
-- Therefore, we ONLY need the Service Role policy. Public/Anon access should be BLOCKED.

-- So, by setting `public = false` on the bucket and having NO policy for 'authenticated' or 'anon' roles,
-- we effectively lock it down to Service Role only. 
-- This is the MOST SECURE approach.

-- 4. Verify 'generated_books' RLS
ALTER TABLE public.generated_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own books" ON public.generated_books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.generated_books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.generated_books;

-- SELECT
CREATE POLICY "Users can view their own books"
ON public.generated_books
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own books"
ON public.generated_books
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own books"
ON public.generated_books
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Service Role Bypass for generated_books
DROP POLICY IF EXISTS "Service Role generated_books" ON public.generated_books;
CREATE POLICY "Service Role generated_books"
ON public.generated_books
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
