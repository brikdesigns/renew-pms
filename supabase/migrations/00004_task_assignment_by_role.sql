-- Migration: Add role-based assignment to tasks
-- Tasks can now be assigned to a practice_role_type (e.g. "Dental Hygienist")
-- in addition to existing department and individual assignment.

-- Add assigned_role FK
alter table public.tasks
  add column assigned_role_id uuid references public.practice_role_types(id) on delete set null;

-- Index for role-based lookups
create index idx_tasks_assigned_role on public.tasks(assigned_role_id);

-- Add comment for clarity
comment on column public.tasks.assigned_role_id is
  'Role-based assignment — resolves to all practice_members holding this role';
comment on column public.tasks.assigned_to is
  'Direct individual assignment — takes precedence over role/department when set';
comment on column public.tasks.assigned_department is
  'Department-level assignment — all members in this department';
