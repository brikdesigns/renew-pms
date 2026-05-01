-- =============================================================================
-- 00047: Revert the failed seeded-default-recovery attempt
-- =============================================================================
-- Background: an earlier draft of this file tried to auto-recover the seeded
-- default templates' assignment FKs by name lookup against
-- practice_role_types and departments. The lookups assumed the names from
-- 00009 ('Administration', 'HR', 'Sterilization', 'Clinical', 'Global'),
-- but 00033 redefined seed_practice_defaults with different names
-- ('(BA) Business Administration', 'HR (Human Resources)', '(C) Clinical',
-- '(G) All Departments', etc.) — and 00033 ran AFTER 00009 in the migration
-- order. So the lookups returned NULL for most departments, and the UPDATE
-- ran with `department_id = NULL`, putting affected rows into a new partial-
-- damage state (assignment_mode='department' with NULL department_id) on top
-- of the original 00029 + 00046 damage we were trying to fix.
--
-- This migration:
--   1. Rolls back the partial-damage rows to the pre-attempt baseline (the
--      original 00029 + 00046 state, where assignment_mode='individual' and
--      no FKs are set). The seeded defaults remain visibly broken in the
--      Assignee column ("—"), but they're no worse than they were before.
--   2. Drops the helper function created by the failed attempt so it can't
--      be invoked accidentally.
--
-- The underlying data-quality issues are now tracked in
-- docs/qa/launch-checklist.md (Tier 0): both the existing-data corruption
-- AND the broken new-practice provisioning path through seed_template_defaults
-- (which still references pre-00033 names and silently fails to assign FKs
-- for any newly provisioned practice). A proper fix requires aligning
-- seed_template_defaults with 00033's reference data, plus a per-practice
-- audit of which seeded defaults map to which renamed dept/role.
-- =============================================================================

-- Reset partial-damage rows to the pre-attempt baseline. Tight predicate so
-- this only touches rows that landed in the impossible state created by the
-- reverted attempt — admin-edited templates won't match.
update public.task_templates
set assignment_mode = 'individual',
    updated_at      = now()
where is_default        = true
  and assignment_mode   = 'department'
  and department_id     is null
  and assigned_role_id  is null
  and assigned_member_id is null;

-- Drop the helper function from the failed attempt.
drop function if exists public.restore_default_template_assignments(uuid);
