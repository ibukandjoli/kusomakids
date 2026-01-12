-- 1. Update PROFILES table with Role
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('parent', 'grandparent', 'uncle_aunt', 'other'));

-- 2. Create CHILDREN table
CREATE TABLE IF NOT EXISTS public.children (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  first_name text NOT NULL,
  birth_date date,
  gender text CHECK (gender IN ('boy', 'girl')), -- kept simple for now as per requirements
  interests text[], -- Array of strings for tags
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS for Children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own children" 
ON public.children FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own children" 
ON public.children FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own children" 
ON public.children FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own children" 
ON public.children FOR DELETE 
USING (auth.uid() = user_id);
