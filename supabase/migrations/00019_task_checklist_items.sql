-- =============================================================================
-- 00019: TASK CHECKLIST ITEMS (NESTED SUBTASKS)
-- =============================================================================
-- Adds:
-- 1. display_mode to task_templates ('nested' | 'expanded')
-- 2. template_id FK on tasks (tracks which template spawned the task)
-- 3. task_checklist_items table (per-task copies of template checklist items
--    with completion state)
--
-- When a task is created from a template with display_mode = 'nested',
-- the template's checklist_items are copied into task_checklist_items.
-- Each item tracks its own completion state per task instance.
-- =============================================================================


-- ── 1. Add display_mode to task_templates ───────────────────────────────────

alter table public.task_templates
  add column if not exists display_mode text not null default 'nested'
    check (display_mode in ('nested', 'expanded'));

comment on column public.task_templates.display_mode is
  'nested = items shown as subtasks inside a single board card; expanded = each item becomes its own board card';


-- ── 2. Add template_id FK on tasks ──────────────────────────────────────────

alter table public.tasks
  add column if not exists template_id uuid references public.task_templates(id) on delete set null;

create index if not exists idx_tasks_template on public.tasks(template_id);

comment on column public.tasks.template_id is
  'The template that spawned this task (null for ad-hoc tasks)';


-- ── 3. Create task_checklist_items ──────────────────────────────────────────

create table public.task_checklist_items (
  id                   uuid primary key default gen_random_uuid(),
  task_id              uuid not null references public.tasks(id) on delete cascade,
  practice_id          uuid not null references public.practices(id) on delete cascade,

  -- Content (copied from checklist_items at task creation time)
  label                text not null,
  sort_order           integer not null default 0,

  -- Optional context (copied from template checklist item)
  room_id              uuid references public.rooms(id) on delete set null,
  equipment_id         uuid references public.equipment(id) on delete set null,
  supply_category_id   uuid references public.supply_categories(id) on delete set null,

  -- Completion state (per task instance)
  is_completed         boolean not null default false,
  completed_at         timestamptz,
  completed_by         uuid references public.profiles(id),

  created_at           timestamptz not null default now()
);

create index idx_task_checklist_items_task on public.task_checklist_items(task_id);

alter table public.task_checklist_items enable row level security;

-- RLS: same pattern as tasks — practice members + platform_admin fallback
create policy "task_checklist_items_select" on public.task_checklist_items
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "task_checklist_items_insert" on public.task_checklist_items
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "task_checklist_items_update" on public.task_checklist_items
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "task_checklist_items_delete" on public.task_checklist_items
  for delete using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );
