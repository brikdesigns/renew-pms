-- =============================================================================
-- 00034: FIX PROFILES ADMIN MANAGE RLS RECURSION
-- =============================================================================
-- profiles_admin_manage policy used a raw subquery on profiles (which has RLS),
-- causing infinite recursion. Replace with get_my_system_role() which is
-- SECURITY DEFINER and bypasses RLS.
-- =============================================================================

drop policy if exists "profiles_admin_manage" on public.profiles;

create policy "profiles_admin_manage" on public.profiles
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );
