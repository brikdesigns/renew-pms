-- ═══════════════════════════════════════════════════════════════════
-- 00048_rls_scope_tightening — defense-in-depth tightening for two
-- RLS policies surfaced by the 2026-05-03 pre-launch QA cold review.
--
-- Both gaps are not exploitable today (single-practice deployment +
-- API layer uses admin client for mutations), but they are structural
-- misconfigurations that must be corrected before multi-practice
-- onboarding. RLS is the last line of defense if the API layer ever
-- regresses or a future surface bypasses the existing token check.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Helper: is_brik_admin ─────────────────────────────────────────
-- Distinguishes Brik staff (cross-practice) from practice admins (own
-- practice only). Mirrors the shape of public.is_admin_role().
create or replace function public.is_brik_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select system_role = 'brik_admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

comment on function public.is_brik_admin() is
  'Returns true when the current auth.uid() is a brik_admin. Used by RLS '
  'policies that grant cross-practice access to Brik staff while restricting '
  'practice admins to their own practice via user_practice_ids().';


-- ─── #210: practice_members_admin_manage — add practice_id scope ────
-- Original (00035): for all using (public.is_admin_role()).
-- Gap: any admin/brik_admin with a session client could read/mutate
-- practice_members rows from any practice. Inert today (single-practice)
-- but would be exploitable post multi-practice onboarding.
-- Fix: keep the role check, but restrict practice admins to their own
-- practice. brik_admin retains cross-practice access.
drop policy if exists "practice_members_admin_manage" on public.practice_members;
create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    public.is_admin_role()
    and (
      public.is_brik_admin()
      or practice_id in (select public.user_practice_ids(auth.uid()))
    )
  );


-- ─── #209: vendor_messages_insert — add request_id co-condition ────
-- Original (00042): with check (sender_type = 'staff' and practice_id in (...)).
-- Gap: any practice staff could insert a vendor_messages row with any
-- request_id, as long as practice_id matched their own practice. The API
-- layer's token-scoping prevents this in normal operation, but RLS alone
-- would not block a Studio insert or a future route that bypasses the
-- token check.
-- Fix: also require the referenced request to belong to the same practice.
drop policy if exists "vendor_messages_insert" on public.vendor_messages;
create policy "vendor_messages_insert" on public.vendor_messages
  for insert with check (
    sender_type = 'staff'
    and practice_id in (select public.user_practice_ids(auth.uid()))
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.practice_id = vendor_messages.practice_id
    )
  );
