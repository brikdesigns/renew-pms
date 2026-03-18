-- Add reseller, integration config, and Trainual fields
-- Reseller-ready: nullable reseller_id on practices for future white-label pivot
-- Trainual integration: employee_status + trainual_user_id on practice_members
-- Integration config: practices.integrations jsonb for API keys (Trainual, GDrive)

alter table public.practices
  add column if not exists reseller_id uuid null,
  add column if not exists integrations jsonb not null default '{}';

-- Comment: integrations jsonb stores per-practice API config, e.g:
-- { "trainual": { "api_key": "..." }, "gdrive": { "folder_id": "..." } }
-- Always read server-side only — never expose to client.

alter table public.practice_members
  add column if not exists employee_status text not null default 'new'
    check (employee_status in ('new', 'maturing', 'active')),
  add column if not exists trainual_user_id text null;

comment on column public.practice_members.employee_status is
  'Employee lifecycle: new = recently onboarded, maturing = progressing, active = fully ramped. Used to personalize task workflows.';

comment on column public.practice_members.trainual_user_id is
  'Trainual person record ID. Populated on sync. Used to pull training completion and assignment status from Trainual API.';

create index if not exists idx_practice_members_employee_status
  on public.practice_members(employee_status);

create index if not exists idx_practice_members_trainual_user
  on public.practice_members(trainual_user_id);
