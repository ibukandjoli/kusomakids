-- Allow anonymous inserts for the seeding process
-- (You can remove this policy later if you want strict security, or keep it if you build an admin interface)
create policy "Enable insert for everyone" on public.story_templates for insert with check (true);

-- Ensure update/delete is also possible if needed for re-seeding
create policy "Enable update for everyone" on public.story_templates for update using (true);
create policy "Enable delete for everyone" on public.story_templates for delete using (true);
