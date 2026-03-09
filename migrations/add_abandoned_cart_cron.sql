-- 1. Add column to track sent emails
ALTER TABLE generated_books 
ADD COLUMN IF NOT EXISTS abandoned_cart_sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Enable necessary extensions for HTTP requests and cron jobs from the database
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the cron job to run every hour at minute 0
-- This calls the Edge Function 'abandoned-cart' using the project's URL and Anon Key
SELECT cron.schedule(
    'abandoned-cart-cron',
    '0 * * * *', -- Every hour
    $$
    SELECT net.http_post(
        url := 'https://jblpglsrehohumiczmjf.supabase.co/functions/v1/abandoned-cart',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibHBnbHNyZWhvaHVtaWN6bWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNDYwNDAsImV4cCI6MjA4MzYyMjA0MH0.igV-UuxxP3skTyTryPArTw7UHpHwQkrmhphYX7EhmmQ"}'::jsonb
    )
    $$
);
