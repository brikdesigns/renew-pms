-- Renew PMS — Initial Schema
-- Multi-tenant dental practice management + training platform
--
-- Tables: profiles, practices, practice_members, tasks, training_modules,
--         training_progress, email_log
-- Auth: Row-Level Security with practice-scoped isolation
-- Roles: platform_admin, practice_admin, staff
--
-- Integrations planned:
--   - Trainual: people-sync + assignment/completion status (API: people management only,
--               cannot read content). Used to drive employee_status and personalized workflows.
--   - Google Drive: file/doc source of truth for the practice
--
-- Reseller-ready: practices.reseller_id is nullable for future white-label/reseller model

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('platform_admin', 'practice_admin', 'staff')),
  first_name text,
  last_name text,
  full_name text generated always as (
    case
      when first_name is not null and last_name is not null then first_name || ' ' || last_name
      when first_name is not null then first_name
      else last_name
    end
  ) stored,
  email text not null,
  phone text,
  job_title text,
  avatar_url text,
  invited_at timestamptz,
  invited_by uuid references auth.users(id),
  last_login_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_manage" on public.profiles
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- ============================================
-- 2. PRACTICES (dental practice / tenant)
-- ============================================
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  -- Future reseller/white-label support (nullable until needed)
  reseller_id uuid null,
  name text not null,
  slug text unique not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  website_url text,
  logo_url text,
  npi_number text,
  tax_id text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  -- Integration config stored here (e.g. trainual_api_key, gdrive_folder_id)
  -- Never expose service-role to client — read via server-side API routes only
  integrations jsonb not null default '{}',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practices enable row level security;

-- ============================================
-- 3. PRACTICE MEMBERS (user ↔ practice join)
-- ============================================
create table public.practice_members (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'manager', 'staff', 'viewer')),
  -- Employee lifecycle status — used to personalize task workflows
  -- new: recently onboarded, maturing: progressing, active: fully ramped
  employee_status text not null default 'new' check (employee_status in ('new', 'maturing', 'active')),
  -- Trainual integration: links this member to their Trainual person record
  -- Populated during Trainual sync; used to pull training completion + assignments
  trainual_user_id text null,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(practice_id, user_id)
);

alter table public.practice_members enable row level security;

-- Helper: check if user belongs to a practice
create or replace function public.user_practice_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select practice_id from public.practice_members
  where user_id = uid and is_active = true;
$$;

-- Practice RLS: members see their own practice; platform admins see all
create policy "practices_select" on public.practices
  for select using (
    id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "practices_admin_manage" on public.practices
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- Practice members RLS
create policy "practice_members_select" on public.practice_members
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "practice_members_admin_manage" on public.practice_members
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- ============================================
-- 4. TASKS (practice project management)
-- ============================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  due_date date,
  completed_at timestamptz,
  category text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "tasks_insert" on public.tasks
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "tasks_update" on public.tasks
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "tasks_delete" on public.tasks
  for delete using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- ============================================
-- 5. TRAINING MODULES
-- ============================================
create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id) on delete cascade,
  title text not null,
  description text,
  content text,
  category text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer,
  is_required boolean not null default false,
  is_global boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_modules enable row level security;

create policy "training_modules_select" on public.training_modules
  for select using (
    is_global = true
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "training_modules_admin_manage" on public.training_modules
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- ============================================
-- 6. TRAINING PROGRESS (user completion tracking)
-- ============================================
create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'failed')),
  score integer,
  started_at timestamptz,
  completed_at timestamptz,
  attempts integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module_id)
);

alter table public.training_progress enable row level security;

create policy "training_progress_select" on public.training_progress
  for select using (
    user_id = auth.uid()
    or practice_id in (select public.user_practice_ids(auth.uid()))
    or (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

create policy "training_progress_own" on public.training_progress
  for insert with check (user_id = auth.uid());

create policy "training_progress_update_own" on public.training_progress
  for update using (user_id = auth.uid());

-- ============================================
-- 7. EMAIL LOG
-- ============================================
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id),
  to_email text not null,
  subject text not null,
  template text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'bounced', 'failed')),
  resend_id text,
  metadata jsonb default '{}',
  sent_at timestamptz not null default now()
);

alter table public.email_log enable row level security;

create policy "email_log_admin_only" on public.email_log
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'platform_admin'
  );

-- ============================================
-- 8. HELPER: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'staff'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 9. HELPER: update timestamps
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger practices_updated_at before update on public.practices
  for each row execute function public.update_updated_at();
create trigger practice_members_updated_at before update on public.practice_members
  for each row execute function public.update_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.update_updated_at();
create trigger training_modules_updated_at before update on public.training_modules
  for each row execute function public.update_updated_at();
create trigger training_progress_updated_at before update on public.training_progress
  for each row execute function public.update_updated_at();

-- ============================================
-- 10. INDEXES
-- ============================================
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(email);
create index idx_practices_slug on public.practices(slug);
create index idx_practices_status on public.practices(status);
create index idx_practice_members_practice on public.practice_members(practice_id);
create index idx_practice_members_user on public.practice_members(user_id);
create index idx_tasks_practice on public.tasks(practice_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_training_modules_practice on public.training_modules(practice_id);
create index idx_training_modules_status on public.training_modules(status);
create index idx_training_progress_user on public.training_progress(user_id);
create index idx_training_progress_module on public.training_progress(module_id);
create index idx_training_progress_practice on public.training_progress(practice_id);
