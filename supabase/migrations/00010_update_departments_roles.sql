-- =============================================================================
-- 00010: UPDATE DEPARTMENTS AND ROLES
-- =============================================================================
-- Replaces seeded department and role data with the Notion content mapping spec.
--
-- Sources:
--   Departments: https://www.notion.so/Departments-Key-2a797d34ed2880eaa286d3a22ffdf750
--   Roles:       https://www.notion.so/Roles-Key-2a797d34ed288065aeb1e2948db4680c
--
-- All child-table FKs reference departments/practice_role_types with
-- ON DELETE SET NULL, so deleting these rows nulls the FK columns without
-- removing child rows. Affected columns:
--   supply_categories.department_id
--   tasks.assigned_department, tasks.department_id
--   task_templates.department_id, task_templates.assigned_role_id
--   practice_members.practice_role_id  ← staff will need role reassigned in Settings
--
-- Also updates seed_practice_defaults() for future practice provisioning.
-- =============================================================================


-- ── 0. Fix pre-existing schema bug ───────────────────────────────────────────
-- supply_categories has a BEFORE UPDATE trigger (supply_categories_updated_at)
-- calling update_updated_at(), but was created without an updated_at column.
-- This causes a crash on any UPDATE — including the ON DELETE SET NULL cascade
-- when deleting departments below.

alter table public.supply_categories
  add column if not exists updated_at timestamptz not null default now();


-- ── 1. Wipe existing seeded reference data ────────────────────────────────────
-- Role types first (has FK to departments), then departments.

delete from public.practice_role_types;
delete from public.departments;


-- ── 2. Re-seed departments for every existing practice ────────────────────────
-- Color keys must match DepartmentColorKey in src/lib/tokens.ts
-- Valid keys: blue | green | purple | gold | red | taupe | brown

insert into public.departments (practice_id, name, color, sort_order, is_active)
select
  p.id,
  dept.name,
  dept.color,
  dept.sort_order,
  true
from public.practices p
cross join (values
  ('(G) All Departments',         'taupe',   1),
  ('(L) Leadership',              'gold',    2),
  ('(M) Management',              'purple',  3),
  ('(BA) Business Administration','green',   4),
  ('(C) Clinical',                'blue',    5),
  ('HR (Human Resources)',        'brown',   6),
  ('IT (Information Technology)', 'taupe',   7),
  ('Marketing',                   'red',     8),
  ('Finance',                     'gold',    9),
  ('Facilities',                  'taupe',   10)
) as dept(name, color, sort_order);


-- ── 3. Re-seed practice role types for every existing practice ────────────────
-- Roles spanning multiple departments (per Notion spec) are assigned to their
-- primary department. Secondary department shown in description.

do $$
declare
  rec                  record;
  dept_all_departments uuid;
  dept_leadership      uuid;
  dept_management      uuid;
  dept_ba              uuid;
  dept_clinical        uuid;
  dept_it              uuid;
begin
  for rec in select id from public.practices loop

    select id into dept_all_departments
      from public.departments where practice_id = rec.id and name = '(G) All Departments';
    select id into dept_leadership
      from public.departments where practice_id = rec.id and name = '(L) Leadership';
    select id into dept_management
      from public.departments where practice_id = rec.id and name = '(M) Management';
    select id into dept_ba
      from public.departments where practice_id = rec.id and name = '(BA) Business Administration';
    select id into dept_clinical
      from public.departments where practice_id = rec.id and name = '(C) Clinical';
    select id into dept_it
      from public.departments where practice_id = rec.id and name = 'IT (Information Technology)';

    insert into public.practice_role_types
      (practice_id, department_id, name, description, is_default, sort_order)
    values
      (rec.id, dept_leadership,      '(O) Owner',
       'The business owner and ultimate decision-maker. Oversees operations, strategy, finances, and growth.',
       true, 1),
      (rec.id, dept_clinical,        '(D) Doctor',
       'Licensed dentist responsible for patient diagnosis, treatment planning, and delivery of care.',
       true, 2),
      (rec.id, dept_management,      'Office Manager',
       'Oversees day-to-day administrative and operational functions. Acts as liaison between leadership and staff.',
       true, 3),
      (rec.id, dept_ba,              'Lead Business Administrator',
       'Senior administrative staff who manages the front-office team and ensures smooth patient and financial operations.',
       true, 4),
      (rec.id, dept_ba,              'Business Administrator',
       'Front-office coordinator responsible for patient scheduling, billing, and administrative support.',
       true, 5),
      (rec.id, dept_ba,              'Insurance Coordinator',
       'Handles insurance claims, verifications, and patient billing related to insurance coverage. Also spans Finance.',
       true, 6),
      (rec.id, dept_clinical,        'Clinical Manager',
       'Supervises clinical operations and staff. Ensures quality of patient care and compliance with clinical standards. Also spans Management.',
       true, 7),
      (rec.id, dept_clinical,        '(H) Dental Hygienist',
       'Licensed provider focused on preventive oral health care and patient education.',
       true, 8),
      (rec.id, dept_clinical,        '(A) Dental Assistant',
       'Supports doctors and hygienists in clinical procedures and patient care.',
       true, 9),
      (rec.id, dept_it,              'Third Party',
       'External vendors, contractors, or consultants who provide specialized services. Also spans Finance, Marketing, Facilities.',
       true, 10),
      (rec.id, dept_all_departments, 'Everyone',
       'Applies to all team members across the practice.',
       true, 11);

  end loop;
end;
$$;


-- ── 4. Update seed_practice_defaults for future practice provisioning ──────────

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
  -- Color keys: blue | green | purple | gold | red | taupe | brown
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
    (practice_id, department_id, name, description, is_default, sort_order)
  values
    (p_practice_id, dept_leadership,      '(O) Owner',
     'The business owner and ultimate decision-maker. Oversees operations, strategy, finances, and growth.',
     true, 1),
    (p_practice_id, dept_clinical,        '(D) Doctor',
     'Licensed dentist responsible for patient diagnosis, treatment planning, and delivery of care.',
     true, 2),
    (p_practice_id, dept_management,      'Office Manager',
     'Oversees day-to-day administrative and operational functions. Acts as liaison between leadership and staff.',
     true, 3),
    (p_practice_id, dept_ba,              'Lead Business Administrator',
     'Senior administrative staff who manages the front-office team and ensures smooth patient and financial operations.',
     true, 4),
    (p_practice_id, dept_ba,              'Business Administrator',
     'Front-office coordinator responsible for patient scheduling, billing, and administrative support.',
     true, 5),
    (p_practice_id, dept_ba,              'Insurance Coordinator',
     'Handles insurance claims, verifications, and patient billing related to insurance coverage. Also spans Finance.',
     true, 6),
    (p_practice_id, dept_clinical,        'Clinical Manager',
     'Supervises clinical operations and staff. Ensures quality of patient care and compliance with clinical standards. Also spans Management.',
     true, 7),
    (p_practice_id, dept_clinical,        '(H) Dental Hygienist',
     'Licensed provider focused on preventive oral health care and patient education.',
     true, 8),
    (p_practice_id, dept_clinical,        '(A) Dental Assistant',
     'Supports doctors and hygienists in clinical procedures and patient care.',
     true, 9),
    (p_practice_id, dept_it,              'Third Party',
     'External vendors, contractors, or consultants who provide specialized services. Also spans Finance, Marketing, Facilities.',
     true, 10),
    (p_practice_id, dept_all_departments, 'Everyone',
     'Applies to all team members across the practice.',
     true, 11);

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
