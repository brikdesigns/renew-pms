-- =============================================================================
-- 00009: SEED DEFAULT TEMPLATES
-- =============================================================================
-- Seeds the 8 default practice templates that were previously built from
-- real pen-and-paper practice workflows. Resolves all reference UUIDs by name
-- so this works for any practice that has had seed_practice_defaults() called.
--
-- Wrapped in a reusable function so new practices provisioned in the future
-- can also receive the defaults. The function is dropped after the initial
-- dev seed call at the bottom.
-- =============================================================================

create or replace function public.seed_template_defaults(p_practice_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  -- Task categories
  cat_cleaning         uuid;
  cat_admin            uuid;
  cat_training         uuid;
  cat_compliance       uuid;
  cat_patient_care     uuid;

  -- Compliance types
  ctype_infection      uuid;
  ctype_osha           uuid;

  -- Roles (null = all staff)
  role_office_mgr      uuid;
  role_hygienist       uuid;
  role_assistant       uuid;
  role_inventory       uuid;

  -- Departments
  dept_admin           uuid;
  dept_hr              uuid;
  dept_sterilization   uuid;
  dept_clinical        uuid;
  dept_global          uuid;

  -- Rooms
  room_supply          uuid;
  room_sterilization   uuid;
  room_operatory       uuid;

  -- Template IDs
  t1 uuid; t2 uuid; t3 uuid; t4 uuid;
  t5 uuid; t6 uuid; t7 uuid; t8 uuid;

begin

  -- Skip if defaults already seeded for this practice
  if exists (
    select 1 from public.task_templates
    where practice_id = p_practice_id and is_default = true
    limit 1
  ) then
    return;
  end if;

  -- ── Resolve reference IDs ──────────────────────────────────────────────────

  select id into cat_cleaning       from public.task_categories  where practice_id = p_practice_id and name = 'Cleaning';
  select id into cat_admin          from public.task_categories  where practice_id = p_practice_id and name = 'Administrative';
  select id into cat_training       from public.task_categories  where practice_id = p_practice_id and name = 'Training';
  select id into cat_compliance     from public.task_categories  where practice_id = p_practice_id and name = 'Compliance / Safety';
  select id into cat_patient_care   from public.task_categories  where practice_id = p_practice_id and name = 'Patient Care';

  select id into ctype_infection    from public.compliance_types where practice_id = p_practice_id and name = 'Infection Control';
  select id into ctype_osha         from public.compliance_types where practice_id = p_practice_id and name = 'OSHA';

  select id into role_office_mgr    from public.practice_role_types where practice_id = p_practice_id and name = 'Office Manager';
  select id into role_hygienist     from public.practice_role_types where practice_id = p_practice_id and name = 'Dental Hygienist';
  select id into role_assistant     from public.practice_role_types where practice_id = p_practice_id and name = 'Dental Assistant';
  select id into role_inventory     from public.practice_role_types where practice_id = p_practice_id and name = 'Inventory Manager';

  select id into dept_admin         from public.departments where practice_id = p_practice_id and name = 'Administration';
  select id into dept_hr            from public.departments where practice_id = p_practice_id and name = 'HR';
  select id into dept_sterilization from public.departments where practice_id = p_practice_id and name = 'Sterilization';
  select id into dept_clinical      from public.departments where practice_id = p_practice_id and name = 'Clinical';
  select id into dept_global        from public.departments where practice_id = p_practice_id and name = 'Global';

  select id into room_supply        from public.rooms where practice_id = p_practice_id and name = 'Supply / Storage';
  select id into room_sterilization from public.rooms where practice_id = p_practice_id and name = 'Sterilization Room';
  select id into room_operatory     from public.rooms where practice_id = p_practice_id and name = 'Operatory';

  -- ── Template 1: Daily Maintenance Checklist ────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    frequency, priority, status, requires_approval, estimated_duration,
    department_id, is_default
  ) values (
    p_practice_id,
    'Daily Maintenance Checklist',
    'Daily, weekly, and monthly maintenance tasks. Complete by end of shift.',
    'checklist', cat_cleaning,
    'daily', 'medium', 'active', false, 45,
    dept_admin, true
  ) returning id into t1;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t1, p_practice_id, 'Check and refill hand sanitizer stations',  0),
    (t1, p_practice_id, 'Clean countertops and surfaces',            1),
    (t1, p_practice_id, 'Empty trash bins and replace liners',       2),
    (t1, p_practice_id, 'Inspect and clean waiting area',            3),
    (t1, p_practice_id, 'Check inventory levels for supplies',       4),
    (t1, p_practice_id, 'Wipe down equipment and chairs',            5),
    (t1, p_practice_id, 'Vacuum floors',                             6),
    (t1, p_practice_id, 'Weekly: Deep clean restrooms',              7),
    (t1, p_practice_id, 'Weekly: Check HVAC filters',                8),
    (t1, p_practice_id, 'Monthly: Inspect emergency kits',           9),
    (t1, p_practice_id, 'Monthly: Test fire alarms',                 10);

  -- ── Template 2: Team Growth & Training ────────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    frequency, priority, status, requires_approval, assigned_role_id,
    department_id, is_default
  ) values (
    p_practice_id,
    'Team Growth & Training',
    'Training modules, team events, continuing education tracking. Ensure all team members complete required training.',
    'onboarding', cat_training,
    'monthly', 'medium', 'active', false, role_office_mgr,
    dept_hr, true
  ) returning id into t2;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t2, p_practice_id, 'Conduct daily team huddle',                             0),
    (t2, p_practice_id, 'Verify all staff arrived 15 min early',                 1),
    (t2, p_practice_id, 'Complete patient follow-up calls',                      2),
    (t2, p_practice_id, 'Schedule and confirm team meeting',                     3),
    (t2, p_practice_id, 'Schedule training session (LifeCore)',                  4),
    (t2, p_practice_id, 'Complete LifeCore Module 1: Patient communication',     5),
    (t2, p_practice_id, 'Complete LifeCore Module 2: Emergency procedures',      6),
    (t2, p_practice_id, 'Participate in group activities and role-playing',      7),
    (t2, p_practice_id, 'Collect sign-up sheets with names, dates, signatures',  8);

  -- ── Template 3: Supply Ordering ───────────────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    frequency, priority, status, requires_approval, estimated_duration,
    assigned_role_id, department_id, room_id, is_default
  ) values (
    p_practice_id,
    'Supply Ordering',
    'Weekly supply review and ordering workflow. Submit to supply manager when complete.',
    'request', cat_admin,
    'weekly', 'medium', 'active', true, 30,
    role_inventory, dept_admin, room_supply, true
  ) returning id into t3;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t3, p_practice_id, 'Review current supply inventory levels',               0),
    (t3, p_practice_id, 'Check gloves stock (all sizes)',                       1),
    (t3, p_practice_id, 'Check masks and PPE stock',                            2),
    (t3, p_practice_id, 'Identify items below reorder threshold',               3),
    (t3, p_practice_id, 'Fill out ordering form with item, qty, date',          4),
    (t3, p_practice_id, 'Submit order to supply manager for approval',          5);

  -- ── Template 4: Instrument Sterilization ──────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    compliance_type_id, frequency, priority, status, requires_approval,
    estimated_duration, assigned_role_id, department_id, room_id, is_default
  ) values (
    p_practice_id,
    'Instrument Sterilization',
    'Step-by-step sterilization procedure for dental instruments. Always wear PPE. Report any malfunctions immediately.',
    'procedure', cat_compliance,
    ctype_infection, 'per_shift', 'critical', 'active', true,
    60, role_assistant, dept_sterilization, room_sterilization, true
  ) returning id into t4;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t4, p_practice_id, 'Don PPE: gloves, masks, eyewear',                    0),
    (t4, p_practice_id, 'Pre-clean instruments in ultrasonic cleaner',         1),
    (t4, p_practice_id, 'Rinse with distilled water',                          2),
    (t4, p_practice_id, 'Dry and package in autoclave bags',                   3),
    (t4, p_practice_id, 'Load into autoclave, run cycle (121°C for 15 min)',   4),
    (t4, p_practice_id, 'Monitor indicators for completion',                   5),
    (t4, p_practice_id, 'Store in clean area',                                 6),
    (t4, p_practice_id, 'Log sterilization batch with date and initials',      7);

  -- ── Template 5: Patient Procedure Checklist ───────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    frequency, priority, status, requires_approval, estimated_duration,
    assigned_role_id, department_id, room_id, is_default
  ) values (
    p_practice_id,
    'Patient Procedure Checklist',
    'Patient intake and procedure checklist. Highlighted fields are required and gate task completion.',
    'compliance', cat_patient_care,
    'daily', 'high', 'active', true, 20,
    role_hygienist, dept_clinical, room_operatory, true
  ) returning id into t5;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t5, p_practice_id, 'Collect patient info: name, age, date',           0),
    (t5, p_practice_id, 'Record chief complaint',                          1),
    (t5, p_practice_id, 'Review medical history: allergies, medications',  2),
    (t5, p_practice_id, 'Review dental history: previous treatments',      3),
    (t5, p_practice_id, 'Complete physical exam: vital signs',             4),
    (t5, p_practice_id, 'Document treatment plan',                         5),
    (t5, p_practice_id, 'Obtain patient consent',                          6),
    (t5, p_practice_id, 'Schedule follow-up appointment',                  7);

  -- ── Template 6: A-Z Standard SOP List ────────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    frequency, priority, status, requires_approval,
    department_id, is_default
  ) values (
    p_practice_id,
    'A-Z Standard SOP List',
    'Master A-Z reference of standard operating procedures. Review annually. Focus-SOP Version 2.0.',
    'procedure', cat_compliance,
    'annually', 'low', 'active', false,
    dept_global, true
  ) returning id into t6;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t6, p_practice_id, 'A. Arrival Procedure: Greet patients promptly, check-in process',   0),
    (t6, p_practice_id, 'B. Billing: Process payments, insurance claims',                     1),
    (t6, p_practice_id, 'C. Cleaning Protocols: Daily surface disinfection',                  2),
    (t6, p_practice_id, 'D. Documentation: Update patient records accurately',               3),
    (t6, p_practice_id, 'E. Emergency Procedures: Follow posted emergency action plan',       4),
    (t6, p_practice_id, 'F. Fire Safety: Know evacuation routes and extinguisher locations',  5),
    (t6, p_practice_id, 'G. Glove Protocol: Proper donning and disposal',                    6),
    (t6, p_practice_id, 'H. Hygiene Practices: Hand washing between patients',               7),
    (t6, p_practice_id, 'I. Instrument Handling: Proper sterilization flow',                 8),
    (t6, p_practice_id, 'J. Job Duties: Review role-specific responsibilities',              9),
    (t6, p_practice_id, 'K. Key Management: Secure office keys and access codes',            10),
    (t6, p_practice_id, 'L. Lab Submissions: Proper labeling and tracking',                  11),
    (t6, p_practice_id, 'M. Medication Management: Verify and log all dispensed meds',       12),
    (t6, p_practice_id, 'N. New Patient Intake: Complete registration forms',                13),
    (t6, p_practice_id, 'O. OSHA Compliance: Follow posted safety guidelines',               14),
    (t6, p_practice_id, 'P. Patient Education: Provide post-treatment instructions',         15),
    (t6, p_practice_id, 'Q. Quality Assurance: Report and log errors or near-misses',        16),
    (t6, p_practice_id, 'R. Radiology: Follow radiation safety guidelines',                  17),
    (t6, p_practice_id, 'S. Scheduling: Optimize appointment flow and confirmations',        18),
    (t6, p_practice_id, 'T. Treatment Planning: Document and present to patient',            19),
    (t6, p_practice_id, 'U. Universal Precautions: PPE for all patient contact',             20),
    (t6, p_practice_id, 'V. Vendor Relations: Maintain supply chain contacts',               21),
    (t6, p_practice_id, 'W. Waste Disposal: Biohazard and sharps protocols',                 22),
    (t6, p_practice_id, 'X. X-Ray Procedures: Follow radiation safety guidelines',           23),
    (t6, p_practice_id, 'Y. Yearly Reviews: Annual equipment calibration',                   24),
    (t6, p_practice_id, 'Z. Zoning: Maintain clean zones in office',                        25);

  -- ── Template 7: Hand Hygiene Procedure ───────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    compliance_type_id, frequency, priority, status, requires_approval,
    estimated_duration, department_id, is_default
  ) values (
    p_practice_id,
    'Hand Hygiene Procedure',
    'Proper hand washing and sanitizer use between patients and procedures.',
    'procedure', cat_compliance,
    ctype_infection, 'per_shift', 'high', 'active', false,
    5, dept_global, true
  ) returning id into t7;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t7, p_practice_id, 'Wet hands with clean running water',                          0),
    (t7, p_practice_id, 'Apply soap and lather for at least 20 seconds',               1),
    (t7, p_practice_id, 'Scrub all surfaces: backs of hands, between fingers, under nails', 2),
    (t7, p_practice_id, 'Rinse thoroughly under clean running water',                  3),
    (t7, p_practice_id, 'Dry with clean towel or air dry',                             4),
    (t7, p_practice_id, 'Apply hand sanitizer when soap is not available',             5);

  -- ── Template 8: Compliance Training ──────────────────────────────────────

  insert into public.task_templates (
    practice_id, name, description, type, task_category_id,
    compliance_type_id, frequency, priority, status, requires_approval,
    estimated_duration, department_id, is_default
  ) values (
    p_practice_id,
    'Compliance Training',
    'Quarterly compliance training — OSHA, HIPAA, infection control certifications and renewals.',
    'compliance', cat_compliance,
    ctype_osha, 'quarterly', 'high', 'active', true,
    120, dept_global, true
  ) returning id into t8;

  insert into public.checklist_items (template_id, practice_id, label, sort_order) values
    (t8, p_practice_id, 'Complete OSHA safety training module',          0),
    (t8, p_practice_id, 'Complete HIPAA privacy training module',        1),
    (t8, p_practice_id, 'Complete infection control refresher',          2),
    (t8, p_practice_id, 'Review radiation safety guidelines',            3),
    (t8, p_practice_id, 'Review fire safety and evacuation procedures',  4),
    (t8, p_practice_id, 'Review emergency preparedness plan',            5),
    (t8, p_practice_id, 'Sign compliance acknowledgment form',           6);

end;
$$;


-- ── Seed the existing dev practice ────────────────────────────────────────────

do $$
declare
  p_id uuid;
begin
  select id into p_id from public.practices limit 1;
  if p_id is not null then
    perform public.seed_template_defaults(p_id);
  end if;
end;
$$;
