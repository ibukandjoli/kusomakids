-- Migration: Create Download Tokens Table
-- Purpose: Secure, time-limited PDF download links without authentication

CREATE TABLE IF NOT EXISTS public.download_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid REFERENCES public.generated_books(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  email text NOT NULL,
  downloads_remaining integer DEFAULT 3,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for fast token lookup
CREATE INDEX idx_download_tokens_token ON public.download_tokens(token);
CREATE INDEX idx_download_tokens_book_email ON public.download_tokens(book_id, email);

-- RLS: Tokens are accessed via API only (no direct user access needed)
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all tokens
CREATE POLICY "Service role can manage tokens" 
  ON public.download_tokens 
  FOR ALL 
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.download_tokens IS 'Secure download tokens for purchased PDFs';
COMMENT ON COLUMN public.download_tokens.token IS 'Cryptographically random token (64 chars hex)';
COMMENT ON COLUMN public.download_tokens.downloads_remaining IS 'Number of downloads allowed (default 3)';
COMMENT ON COLUMN public.download_tokens.expires_at IS 'Token expiration (default 30 days from creation)';
