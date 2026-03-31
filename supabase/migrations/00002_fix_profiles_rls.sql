-- Fix infinite recursion in profiles RLS policy.
-- The original policy queried profiles from within a profiles policy.
-- Solution: SECURITY DEFINER function bypasses RLS to read the role.

create or replace function public.get_my_system_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select system_role::text from public.profiles where id = auth.uid()
$$;

-- Drop the recursive policy
drop policy if exists "profiles_select" on public.profiles;

-- Recreate without recursion
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.get_my_system_role() = 'platform_admin'
  );
