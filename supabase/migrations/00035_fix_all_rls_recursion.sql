-- =============================================================================
-- 00035: FIX ALL RLS RECURSION
-- =============================================================================
-- Every RLS policy that reads from public.profiles via raw subquery
-- causes infinite recursion when profiles_select also reads practice_members
-- (which itself reads profiles). Fix: use SECURITY DEFINER helpers that
-- bypass RLS entirely.
--
-- Creates is_admin_role() helper alongside existing get_my_system_role().
-- Then rewrites EVERY policy that had raw profile subqueries.
-- =============================================================================


-- ── Helper: is_admin_role() ─────────────────────────────────────────────────
-- Returns true if the caller is brik_admin or admin. SECURITY DEFINER bypasses RLS.

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select system_role in ('brik_admin', 'admin') from public.profiles where id = auth.uid()),
    false
  )
$$;


-- ── Profiles ────────────────────────────────────────────────────────────────
-- profiles_select was already fixed in 00026/00033 (uses get_my_system_role)
-- profiles_admin_manage was fixed in 00034 (uses get_my_system_role)
-- No changes needed here.


-- ── Practices ───────────────────────────────────────────────────────────────

drop policy if exists "practices_select" on public.practices;
create policy "practices_select" on public.practices
  for select using (
    id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "practices_admin_manage" on public.practices;
create policy "practices_admin_manage" on public.practices
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );


-- ── Departments ─────────────────────────────────────────────────────────────

drop policy if exists "departments_select" on public.departments;
create policy "departments_select" on public.departments
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "departments_admin_manage" on public.departments;
drop policy if exists "departments_practice_admin_manage" on public.departments;
create policy "departments_admin_manage" on public.departments
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Practice Role Types ─────────────────────────────────────────────────────

drop policy if exists "practice_role_types_select" on public.practice_role_types;
create policy "practice_role_types_select" on public.practice_role_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "practice_role_types_admin_manage" on public.practice_role_types;
create policy "practice_role_types_admin_manage" on public.practice_role_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Practice Members ────────────────────────────────────────────────────────

drop policy if exists "practice_members_select" on public.practice_members;
create policy "practice_members_select" on public.practice_members
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "practice_members_admin_manage" on public.practice_members;
create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    public.is_admin_role()
  );


-- ── Offices ─────────────────────────────────────────────────────────────────

drop policy if exists "offices_select" on public.offices;
create policy "offices_select" on public.offices
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "offices_admin_manage" on public.offices;
create policy "offices_admin_manage" on public.offices
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Rooms ───────────────────────────────────────────────────────────────────

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "rooms_admin_manage" on public.rooms;
create policy "rooms_admin_manage" on public.rooms
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Equipment Categories ────────────────────────────────────────────────────

drop policy if exists "equipment_categories_select" on public.equipment_categories;
create policy "equipment_categories_select" on public.equipment_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "equipment_categories_admin_manage" on public.equipment_categories;
create policy "equipment_categories_admin_manage" on public.equipment_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Equipment ───────────────────────────────────────────────────────────────

drop policy if exists "equipment_select" on public.equipment;
create policy "equipment_select" on public.equipment
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "equipment_admin_manage" on public.equipment;
create policy "equipment_admin_manage" on public.equipment
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Supply Categories ───────────────────────────────────────────────────────

drop policy if exists "supply_categories_select" on public.supply_categories;
create policy "supply_categories_select" on public.supply_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "supply_categories_admin_manage" on public.supply_categories;
create policy "supply_categories_admin_manage" on public.supply_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Task Types ──────────────────────────────────────────────────────────────

drop policy if exists "task_types_select" on public.task_types;
create policy "task_types_select" on public.task_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_types_admin_manage" on public.task_types;
create policy "task_types_admin_manage" on public.task_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Task Categories ─────────────────────────────────────────────────────────

drop policy if exists "task_categories_select" on public.task_categories;
create policy "task_categories_select" on public.task_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_categories_admin_manage" on public.task_categories;
create policy "task_categories_admin_manage" on public.task_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Compliance Types ────────────────────────────────────────────────────────

drop policy if exists "compliance_types_select" on public.compliance_types;
create policy "compliance_types_select" on public.compliance_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "compliance_types_admin_manage" on public.compliance_types;
create policy "compliance_types_admin_manage" on public.compliance_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Tasks ───────────────────────────────────────────────────────────────────

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (
    public.is_admin_role()
  );


-- ── Training Modules ────────────────────────────────────────────────────────

drop policy if exists "training_modules_select" on public.training_modules;
create policy "training_modules_select" on public.training_modules
  for select using (
    is_global = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "training_modules_admin_manage" on public.training_modules;
create policy "training_modules_admin_manage" on public.training_modules
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );


-- ── Task Templates ──────────────────────────────────────────────────────────

drop policy if exists "task_templates_select" on public.task_templates;
create policy "task_templates_select" on public.task_templates
  for select using (
    is_default = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "task_templates_practice_manage" on public.task_templates;
create policy "task_templates_practice_manage" on public.task_templates
  for all using (
    (
      practice_id in (select public.user_practice_ids(auth.uid()))
      or public.get_my_system_role() = 'brik_admin'
    )
    and (
      is_default = false
      or public.is_admin_role()
    )
  );

drop policy if exists "task_templates_brik_manage" on public.task_templates;
drop policy if exists "task_templates_platform_manage" on public.task_templates;
create policy "task_templates_brik_manage" on public.task_templates
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );


-- ── Schedule Events ─────────────────────────────────────────────────────────

drop policy if exists "schedule_events_select" on public.schedule_events;
create policy "schedule_events_select" on public.schedule_events
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "schedule_events_admin_manage" on public.schedule_events;
create policy "schedule_events_admin_manage" on public.schedule_events
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Vendors ─────────────────────────────────────────────────────────────────

drop policy if exists "vendors_select" on public.vendors;
create policy "vendors_select" on public.vendors
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "vendors_admin_manage" on public.vendors;
create policy "vendors_admin_manage" on public.vendors
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Vendor Contacts ─────────────────────────────────────────────────────────

drop policy if exists "vendor_contacts_select" on public.vendor_contacts;
create policy "vendor_contacts_select" on public.vendor_contacts
  for select using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_contacts.vendor_id
      and (
        v.practice_id in (select public.user_practice_ids(auth.uid()))
        or public.get_my_system_role() = 'brik_admin'
      )
    )
  );

drop policy if exists "vendor_contacts_admin_manage" on public.vendor_contacts;
create policy "vendor_contacts_admin_manage" on public.vendor_contacts
  for all using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_contacts.vendor_id
      and v.practice_id in (select public.user_practice_ids(auth.uid()))
      and public.is_admin_role()
    )
  );


-- ── Requests ────────────────────────────────────────────────────────────────

drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "requests_admin_manage" on public.requests;
create policy "requests_admin_manage" on public.requests
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );


-- ── Notifications ───────────────────────────────────────────────────────────

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (
    user_id = auth.uid()
    or public.get_my_system_role() = 'brik_admin'
  );
