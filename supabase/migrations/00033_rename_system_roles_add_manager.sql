-- =============================================================================
-- 00033: RENAME SYSTEM ROLES + ADD MANAGER TIER
-- =============================================================================
-- Renames system_role values:
--   platform_admin → brik_admin
--   practice_admin → admin
-- Adds new tier:
--   manager — department-level elevated access (triage, approve, team metrics)
--
-- Also adds default_system_role to practice_role_types so each job function
-- suggests a permission tier when inviting new users.
--
-- system_role is a text column with a CHECK constraint (not a PG enum),
-- so the migration is: update rows → drop old constraint → add new constraint.
-- =============================================================================


-- ── 1. Drop old CHECK constraint first (must happen before renaming values) ──

alter table public.profiles
  drop constraint if exists profiles_system_role_check;


-- ── 2. Rename existing values ────────────────────────────────────────────────

update public.profiles set system_role = 'brik_admin' where system_role = 'platform_admin';
update public.profiles set system_role = 'admin'      where system_role = 'practice_admin';


-- ── 3. Add new CHECK constraint with all four tiers ─────────────────────────

alter table public.profiles
  add constraint profiles_system_role_check
    check (system_role in ('brik_admin', 'admin', 'manager', 'staff'));


-- ── 3. Update get_my_system_role() — no logic change, just documenting ──────
-- The function returns text, so it already works with the new values.
-- RLS policies reference the return value directly — we update them next.


-- ── 4. Update RLS policies that reference old role names ────────────────────
-- Pattern: replace 'platform_admin' → 'brik_admin' and 'practice_admin' → 'admin'
-- Also include 'manager' alongside 'admin' where admin-level access is needed.

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or public.get_my_system_role() = 'brik_admin'
  );

drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage" on public.profiles
  for all using (
    public.get_my_system_role() = 'brik_admin'
  );

-- practices
drop policy if exists "practices_select" on public.practices;
create policy "practices_select" on public.practices
  for select using (
    id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "practices_admin_manage" on public.practices;
create policy "practices_admin_manage" on public.practices
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

-- departments
drop policy if exists "departments_select" on public.departments;
create policy "departments_select" on public.departments
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "departments_practice_admin_manage" on public.departments;
create policy "departments_admin_manage" on public.departments
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- practice_role_types
drop policy if exists "practice_role_types_select" on public.practice_role_types;
create policy "practice_role_types_select" on public.practice_role_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "practice_role_types_admin_manage" on public.practice_role_types;
create policy "practice_role_types_admin_manage" on public.practice_role_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- practice_members
drop policy if exists "practice_members_select" on public.practice_members;
create policy "practice_members_select" on public.practice_members
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "practice_members_admin_manage" on public.practice_members;
create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- offices
drop policy if exists "offices_select" on public.offices;
create policy "offices_select" on public.offices
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "offices_admin_manage" on public.offices;
create policy "offices_admin_manage" on public.offices
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- rooms
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "rooms_admin_manage" on public.rooms;
create policy "rooms_admin_manage" on public.rooms
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- equipment_categories
drop policy if exists "equipment_categories_select" on public.equipment_categories;
create policy "equipment_categories_select" on public.equipment_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "equipment_categories_admin_manage" on public.equipment_categories;
create policy "equipment_categories_admin_manage" on public.equipment_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- equipment
drop policy if exists "equipment_select" on public.equipment;
create policy "equipment_select" on public.equipment
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "equipment_admin_manage" on public.equipment;
create policy "equipment_admin_manage" on public.equipment
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- supply_categories
drop policy if exists "supply_categories_select" on public.supply_categories;
create policy "supply_categories_select" on public.supply_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "supply_categories_admin_manage" on public.supply_categories;
create policy "supply_categories_admin_manage" on public.supply_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- task_types
drop policy if exists "task_types_select" on public.task_types;
create policy "task_types_select" on public.task_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "task_types_admin_manage" on public.task_types;
create policy "task_types_admin_manage" on public.task_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- task_categories
drop policy if exists "task_categories_select" on public.task_categories;
create policy "task_categories_select" on public.task_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "task_categories_admin_manage" on public.task_categories;
create policy "task_categories_admin_manage" on public.task_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- compliance_types
drop policy if exists "compliance_types_select" on public.compliance_types;
create policy "compliance_types_select" on public.compliance_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "compliance_types_admin_manage" on public.compliance_types;
create policy "compliance_types_admin_manage" on public.compliance_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- tasks
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (
    (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- training_modules
drop policy if exists "training_modules_select" on public.training_modules;
create policy "training_modules_select" on public.training_modules
  for select using (
    is_global = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "training_modules_admin_manage" on public.training_modules;
create policy "training_modules_admin_manage" on public.training_modules
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );


-- ── 5. Update RLS policies from later migrations ────────────────────────────

-- task_templates (00008, 00017, 00018)
drop policy if exists "task_templates_select" on public.task_templates;
create policy "task_templates_select" on public.task_templates
  for select using (
    is_default = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "task_templates_practice_manage" on public.task_templates;
create policy "task_templates_practice_manage" on public.task_templates
  for all using (
    (
      practice_id in (select public.user_practice_ids(auth.uid()))
      or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
    )
    and (
      is_default = false
      or (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
    )
  );

drop policy if exists "task_templates_brik_manage" on public.task_templates;
drop policy if exists "task_templates_platform_manage" on public.task_templates;
create policy "task_templates_brik_manage" on public.task_templates
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

-- schedule_events (00015)
drop policy if exists "schedule_events_select" on public.schedule_events;
create policy "schedule_events_select" on public.schedule_events
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "schedule_events_admin_manage" on public.schedule_events;
create policy "schedule_events_admin_manage" on public.schedule_events
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- vendors (00022)
drop policy if exists "vendors_select" on public.vendors;
create policy "vendors_select" on public.vendors
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "vendors_admin_manage" on public.vendors;
create policy "vendors_admin_manage" on public.vendors
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- vendor_contacts (00022)
drop policy if exists "vendor_contacts_select" on public.vendor_contacts;
create policy "vendor_contacts_select" on public.vendor_contacts
  for select using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_contacts.vendor_id
      and (
        v.practice_id in (select public.user_practice_ids(auth.uid()))
        or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
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
      and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
    )
  );

-- requests (00023)
drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

drop policy if exists "requests_admin_manage" on public.requests;
create policy "requests_admin_manage" on public.requests
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('brik_admin', 'admin')
  );

-- notifications (00025)
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (
    user_id = auth.uid()
    or (select system_role from public.profiles where id = auth.uid()) = 'brik_admin'
  );

-- profiles select fix (00026)
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or public.get_my_system_role() = 'brik_admin'
    or exists (
      select 1 from public.practice_members pm
      where pm.user_id = auth.uid()
      and pm.practice_id in (
        select pm2.practice_id from public.practice_members pm2
        where pm2.user_id = profiles.id
      )
    )
  );


-- ── 6. Add default_system_role to practice_role_types ───────────────────────

alter table public.practice_role_types
  add column if not exists default_system_role text not null default 'staff'
    check (default_system_role in ('admin', 'manager', 'staff'));

-- Set defaults for existing roles
update public.practice_role_types set default_system_role = 'admin'
  where name in ('Owner', '(O) Owner');

update public.practice_role_types set default_system_role = 'admin'
  where name in ('Doctor', '(D) Doctor');

update public.practice_role_types set default_system_role = 'admin'
  where name = 'Office Manager';

update public.practice_role_types set default_system_role = 'manager'
  where name = 'Lead Business Administrator';

update public.practice_role_types set default_system_role = 'manager'
  where name = 'Clinical Manager';

-- All others stay 'staff' (the column default)


-- ── 7. Update seed_practice_defaults with default_system_role ────────────────

create or replace function public.seed_practice_defaults(p_practice_id uuid, p_office_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  dept_all_departments  uuid;
  dept_leadership       uuid;
  dept_management       uuid;
  dept_ba               uuid;
  dept_clinical         uuid;
  dept_hr               uuid;
  dept_it               uuid;
  dept_marketing        uuid;
  dept_finance          uuid;
  dept_facilities       uuid;
begin

  -- ── Departments ──────────────────────────────────────────────────────────────
  insert into public.departments (practice_id, name, color, sort_order, is_active)
  values
    (p_practice_id, '(G) All Departments',         'taupe',   1, true),
    (p_practice_id, '(L) Leadership',               'gold',    2, true),
    (p_practice_id, '(M) Management',               'purple',  3, true),
    (p_practice_id, '(BA) Business Administration', 'green',   4, true),
    (p_practice_id, '(C) Clinical',                 'blue',    5, true),
    (p_practice_id, 'HR (Human Resources)',          'brown',   6, true),
    (p_practice_id, 'IT (Information Technology)',   'taupe',   7, true),
    (p_practice_id, 'Marketing',                     'red',     8, true),
    (p_practice_id, 'Finance',                       'gold',    9, true),
    (p_practice_id, 'Facilities',                    'taupe',   10, true);

  select id into dept_all_departments  from public.departments where practice_id = p_practice_id and name = '(G) All Departments';
  select id into dept_leadership       from public.departments where practice_id = p_practice_id and name = '(L) Leadership';
  select id into dept_management       from public.departments where practice_id = p_practice_id and name = '(M) Management';
  select id into dept_ba               from public.departments where practice_id = p_practice_id and name = '(BA) Business Administration';
  select id into dept_clinical         from public.departments where practice_id = p_practice_id and name = '(C) Clinical';
  select id into dept_hr               from public.departments where practice_id = p_practice_id and name = 'HR (Human Resources)';
  select id into dept_it               from public.departments where practice_id = p_practice_id and name = 'IT (Information Technology)';
  select id into dept_marketing        from public.departments where practice_id = p_practice_id and name = 'Marketing';
  select id into dept_finance          from public.departments where practice_id = p_practice_id and name = 'Finance';
  select id into dept_facilities       from public.departments where practice_id = p_practice_id and name = 'Facilities';

  -- ── Practice Role Types ───────────────────────────────────────────────────────
  insert into public.practice_role_types
    (practice_id, department_id, name, description, is_default, sort_order, default_system_role)
  values
    (p_practice_id, dept_leadership,      '(O) Owner',
     'The business owner and ultimate decision-maker. Oversees operations, strategy, finances, and growth.',
     true, 1, 'admin'),
    (p_practice_id, dept_clinical,        '(D) Doctor',
     'Licensed dentist responsible for patient diagnosis, treatment planning, and delivery of care.',
     true, 2, 'admin'),
    (p_practice_id, dept_management,      'Office Manager',
     'Oversees day-to-day administrative and operational functions. Acts as liaison between leadership and staff.',
     true, 3, 'admin'),
    (p_practice_id, dept_ba,              'Lead Business Administrator',
     'Senior administrative staff who manages the front-office team and ensures smooth patient and financial operations.',
     true, 4, 'manager'),
    (p_practice_id, dept_ba,              'Business Administrator',
     'Front-office coordinator responsible for patient scheduling, billing, and administrative support.',
     true, 5, 'staff'),
    (p_practice_id, dept_ba,              'Insurance Coordinator',
     'Handles insurance claims, verifications, and patient billing related to insurance coverage. Also spans Finance.',
     true, 6, 'staff'),
    (p_practice_id, dept_clinical,        'Clinical Manager',
     'Supervises clinical operations and staff. Ensures quality of patient care and compliance with clinical standards. Also spans Management.',
     true, 7, 'manager'),
    (p_practice_id, dept_clinical,        '(H) Dental Hygienist',
     'Licensed provider focused on preventive oral health care and patient education.',
     true, 8, 'staff'),
    (p_practice_id, dept_clinical,        '(A) Dental Assistant',
     'Supports doctors and hygienists in clinical procedures and patient care.',
     true, 9, 'staff'),
    (p_practice_id, dept_it,              'Third Party',
     'External vendors, contractors, or consultants who provide specialized services. Also spans Finance, Marketing, Facilities.',
     true, 10, 'staff'),
    (p_practice_id, dept_all_departments, 'Everyone',
     'Applies to all team members across the practice.',
     true, 11, 'staff');

  -- ── Rooms (seeded for primary office) ────────────────────────────────────────
  insert into public.rooms (office_id, practice_id, name, room_type, is_custom, sort_order)
  values
    (p_office_id, p_practice_id, 'Lobby',              'lobby',              false, 1),
    (p_office_id, p_practice_id, 'Front Office',        'front_office',       false, 2),
    (p_office_id, p_practice_id, 'Waiting Area',        'waiting_area',       false, 3),
    (p_office_id, p_practice_id, 'Operatory',           'operatory',          false, 4),
    (p_office_id, p_practice_id, 'Sterilization Room',  'sterilization_room', false, 5),
    (p_office_id, p_practice_id, 'X-Ray Room',          'xray_room',          false, 6),
    (p_office_id, p_practice_id, 'Lab',                 'lab',                false, 7),
    (p_office_id, p_practice_id, 'Consultation Room',   'consultation_room',  false, 8),
    (p_office_id, p_practice_id, 'Supply / Storage',    'supply_storage',     false, 9),
    (p_office_id, p_practice_id, 'Break Room',          'break_room',         false, 10),
    (p_office_id, p_practice_id, 'Restroom',            'restroom',           false, 11);

  -- ── Equipment Categories ──────────────────────────────────────────────────────
  insert into public.equipment_categories (practice_id, name, sort_order)
  values
    (p_practice_id, 'Dental Chair',       1),
    (p_practice_id, 'Autoclave',          2),
    (p_practice_id, 'X-Ray Machine',      3),
    (p_practice_id, 'Handpieces',         4),
    (p_practice_id, 'Suction System',     5),
    (p_practice_id, 'Ultrasonic Cleaner', 6),
    (p_practice_id, 'Air Compressor',     7),
    (p_practice_id, 'HVAC System',        8),
    (p_practice_id, 'Fire Alarm System',  9);

  -- ── Supply Categories ─────────────────────────────────────────────────────────
  insert into public.supply_categories (practice_id, department_id, name, sort_order)
  values
    (p_practice_id, dept_clinical, 'Instruments',                   1),
    (p_practice_id, dept_clinical, 'PPE (Gloves, Masks, Eyewear)',  2),
    (p_practice_id, dept_clinical, 'Disposables',                   3),
    (p_practice_id, dept_clinical, 'Autoclave Bags',                4),
    (p_practice_id, dept_clinical, 'Cleaning Solutions',            5),
    (p_practice_id, dept_clinical, 'Lab Materials',                 6),
    (p_practice_id, dept_clinical, 'Office Supplies',               7);

  -- ── Task Types ────────────────────────────────────────────────────────────────
  insert into public.task_types (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'Checklist',      true, 1),
    (p_practice_id, 'Procedure',      true, 2),
    (p_practice_id, 'Compliance',     true, 3),
    (p_practice_id, 'Skill Training', true, 4),
    (p_practice_id, 'Onboarding',     true, 5),
    (p_practice_id, 'Request',        true, 6);

  -- ── Task Categories ───────────────────────────────────────────────────────────
  insert into public.task_categories (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'Cleaning',             true, 1),
    (p_practice_id, 'Equipment',            true, 2),
    (p_practice_id, 'Maintenance',          true, 3),
    (p_practice_id, 'Inventory / Supplies', true, 4),
    (p_practice_id, 'Compliance / Safety',  true, 5),
    (p_practice_id, 'Patient Care',         true, 6),
    (p_practice_id, 'Training',             true, 7),
    (p_practice_id, 'Administrative',       true, 8);

  -- ── Compliance Types ──────────────────────────────────────────────────────────
  insert into public.compliance_types (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'OSHA',                   true, 1),
    (p_practice_id, 'HIPAA',                  true, 2),
    (p_practice_id, 'Infection Control',       true, 3),
    (p_practice_id, 'Radiation Safety',        true, 4),
    (p_practice_id, 'Fire Safety',             true, 5),
    (p_practice_id, 'Emergency Preparedness',  true, 6);

end;
$$;
