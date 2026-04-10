-- =============================================================================
-- 00039: FIX TEAMS RLS — use SECURITY DEFINER helpers
-- =============================================================================
-- The initial teams RLS policies queried profiles directly, causing the same
-- infinite recursion bug fixed in 00035. Replace with is_admin_role() and
-- user_practice_ids() helpers.

-- ── Drop old policies ───────────────────────────────────────────────────────

drop policy if exists "teams_select" on public.teams;
drop policy if exists "teams_insert" on public.teams;
drop policy if exists "teams_update" on public.teams;
drop policy if exists "teams_delete" on public.teams;

-- ── Recreate with SECURITY DEFINER helpers ──────────────────────────────────

-- Read: any practice member
create policy "teams_select" on public.teams
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- Write: admin only
create policy "teams_admin_manage" on public.teams
  for all using (
    public.is_admin_role()
  );
