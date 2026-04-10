-- =============================================================================
-- 00038: CREATE TEAMS TABLE
-- =============================================================================
-- Teams sit within departments. A department can have multiple teams.
-- Practice members can be assigned to a team via practice_members.team_id.

create table public.teams (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references public.practices(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name          text not null,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.teams enable row level security;

-- Read: any practice member
create policy "teams_select" on public.teams
  for select using (
    exists (
      select 1 from public.practice_members pm
      where pm.practice_id = teams.practice_id
        and pm.user_id = auth.uid()
        and pm.is_active = true
    )
  );

-- Write: admin only (via SECURITY DEFINER functions or service role)
create policy "teams_insert" on public.teams
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.system_role in ('brik_admin', 'admin')
    )
  );

create policy "teams_update" on public.teams
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.system_role in ('brik_admin', 'admin')
    )
  );

create policy "teams_delete" on public.teams
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.system_role in ('brik_admin', 'admin')
    )
  );

-- Add team_id FK to practice_members
alter table public.practice_members
  add column team_id uuid references public.teams(id) on delete set null;
