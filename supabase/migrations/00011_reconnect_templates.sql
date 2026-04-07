-- =============================================================================
-- 00011: RECONNECT TEMPLATES AND SUPPLY CATEGORIES
-- =============================================================================
-- Migration 00010 deleted the old departments/roles and replaced them with the
-- Notion content mapping spec. All FK columns that pointed to those rows were
-- set to NULL (ON DELETE SET NULL). This migration re-establishes those links
-- using the new department/role names.
--
-- Template → dept/role mapping rationale:
--   1  Daily Maintenance Checklist → Facilities (cleaning, HVAC, safety checks)
--   2  Team Growth & Training      → HR (Human Resources) / Office Manager
--   3  Supply Ordering             → (BA) Business Administration / Lead Business Administrator
--                                    (Inventory Manager role no longer exists — Lead BA is closest)
--   4  Instrument Sterilization    → (C) Clinical / (A) Dental Assistant
--   5  Patient Procedure Checklist → (C) Clinical / (H) Dental Hygienist
--   6  A-Z Standard SOP List       → (G) All Departments
--   7  Hand Hygiene Procedure      → (G) All Departments
--   8  Compliance Training         → (G) All Departments
-- =============================================================================

do $$
declare
  p_id           uuid;
  dept_all_depts uuid;
  dept_clinical  uuid;
  dept_hr        uuid;
  dept_ba        uuid;
  dept_facilities uuid;
  role_office_mgr uuid;
  role_lead_ba    uuid;
  role_assistant  uuid;
  role_hygienist  uuid;
begin

  select id into p_id from public.practices limit 1;

  -- Departments
  select id into dept_all_depts   from public.departments where practice_id = p_id and name = '(G) All Departments';
  select id into dept_clinical    from public.departments where practice_id = p_id and name = '(C) Clinical';
  select id into dept_hr          from public.departments where practice_id = p_id and name = 'HR (Human Resources)';
  select id into dept_ba          from public.departments where practice_id = p_id and name = '(BA) Business Administration';
  select id into dept_facilities  from public.departments where practice_id = p_id and name = 'Facilities';

  -- Roles
  select id into role_office_mgr  from public.practice_role_types where practice_id = p_id and name = 'Office Manager';
  select id into role_lead_ba     from public.practice_role_types where practice_id = p_id and name = 'Lead Business Administrator';
  select id into role_assistant   from public.practice_role_types where practice_id = p_id and name = '(A) Dental Assistant';
  select id into role_hygienist   from public.practice_role_types where practice_id = p_id and name = '(H) Dental Hygienist';

  -- ── Task Templates ─────────────────────────────────────────────────────────

  update public.task_templates
  set department_id = dept_facilities
  where practice_id = p_id and name = 'Daily Maintenance Checklist';

  update public.task_templates
  set department_id = dept_hr,
      assigned_role_id = role_office_mgr
  where practice_id = p_id and name = 'Team Growth & Training';

  update public.task_templates
  set department_id    = dept_ba,
      assigned_role_id = role_lead_ba
  where practice_id = p_id and name = 'Supply Ordering';

  update public.task_templates
  set department_id    = dept_clinical,
      assigned_role_id = role_assistant
  where practice_id = p_id and name = 'Instrument Sterilization';

  update public.task_templates
  set department_id    = dept_clinical,
      assigned_role_id = role_hygienist
  where practice_id = p_id and name = 'Patient Procedure Checklist';

  update public.task_templates
  set department_id = dept_all_depts
  where practice_id = p_id
    and name in ('A-Z Standard SOP List', 'Hand Hygiene Procedure', 'Compliance Training');

  -- ── Supply Categories ─────────────────────────────────────────────────────
  -- All seeded categories were under Clinical (dept_clinical) in the original seed.

  update public.supply_categories
  set department_id = dept_clinical
  where practice_id = p_id
    and name in (
      'Instruments',
      'PPE (Gloves, Masks, Eyewear)',
      'Disposables',
      'Autoclave Bags',
      'Cleaning Solutions',
      'Lab Materials',
      'Office Supplies'
    );

end;
$$;
