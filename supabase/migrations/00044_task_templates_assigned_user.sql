-- =============================================================================
-- 00044: TASK TEMPLATES — assigned_user_id (Individual assignment mode)
-- =============================================================================
-- Adds the missing FK that "individual" assignment_mode needs to write to.
-- Three nullable FKs (assigned_user_id, assigned_role_id, department_id) plus
-- assignment_mode as the discriminator — no polymorphic columns. RLS keeps the
-- per-practice scoping; the FK gives us referential integrity.
--
-- Profiles is the right target: a user can outlive any single practice_member
-- row (re-invite, role change), and the relevant identity is the person.
-- Practice scoping is enforced at write time via RLS + API checks against
-- practice_members.
-- =============================================================================

alter table public.task_templates
  add column assigned_user_id uuid references public.profiles(id) on delete set null;

create index if not exists task_templates_assigned_user_id_idx
  on public.task_templates(assigned_user_id)
  where assigned_user_id is not null;

comment on column public.task_templates.assigned_user_id is
  'Individual assignee for assignment_mode = ''individual''. Null for role/department/pool modes.';
