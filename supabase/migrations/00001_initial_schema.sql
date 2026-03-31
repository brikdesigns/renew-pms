-- Prevent PostgreSQL from validating function bodies at definition time.
-- Required for migrations where helper functions reference tables defined later.
SET check_function_bodies = off;

-- =============================================================================
-- Renew PMS — Initial Schema
-- =============================================================================
--
-- Multi-tenant dental practice management platform.
--
-- Architecture principles:
--   - Use reference tables (not enums) for anything user-renameable/reorganizable
--   - Use enums only where app logic depends on the value (state machines, etc.)
--   - Practice-scoped isolation via RLS on every table
--   - Offices (buildings) → Rooms (spaces) — scales to multi-location practices
--   - System role (what you can DO) separate from Practice role (what you ARE)
--
-- Tables:
--   Core:       profiles, practices, practice_members
--   Reference:  departments, practice_role_types, task_types, task_categories,
--               compliance_types, equipment_categories, supply_categories
--   Locations:  offices, rooms
--   Assets:     equipment
--   Work:       tasks
--   Training:   training_modules, training_progress
--   System:     email_log
--
-- Integrations (future):
--   - Trainual: people-sync + completion status (API: people management only)
--   - Google Drive: file/doc source of truth
--
-- Reseller-ready: practices.reseller_id nullable for future white-label model
-- =============================================================================


-- =============================================================================
-- 1. PROFILES  (extends Supabase auth.users)
-- =============================================================================
-- system_role controls permissions (what you can DO):
--   platform_admin → Brik staff; full access across all practices
--   practice_admin  → designated admin of their practice; manage users/settings
--   staff           → standard team member; scoped to their practice data

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  system_role     text not null default 'staff'
                    check (system_role in ('platform_admin', 'practice_admin', 'staff')),
  first_name      text,
  last_name       text,
  full_name       text generated always as (
    case
      when first_name is not null and last_name is not null then first_name || ' ' || last_name
      when first_name is not null then first_name
      else last_name
    end
  ) stored,
  email           text not null,
  phone           text,
  avatar_url      text,
  invited_at      timestamptz,
  invited_by      uuid references auth.users(id),
  last_login_at   timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper to read own role without triggering RLS recursion on profiles
create or replace function public.get_my_system_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select system_role::text from public.profiles where id = auth.uid()
$$;

create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or public.get_my_system_role() = 'platform_admin'
  );

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_manage" on public.profiles
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );


-- =============================================================================
-- 2. PRACTICES  (tenant — the dental practice)
-- =============================================================================

create table public.practices (
  id              uuid primary key default gen_random_uuid(),
  reseller_id     uuid null,              -- reserved for future white-label pivot
  name            text not null,
  slug            text unique not null,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  zip             text,
  phone           text,
  email           text,
  website_url     text,
  logo_url        text,
  npi_number      text,
  tax_id          text,
  status          text not null default 'active'
                    check (status in ('active', 'inactive', 'suspended')),
  -- Per-practice API keys — server-side only, never expose to client
  -- shape: { trainual: { api_key }, gdrive: { folder_id } }
  integrations    jsonb not null default '{}',
  settings        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.practices enable row level security;


-- =============================================================================
-- 3. HELPER: user_practice_ids
-- =============================================================================
-- Used in RLS policies to scope data to the user's practice(s)

create or replace function public.user_practice_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select practice_id from public.practice_members
  where user_id = uid and is_active = true;
$$;

create policy "practices_select" on public.practices
  for select using (
    id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "practices_admin_manage" on public.practices
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );


-- =============================================================================
-- 4. DEPARTMENTS  (reference table — renameable per practice)
-- =============================================================================
-- Seeded with dental defaults when a practice is provisioned.
-- Practice admins can rename or add departments in settings.

create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  color       text,                       -- optional UI color tag
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.departments enable row level security;

create policy "departments_select" on public.departments
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "departments_practice_admin_manage" on public.departments
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 5. PRACTICE ROLE TYPES  (renameable job functions per practice)
-- =============================================================================
-- practice_role_type = what you ARE (job function/title).
-- Separate from system_role (profiles.system_role) = what you can DO.
-- Department is tied to the role type, not the individual member.
-- Practice admins can rename, add, or deactivate role types.

create table public.practice_role_types (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references public.practices(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name          text not null,
  is_default    boolean not null default false,  -- seeded default (can rename, can't delete)
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.practice_role_types enable row level security;

create policy "practice_role_types_select" on public.practice_role_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "practice_role_types_admin_manage" on public.practice_role_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 6. PRACTICE MEMBERS  (user ↔ practice join)
-- =============================================================================

create table public.practice_members (
  id                uuid primary key default gen_random_uuid(),
  practice_id       uuid not null references public.practices(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  practice_role_id  uuid references public.practice_role_types(id) on delete set null,

  -- Employee lifecycle — drives personalized task workflows + Trainual sync
  -- new: recently onboarded | maturing: progressing | active: fully ramped
  employee_status   text not null default 'new'
                      check (employee_status in ('new', 'maturing', 'active')),

  -- Shift is optional — not all practices use shift-based scheduling
  shift             text check (shift in ('opening', 'closing', 'evening', 'full_day')),

  -- Trainual sync: links member to their Trainual person record
  trainual_user_id  text null,

  is_active         boolean not null default true,
  joined_at         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(practice_id, user_id)
);

alter table public.practice_members enable row level security;

create policy "practice_members_select" on public.practice_members
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 7. OFFICES  (physical buildings — practice has one or more)
-- =============================================================================
-- Single-location practice: one office record.
-- Multi-location (future): multiple offices, each with their own rooms + equipment.

create table public.offices (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references public.practices(id) on delete cascade,
  name          text not null,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  zip           text,
  phone         text,
  email         text,
  is_primary    boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.offices enable row level security;

create policy "offices_select" on public.offices
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "offices_admin_manage" on public.offices
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 8. ROOMS  (spaces within an office)
-- =============================================================================
-- Seeded with common dental room types per office.
-- is_custom = true for practice-added rooms beyond the defaults.
-- room_type is a stable identifier used for default seeding and icon mapping;
-- name is the display label (renameable).

create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references public.offices(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  -- Stable type identifier — used for icons + seeding; display label is `name`
  room_type   text not null default 'other'
                check (room_type in (
                  'lobby', 'front_office', 'waiting_area', 'operatory',
                  'sterilization_room', 'xray_room', 'lab', 'consultation_room',
                  'supply_storage', 'break_room', 'restroom', 'other'
                )),
  is_custom   boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "rooms_select" on public.rooms
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "rooms_admin_manage" on public.rooms
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 9. EQUIPMENT CATEGORIES  (reference table — renameable)
-- =============================================================================

create table public.equipment_categories (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.equipment_categories enable row level security;

create policy "equipment_categories_select" on public.equipment_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "equipment_categories_admin_manage" on public.equipment_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 10. EQUIPMENT  (assets with full lifecycle tracking)
-- =============================================================================
-- Compliance docs, user guides, service history will attach to equipment records.
-- room_id nullable — some equipment is not room-specific (e.g. portable units).

create table public.equipment (
  id                    uuid primary key default gen_random_uuid(),
  practice_id           uuid not null references public.practices(id) on delete cascade,
  office_id             uuid not null references public.offices(id) on delete cascade,
  room_id               uuid references public.rooms(id) on delete set null,
  equipment_category_id uuid references public.equipment_categories(id) on delete set null,
  name                  text not null,
  manufacturer          text,
  model                 text,
  serial_number         text,
  purchase_date         date,
  warranty_expiry       date,
  last_maintained_at    timestamptz,
  next_maintenance_due  timestamptz,
  -- active: in normal use | needs_service: flagged | out_of_service: offline
  status                text not null default 'active'
                          check (status in ('active', 'needs_service', 'out_of_service')),
  compliance_notes      text,
  notes                 text,
  is_active             boolean not null default true,
  created_by            uuid references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.equipment enable row level security;

create policy "equipment_select" on public.equipment
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "equipment_member_insert" on public.equipment
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "equipment_admin_manage" on public.equipment
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 11. SUPPLY CATEGORIES  (reference table — renameable)
-- =============================================================================

create table public.supply_categories (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references public.practices(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name          text not null,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.supply_categories enable row level security;

create policy "supply_categories_select" on public.supply_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "supply_categories_admin_manage" on public.supply_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 12. TASK TYPES  (reference table — renameable)
-- =============================================================================
-- e.g. Skill Training, Onboarding, Compliance, Procedure, Request, Checklist

create table public.task_types (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.task_types enable row level security;

create policy "task_types_select" on public.task_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "task_types_admin_manage" on public.task_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 13. TASK CATEGORIES  (reference table — renameable)
-- =============================================================================
-- e.g. Equipment, Maintenance, Compliance/Safety, Patient Care, Training, Cleaning

create table public.task_categories (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.task_categories enable row level security;

create policy "task_categories_select" on public.task_categories
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "task_categories_admin_manage" on public.task_categories
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 14. COMPLIANCE TYPES  (reference table — renameable)
-- =============================================================================
-- e.g. OSHA, HIPAA, Radiation Safety, Infection Control, Fire Safety

create table public.compliance_types (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name        text not null,
  description text,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique(practice_id, name)
);

alter table public.compliance_types enable row level security;

create policy "compliance_types_select" on public.compliance_types
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "compliance_types_admin_manage" on public.compliance_types
  for all using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 15. TASKS
-- =============================================================================
-- The core workflow unit. Context FKs (room, equipment, supply_category) are all
-- nullable — a task may be tied to a location, an asset, a supply area, or none.
--
-- status/priority/frequency are enums — app logic (overdue computation,
-- filtering, recurrence) depends on these values. Not user-renameable.
--
-- assigned_to references practice_members (not profiles) — assignment is
-- practice-scoped. assigned_department_id allows department-level assignment.

create table public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  practice_id          uuid not null references public.practices(id) on delete cascade,

  -- Content
  title                text not null,
  description          text,

  -- Classification (reference tables — renameable)
  task_type_id         uuid references public.task_types(id) on delete set null,
  task_category_id     uuid references public.task_categories(id) on delete set null,
  compliance_type_id   uuid references public.compliance_types(id) on delete set null,

  -- Context: where / on what (all nullable)
  room_id              uuid references public.rooms(id) on delete set null,
  equipment_id         uuid references public.equipment(id) on delete set null,
  supply_category_id   uuid references public.supply_categories(id) on delete set null,

  -- Assignment
  assigned_to          uuid references public.practice_members(id) on delete set null,
  assigned_department  uuid references public.departments(id) on delete set null,

  -- Status (enum — maps to app state machine)
  status               text not null default 'not_started'
                         check (status in (
                           'not_started', 'in_progress', 'awaiting_approval',
                           'completed', 'blocked', 'skipped', 'overdue'
                         )),

  -- Priority (enum — drives sort/filter logic)
  priority             text not null default 'medium'
                         check (priority in ('low', 'medium', 'high', 'critical')),

  -- Recurrence (enum — drives scheduling logic; null = one-time task)
  frequency            text check (frequency in (
                         'daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly',
                         'semi_annually', 'annually', 'per_shift', 'custom'
                       )),

  -- Dates
  due_date             date,
  completed_at         timestamptz,

  -- Audit
  created_by           uuid references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "tasks_insert" on public.tasks
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "tasks_update" on public.tasks
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "tasks_delete" on public.tasks
  for delete using (
    (select system_role from public.profiles where id = auth.uid()) in ('platform_admin', 'practice_admin')
  );


-- =============================================================================
-- 16. TRAINING MODULES
-- =============================================================================

create table public.training_modules (
  id               uuid primary key default gen_random_uuid(),
  practice_id      uuid references public.practices(id) on delete cascade,
  title            text not null,
  description      text,
  content          text,
  category         text,
  difficulty       text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer,
  is_required      boolean not null default false,
  is_global        boolean not null default false,
  sort_order       integer not null default 0,
  status           text not null default 'draft'
                     check (status in ('draft', 'published', 'archived')),
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.training_modules enable row level security;

create policy "training_modules_select" on public.training_modules
  for select using (
    is_global = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "training_modules_admin_manage" on public.training_modules
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );


-- =============================================================================
-- 17. TRAINING PROGRESS
-- =============================================================================

create table public.training_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  module_id   uuid not null references public.training_modules(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'completed', 'failed')),
  score       integer,
  started_at  timestamptz,
  completed_at timestamptz,
  attempts    integer not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, module_id)
);

alter table public.training_progress enable row level security;

create policy "training_progress_select" on public.training_progress
  for select using (
    user_id = auth.uid()
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "training_progress_own_insert" on public.training_progress
  for insert with check (user_id = auth.uid());

create policy "training_progress_own_update" on public.training_progress
  for update using (user_id = auth.uid());


-- =============================================================================
-- 18. EMAIL LOG
-- =============================================================================

create table public.email_log (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id),
  to_email    text not null,
  subject     text not null,
  template    text,
  status      text not null default 'sent'
                check (status in ('sent', 'delivered', 'bounced', 'failed')),
  resend_id   text,
  metadata    jsonb default '{}',
  sent_at     timestamptz not null default now()
);

alter table public.email_log enable row level security;

create policy "email_log_admin_only" on public.email_log
  for all using (
    (select system_role from public.profiles where id = auth.uid()) = 'platform_admin'
  );


-- =============================================================================
-- 19. HELPER: auto-create profile on signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, system_role, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'system_role', 'staff'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- 20. HELPER: update_updated_at timestamp trigger
-- =============================================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at          before update on public.profiles          for each row execute function public.update_updated_at();
create trigger practices_updated_at         before update on public.practices         for each row execute function public.update_updated_at();
create trigger departments_updated_at       before update on public.departments       for each row execute function public.update_updated_at();
create trigger practice_role_types_updated_at before update on public.practice_role_types for each row execute function public.update_updated_at();
create trigger practice_members_updated_at  before update on public.practice_members  for each row execute function public.update_updated_at();
create trigger offices_updated_at           before update on public.offices           for each row execute function public.update_updated_at();
create trigger rooms_updated_at             before update on public.rooms             for each row execute function public.update_updated_at();
create trigger equipment_updated_at         before update on public.equipment         for each row execute function public.update_updated_at();
create trigger supply_categories_updated_at before update on public.supply_categories for each row execute function public.update_updated_at();
create trigger tasks_updated_at             before update on public.tasks             for each row execute function public.update_updated_at();
create trigger training_modules_updated_at  before update on public.training_modules  for each row execute function public.update_updated_at();
create trigger training_progress_updated_at before update on public.training_progress for each row execute function public.update_updated_at();


-- =============================================================================
-- 21. HELPER: seed_practice_defaults
-- =============================================================================
-- Called when Brik provisions a new practice.
-- Seeds all reference tables with dental-specific defaults from discovery data.
-- Practice admins can rename, reorder, or add to any of these after provisioning.

create or replace function public.seed_practice_defaults(p_practice_id uuid, p_office_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  dept_clinical       uuid;
  dept_front_desk     uuid;
  dept_engineering    uuid;
  dept_hr             uuid;
  dept_admin          uuid;
  dept_sterilization  uuid;
  dept_global         uuid;
begin

  -- ── Departments ──────────────────────────────────────────────────────────
  insert into public.departments (practice_id, name, sort_order, is_active)
  values
    (p_practice_id, 'Clinical',        1, true),
    (p_practice_id, 'Front Desk',      2, true),
    (p_practice_id, 'Engineering',     3, true),
    (p_practice_id, 'HR',              4, true),
    (p_practice_id, 'Administration',  5, true),
    (p_practice_id, 'Sterilization',   6, true),
    (p_practice_id, 'Global',          7, true);

  select id into dept_clinical      from public.departments where practice_id = p_practice_id and name = 'Clinical';
  select id into dept_front_desk    from public.departments where practice_id = p_practice_id and name = 'Front Desk';
  select id into dept_engineering   from public.departments where practice_id = p_practice_id and name = 'Engineering';
  select id into dept_hr            from public.departments where practice_id = p_practice_id and name = 'HR';
  select id into dept_admin         from public.departments where practice_id = p_practice_id and name = 'Administration';
  select id into dept_sterilization from public.departments where practice_id = p_practice_id and name = 'Sterilization';
  select id into dept_global        from public.departments where practice_id = p_practice_id and name = 'Global';

  -- ── Practice Role Types ───────────────────────────────────────────────────
  insert into public.practice_role_types (practice_id, department_id, name, is_default, sort_order)
  values
    (p_practice_id, dept_clinical,    'Owner',                   true, 1),
    (p_practice_id, dept_admin,       'Office Manager',          true, 2),
    (p_practice_id, dept_clinical,    'Dental Hygienist',        true, 3),
    (p_practice_id, dept_clinical,    'Dental Assistant',        true, 4),
    (p_practice_id, dept_front_desk,  'Receptionist',            true, 5),
    (p_practice_id, dept_front_desk,  'Treatment Coordinator',   true, 6),
    (p_practice_id, dept_front_desk,  'Insurance Coordinator',   true, 7),
    (p_practice_id, dept_engineering, 'Engineer',                true, 8),
    (p_practice_id, dept_engineering, 'Inventory Manager',       true, 9),
    (p_practice_id, dept_global,      'Manager',                 true, 10),
    (p_practice_id, dept_global,      'Admin',                   true, 11),
    (p_practice_id, dept_global,      'Staff',                   true, 12);

  -- ── Rooms (seeded for primary office) ────────────────────────────────────
  insert into public.rooms (office_id, practice_id, name, room_type, is_custom, sort_order)
  values
    (p_office_id, p_practice_id, 'Lobby',               'lobby',               false, 1),
    (p_office_id, p_practice_id, 'Front Office',         'front_office',        false, 2),
    (p_office_id, p_practice_id, 'Waiting Area',         'waiting_area',        false, 3),
    (p_office_id, p_practice_id, 'Operatory',            'operatory',           false, 4),
    (p_office_id, p_practice_id, 'Sterilization Room',   'sterilization_room',  false, 5),
    (p_office_id, p_practice_id, 'X-Ray Room',           'xray_room',           false, 6),
    (p_office_id, p_practice_id, 'Lab',                  'lab',                 false, 7),
    (p_office_id, p_practice_id, 'Consultation Room',    'consultation_room',   false, 8),
    (p_office_id, p_practice_id, 'Supply / Storage',     'supply_storage',      false, 9),
    (p_office_id, p_practice_id, 'Break Room',           'break_room',          false, 10),
    (p_office_id, p_practice_id, 'Restroom',             'restroom',            false, 11);

  -- ── Equipment Categories ──────────────────────────────────────────────────
  insert into public.equipment_categories (practice_id, name, sort_order)
  values
    (p_practice_id, 'Dental Chair',      1),
    (p_practice_id, 'Autoclave',         2),
    (p_practice_id, 'X-Ray Machine',     3),
    (p_practice_id, 'Handpieces',        4),
    (p_practice_id, 'Suction System',    5),
    (p_practice_id, 'Ultrasonic Cleaner',6),
    (p_practice_id, 'Air Compressor',    7),
    (p_practice_id, 'HVAC System',       8),
    (p_practice_id, 'Fire Alarm System', 9);

  -- ── Supply Categories ─────────────────────────────────────────────────────
  insert into public.supply_categories (practice_id, department_id, name, sort_order)
  values
    (p_practice_id, dept_clinical, 'Instruments',                  1),
    (p_practice_id, dept_clinical, 'PPE (Gloves, Masks, Eyewear)', 2),
    (p_practice_id, dept_clinical, 'Disposables',                  3),
    (p_practice_id, dept_clinical, 'Autoclave Bags',               4),
    (p_practice_id, dept_clinical, 'Cleaning Solutions',           5),
    (p_practice_id, dept_clinical, 'Lab Materials',                6),
    (p_practice_id, dept_clinical, 'Office Supplies',              7);

  -- ── Task Types ────────────────────────────────────────────────────────────
  insert into public.task_types (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'Checklist',      true, 1),
    (p_practice_id, 'Procedure',      true, 2),
    (p_practice_id, 'Compliance',     true, 3),
    (p_practice_id, 'Skill Training', true, 4),
    (p_practice_id, 'Onboarding',     true, 5),
    (p_practice_id, 'Request',        true, 6);

  -- ── Task Categories ───────────────────────────────────────────────────────
  insert into public.task_categories (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'Cleaning',             true, 1),
    (p_practice_id, 'Equipment',            true, 2),
    (p_practice_id, 'Maintenance',          true, 3),
    (p_practice_id, 'Inventory / Supplies', true, 4),
    (p_practice_id, 'Compliance / Safety',  true, 5),
    (p_practice_id, 'Patient Care',         true, 6),
    (p_practice_id, 'Training',             true, 7),
    (p_practice_id, 'Administrative',       true, 8);

  -- ── Compliance Types ──────────────────────────────────────────────────────
  insert into public.compliance_types (practice_id, name, is_default, sort_order)
  values
    (p_practice_id, 'OSHA',                   true, 1),
    (p_practice_id, 'HIPAA',                  true, 2),
    (p_practice_id, 'Infection Control',       true, 3),
    (p_practice_id, 'Radiation Safety',        true, 4),
    (p_practice_id, 'Fire Safety',             true, 5),
    (p_practice_id, 'Emergency Preparedness',  true, 6);

end;
$$;


-- =============================================================================
-- 22. INDEXES
-- =============================================================================

create index idx_profiles_system_role        on public.profiles(system_role);
create index idx_profiles_email              on public.profiles(email);
create index idx_practices_slug              on public.practices(slug);
create index idx_practices_status            on public.practices(status);
create index idx_departments_practice        on public.departments(practice_id);
create index idx_practice_role_types_practice on public.practice_role_types(practice_id);
create index idx_practice_members_practice   on public.practice_members(practice_id);
create index idx_practice_members_user       on public.practice_members(user_id);
create index idx_practice_members_role       on public.practice_members(practice_role_id);
create index idx_offices_practice            on public.offices(practice_id);
create index idx_rooms_office                on public.rooms(office_id);
create index idx_rooms_practice              on public.rooms(practice_id);
create index idx_equipment_practice          on public.equipment(practice_id);
create index idx_equipment_room              on public.equipment(room_id);
create index idx_equipment_status            on public.equipment(status);
create index idx_supply_categories_practice  on public.supply_categories(practice_id);
create index idx_task_types_practice         on public.task_types(practice_id);
create index idx_task_categories_practice    on public.task_categories(practice_id);
create index idx_compliance_types_practice   on public.compliance_types(practice_id);
create index idx_tasks_practice              on public.tasks(practice_id);
create index idx_tasks_assigned_to           on public.tasks(assigned_to);
create index idx_tasks_status                on public.tasks(status);
create index idx_tasks_priority              on public.tasks(priority);
create index idx_tasks_due_date              on public.tasks(due_date);
create index idx_tasks_room                  on public.tasks(room_id);
create index idx_tasks_equipment             on public.tasks(equipment_id);
create index idx_training_modules_practice   on public.training_modules(practice_id);
create index idx_training_modules_status     on public.training_modules(status);
create index idx_training_progress_user      on public.training_progress(user_id);
create index idx_training_progress_module    on public.training_progress(module_id);
create index idx_training_progress_practice  on public.training_progress(practice_id);
