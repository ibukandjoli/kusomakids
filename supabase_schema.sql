-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends Auth Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  subscription_status text default 'free', -- 'free', 'active'
  credits integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles are viewable by owner
alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. STORY TEMPLATES Table (The Catalog)
create table public.story_templates (
  id uuid default uuid_generate_v4() primary key,
  theme_slug text unique not null,
  title_template text not null,
  description text,
  content_json jsonb not null, -- Stores the fixed 10-page structure
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Templates are readable by everyone
alter table public.story_templates enable row level security;
create policy "Templates are viewable by everyone" on story_templates for select using (true);


-- 3. GENERATED BOOKS Table (User Library)
create table public.generated_books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  template_id uuid references public.story_templates(id), -- Nullable if generated via AI completely
  child_name text not null,
  child_age integer,
  gender text,
  story_content jsonb not null, -- The final story with names injected
  is_unlocked boolean default false, -- False = Preview only, True = Full Access/PDF
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Users can only see their own books
alter table public.generated_books enable row level security;
create policy "Users can view own books" on generated_books for select using (auth.uid() = user_id);
create policy "Users can insert own books" on generated_books for insert with check (auth.uid() = user_id);
create policy "Users can update own books" on generated_books for update using (auth.uid() = user_id);
