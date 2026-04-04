-- =============================================================================
-- 00008: TASK TEMPLATES + CHECKLIST ITEMS
-- =============================================================================
-- task_templates: reusable template configuration for checklists, procedures,
-- compliance tasks, requests, onboarding, and skill training.
--
-- checklist_items: individual items within a template, each optionally tied
-- to a room, a specific piece of equipment, or a supply category.
-- Flat nullable FK model — no type discriminator needed; FK presence is the type.
-- =============================================================================


-- =============================================================================
-- 1. TASK TEMPLATES
-- =============================================================================

create table public.task_templates (
  id                   uuid primary key default gen_random_uuid(),
  practice_id          uuid not null references public.practices(id) on delete cascade,

  -- Content
  name                 text not null,
  description          text,

  -- Type drives UI field visibility and behavior (not user-renameable).
  type                 text not null check (type in (
                         'checklist', 'procedure', 'compliance', 'request',
                         'onboarding', 'skill_training'
                       )),

  -- Classification (reference tables — user-renameable)
  task_category_id     uuid references public.task_categories(id) on delete set null,
  compliance_type_id   uuid references public.compliance_types(id) on delete set null,

  -- Default context: room scope for all items spawned from this template.
  -- Item-level room_id overrides this for individual steps.
  room_id              uuid references public.rooms(id) on delete set null,

  -- Assignment
  assigned_role_id     uuid references public.practice_role_types(id) on delete set null,
  department_id        uuid references public.departments(id) on delete set null,

  -- Scheduling / configuration (enums — scheduling logic depends on these values)
  frequency            text check (frequency in (
                         'daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly',
                         'semi_annually', 'annually', 'per_shift', 'custom'
                       )),
  priority             text not null default 'medium'
                         check (priority in ('low', 'medium', 'high', 'critical')),
  estimated_duration   integer, -- minutes
  requires_approval    boolean not null default false,

  -- Lifecycle
  status               text not null default 'draft'
                         check (status in ('draft', 'active', 'archived')),
  is_default           boolean not null default false, -- Brik-seeded templates; protected from deletion

  -- Audit
  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.task_templates enable row level security;

-- All practice members can read templates for their practice
create policy "task_templates_select" on public.task_templates
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- Any practice member can create custom templates
create policy "task_templates_insert" on public.task_templates
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

-- Any practice member can edit non-default templates;
-- default templates require platform_admin
create policy "task_templates_update" on public.task_templates
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (
      is_default = false
      or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
    )
  );

-- Only admins can delete, and default templates cannot be deleted
create policy "task_templates_delete" on public.task_templates
  for delete using (
    (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
    and is_default = false
  );


-- =============================================================================
-- 2. CHECKLIST ITEMS
-- =============================================================================
-- Individual items within a task_template. Each item may optionally be linked
-- to a room, a specific equipment asset, or a supply category.
--
-- All three context FKs are nullable and independent. An item can have:
--   - No FK = basic step (e.g. "Check and refill hand sanitizer")
--   - room_id only = room-scoped step (e.g. "Clean countertops in kitchen")
--   - equipment_id only = asset step (inherits room via equipment.room_id)
--   - equipment_id + room_id = portable asset or explicit room override
--   - supply_category_id = supply ordering step (e.g. "Reorder HVAC filters")
-- =============================================================================

create table public.checklist_items (
  id                   uuid primary key default gen_random_uuid(),
  template_id          uuid not null references public.task_templates(id) on delete cascade,
  practice_id          uuid not null references public.practices(id) on delete cascade,

  -- Content
  label                text not null,
  sort_order           integer not null default 0,

  -- Optional context (flat nullable FKs — no type discriminator)
  room_id              uuid references public.rooms(id) on delete set null,
  equipment_id         uuid references public.equipment(id) on delete set null,
  supply_category_id   uuid references public.supply_categories(id) on delete set null,

  created_at           timestamptz not null default now()
);

alter table public.checklist_items enable row level security;

create policy "checklist_items_select" on public.checklist_items
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "checklist_items_insert" on public.checklist_items
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "checklist_items_update" on public.checklist_items
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "checklist_items_delete" on public.checklist_items
  for delete using (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );
