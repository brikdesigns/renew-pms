-- =============================================================================
-- 00017: FIX PLATFORM_ADMIN RLS FOR TASK_TEMPLATES & CHECKLIST_ITEMS
-- =============================================================================
-- Platform admins (Brik staff) have no practice_members row, so
-- user_practice_ids() returns empty. The SELECT policy already has a
-- platform_admin fallback, but INSERT/UPDATE/DELETE do not.
-- This migration adds the same fallback to all write policies.
-- =============================================================================


-- ── task_templates ──────────────────────────────────────────────────────────

drop policy if exists "task_templates_insert" on public.task_templates;
create policy "task_templates_insert" on public.task_templates
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

drop policy if exists "task_templates_update" on public.task_templates;
create policy "task_templates_update" on public.task_templates
  for update using (
    (
      practice_id in (select public.user_practice_ids(auth.uid()))
      or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
    )
    and (
      is_default = false
      or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
    )
  );

drop policy if exists "task_templates_delete" on public.task_templates;
create policy "task_templates_delete" on public.task_templates
  for delete using (
    (
      practice_id in (select public.user_practice_ids(auth.uid()))
      or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
    )
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
    and is_default = false
  );


-- ── checklist_items ─────────────────────────────────────────────────────────

drop policy if exists "checklist_items_insert" on public.checklist_items;
create policy "checklist_items_insert" on public.checklist_items
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

drop policy if exists "checklist_items_update" on public.checklist_items;
create policy "checklist_items_update" on public.checklist_items
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

drop policy if exists "checklist_items_delete" on public.checklist_items;
create policy "checklist_items_delete" on public.checklist_items
  for delete using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );
