-- =============================================================================
-- 00046: Backfill task_templates assignment FKs to consistent per-mode state
-- =============================================================================
-- Mirrors the server-side normalization in src/app/api/templates/_helpers.ts.
-- Existing rows can carry stale FKs from before the AssignmentPicker enforced
-- mode-aware clearing — for example, a template that was originally saved
-- as role-mode then switched to individual still has its old role/department
-- FKs hanging around. The generator currently ignores those non-mode FKs via
-- a CASE on assignment_mode, but the rows themselves are inconsistent.
--
-- This UPDATE walks every row and force-nulls any FK that doesn't apply to
-- its mode. Idempotent — running it twice is a no-op.
-- =============================================================================

update public.task_templates
set
  assigned_member_id = case when assignment_mode = 'individual' then assigned_member_id end,
  assigned_role_id   = case when assignment_mode = 'role'       then assigned_role_id   end,
  department_id      = case when assignment_mode = 'department' then department_id      end
where
  (assignment_mode <> 'individual' and assigned_member_id is not null)
  or (assignment_mode <> 'role'       and assigned_role_id   is not null)
  or (assignment_mode <> 'department' and department_id      is not null);
