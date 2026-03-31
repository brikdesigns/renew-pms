-- Fix ALL policies that subquery profiles.system_role directly.
-- Replace with get_my_system_role() (SECURITY DEFINER, bypasses RLS).
-- This prevents infinite recursion on the profiles table.

-- ═══════════════════════════════════════════════════════════════════
-- 1. PROFILES — the source of the recursion
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles
  for all using (
    public.get_my_system_role() = 'platform_admin'
  );

-- ═══════════════════════════════════════════════════════════════════
-- 2. PRACTICES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "practices_select" on public.practices;
create policy "practices_select" on public.practices
  for select using (
    id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "practices_admin_manage" on public.practices;
create policy "practices_admin_manage" on public.practices
  for all using (
    public.get_my_system_role() = 'platform_admin'
  );

-- ═══════════════════════════════════════════════════════════════════
-- 3. DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "departments_select" on public.departments;
create policy "departments_select" on public.departments
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "departments_practice_admin_manage" on public.departments;
create policy "departments_practice_admin_manage" on public.departments
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 4. PRACTICE ROLE TYPES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "practice_role_types_select" on public.practice_role_types;
create policy "practice_role_types_select" on public.practice_role_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "practice_role_types_admin_manage" on public.practice_role_types;
create policy "practice_role_types_admin_manage" on public.practice_role_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 5. PRACTICE MEMBERS
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "practice_members_select" on public.practice_members;
create policy "practice_members_select" on public.practice_members
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "practice_members_admin_manage" on public.practice_members;
create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 6. OFFICES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "offices_select" on public.offices;
create policy "offices_select" on public.offices
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "offices_admin_manage" on public.offices;
create policy "offices_admin_manage" on public.offices
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 7. ROOMS
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "rooms_admin_manage" on public.rooms;
create policy "rooms_admin_manage" on public.rooms
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 8. EQUIPMENT CATEGORIES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "equipment_categories_select" on public.equipment_categories;
create policy "equipment_categories_select" on public.equipment_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "equipment_categories_admin_manage" on public.equipment_categories;
create policy "equipment_categories_admin_manage" on public.equipment_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 9. EQUIPMENT
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "equipment_select" on public.equipment;
create policy "equipment_select" on public.equipment
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "equipment_admin_manage" on public.equipment;
create policy "equipment_admin_manage" on public.equipment
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 10. SUPPLY CATEGORIES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "supply_categories_select" on public.supply_categories;
create policy "supply_categories_select" on public.supply_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "supply_categories_admin_manage" on public.supply_categories;
create policy "supply_categories_admin_manage" on public.supply_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 11. TASK TYPES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "task_types_select" on public.task_types;
create policy "task_types_select" on public.task_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "task_types_admin_manage" on public.task_types;
create policy "task_types_admin_manage" on public.task_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 12. TASK CATEGORIES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "task_categories_select" on public.task_categories;
create policy "task_categories_select" on public.task_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "task_categories_admin_manage" on public.task_categories;
create policy "task_categories_admin_manage" on public.task_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 13. COMPLIANCE TYPES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "compliance_types_select" on public.compliance_types;
create policy "compliance_types_select" on public.compliance_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "compliance_types_admin_manage" on public.compliance_types;
create policy "compliance_types_admin_manage" on public.compliance_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 14. TASKS
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- ═══════════════════════════════════════════════════════════════════
-- 15. TRAINING MODULES
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "training_modules_select" on public.training_modules;
create policy "training_modules_select" on public.training_modules
  for select using (
    is_global = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

drop policy if exists "training_modules_admin_manage" on public.training_modules;
create policy "training_modules_admin_manage" on public.training_modules
  for all using (
    public.get_my_system_role() = 'platform_admin'
  );

-- ═══════════════════════════════════════════════════════════════════
-- 16. TRAINING PROGRESS
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "training_progress_select" on public.training_progress;
create policy "training_progress_select" on public.training_progress
  for select using (
    user_id = auth.uid()
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

-- ═══════════════════════════════════════════════════════════════════
-- 17. EMAIL LOG
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "email_log_admin_only" on public.email_log;
create policy "email_log_admin_only" on public.email_log
  for all using (
    public.get_my_system_role() = 'platform_admin'
  );
