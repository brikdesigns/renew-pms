-- =============================================================================
-- 00041: ADD team_id TO equipment
-- =============================================================================
-- The equipment form has a Team field but the table was missing the backing
-- FK column. This adds it, referencing the teams table (created in 00038).

alter table public.equipment
  add column team_id uuid references public.teams(id) on delete set null;
