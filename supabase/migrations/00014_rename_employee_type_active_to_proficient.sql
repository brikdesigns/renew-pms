-- =============================================================================
-- 00014: RENAME employee_type 'active' → 'proficient'
-- =============================================================================
-- 'active' conflicted semantically with is_active (employment status).
-- 'proficient' describes the final stage of the onboarding lifecycle:
--   new → maturing → proficient
-- =============================================================================

-- Step 1: drop old check constraint (actual name: practice_members_employee_status_check)
alter table public.practice_members
  drop constraint if exists practice_members_employee_status_check;

-- Step 2: update existing data
update public.practice_members
  set employee_type = 'proficient'
  where employee_type = 'active';

-- Step 3: re-add constraint with new allowed value
alter table public.practice_members
  add constraint practice_members_employee_status_check
  check (employee_type in ('new', 'maturing', 'proficient'));
