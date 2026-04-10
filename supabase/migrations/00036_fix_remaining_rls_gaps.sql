-- =============================================================================
-- 00036: FIX REMAINING RLS GAPS
-- =============================================================================
-- Audit found 4 categories of issues after the system_role migration:
--
-- 1. CRITICAL: checklist_items + task_checklist_items have raw profile
--    subqueries → infinite recursion + reference old 'platform_admin' name
-- 2. CRITICAL: training_progress + email_log same issue
-- 3. LOW: Dead _delete policies on schedule_events, requests, vendors
--    reference old role names ('platform_admin', 'practice_admin') via
--    get_my_system_role() — no recursion but will never match
-- 4. LOW: notifications_insert references 'platform_admin' — dead fallback
--
-- All fixes use get_my_system_role() / is_admin_role() to avoid recursion.
-- =============================================================================


-- ── 1. checklist_items (template-level) ─────────────────────────────────────

drop policy if exists "checklist_items_select" on public.checklist_items;
create policy "checklist_items_select" on public.checklist_items
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- insert/update/delete use only user_practice_ids (no profile subquery, no role name)
-- but lack a brik_admin fallback. Add it.
drop policy if exists "checklist_items_insert" on public.checklist_items;
create policy "checklist_items_insert" on public.checklist_items
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "checklist_items_update" on public.checklist_items;
create policy "checklist_items_update" on public.checklist_items
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "checklist_items_delete" on public.checklist_items;
create policy "checklist_items_delete" on public.checklist_items
  for delete using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );


-- ── 2. task_checklist_items (per-task copies) ───────────────────────────────

drop policy if exists "task_checklist_items_select" on public.task_checklist_items;
create policy "task_checklist_items_select" on public.task_checklist_items
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_checklist_items_insert" on public.task_checklist_items;
create policy "task_checklist_items_insert" on public.task_checklist_items
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_checklist_items_update" on public.task_checklist_items;
create policy "task_checklist_items_update" on public.task_checklist_items
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_checklist_items_delete" on public.task_checklist_items;
create policy "task_checklist_items_delete" on public.task_checklist_items
  for delete using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );


-- ── 3. training_progress ────────────────────────────────────────────────────

drop policy if exists "training_progress_select" on public.training_progress;
create policy "training_progress_select" on public.training_progress
  for select using (
    user_id = auth.uid()
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- own_insert and own_update only check user_id = auth.uid(), no role refs. Safe.


-- ── 4. email_log ────────────────────────────────────────────────────────────

drop policy if exists "email_log_admin_only" on public.email_log;
create policy "email_log_admin_only" on public.email_log
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );


-- ── 5. Dead _delete policies with old role names ────────────────────────────
-- These use get_my_system_role() (safe, no recursion) but compare against
-- 'platform_admin'/'practice_admin' which no longer exist. They're covered
-- by the _admin_manage (for all) policies from 00035, but clean them up.

drop policy if exists "schedule_events_delete" on public.schedule_events;
create policy "schedule_events_delete" on public.schedule_events
  for delete using (
    public.is_admin_role()
  );

drop policy if exists "requests_delete" on public.requests;
create policy "requests_delete" on public.requests
  for delete using (
    public.is_admin_role()
  );

drop policy if exists "vendors_delete" on public.vendors;
create policy "vendors_delete" on public.vendors
  for delete using (
    public.is_admin_role()
  );


-- ── 6. notifications_insert ─────────────────────────────────────────────────

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );
