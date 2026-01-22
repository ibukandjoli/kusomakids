-- Create Analytics Table for simple visitor tracking
create table if not exists analytics_visits (
  id uuid default gen_random_uuid() primary key,
  page_path text not null,
  visitor_id text, -- Anonymous ID stored in cookie/localstorage
  user_id uuid references auth.users(id), -- Optional, if logged in
  referrer text,
  user_agent text,
  country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table analytics_visits enable row level security;

-- Policies
-- 1. Everyone can INSERT (Public logging)
create policy "Enable insert for everyone" on analytics_visits for insert with check (true);

-- 2. Only Admins can SELECT (View stats)
create policy "Admins can view all stats" on analytics_visits for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and (profiles.role = 'admin' or profiles.role = 'viewer')
  )
);

-- Index for performance
create index if not exists idx_analytics_created_at on analytics_visits(created_at);
create index if not exists idx_analytics_page_path on analytics_visits(page_path);
