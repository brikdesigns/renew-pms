-- =============================================================================
-- Fix profiles_select RLS — allow same-practice visibility
-- =============================================================================
--
-- Previously staff could only see their own profile (id = auth.uid()).
-- This broke cross-user joins (request submitter names, admin lookups for
-- notifications). Now practice members can see profiles of other members
-- in their practice.
-- =============================================================================

drop policy if exists profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or get_my_system_role() = 'platform_admin'
    or id in (
      select pm.user_id
      from public.practice_members pm
      where pm.practice_id in (select public.user_practice_ids(auth.uid()))
        and pm.is_active = true
    )
  );
