-- Add assignment_mode to task_templates
-- Formalizes how tasks spawned from a template get picked up:
--   individual = assigned to a specific person
--   role       = visible to all members with a specific role
--   department = visible to all members in a department
--   pool       = visible to everyone, shared (e.g. Opening/Closing Office)

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS assignment_mode text NOT NULL DEFAULT 'individual'
    CHECK (assignment_mode IN ('individual', 'role', 'department', 'pool'));

-- Backfill: Opening/Closing Office templates are pool-based
UPDATE public.task_templates
  SET assignment_mode = 'pool'
  WHERE name IN ('Opening Office', 'Closing Office')
    AND is_default = true;
