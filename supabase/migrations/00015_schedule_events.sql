-- =============================================================================
-- Schedule Events — calendar-based scheduling for practice staff
-- =============================================================================
--
-- Supports:
--   - Timed events (appointments, training blocks, meetings)
--   - All-day events (holidays, office closures)
--   - Staff assignment via practice_members FK
--   - Recurrence via rrule string (RFC 5545) — app-layer expansion
--   - Practice-scoped isolation via RLS
-- =============================================================================

create table public.schedule_events (
  id                uuid primary key default gen_random_uuid(),
  practice_id       uuid not null references public.practices(id) on delete cascade,

  -- Content
  title             text not null,
  description       text,

  -- Timing
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  all_day           boolean not null default false,

  -- Assignment (who is this event for?)
  assigned_to       uuid references public.practice_members(id) on delete set null,
  assigned_department uuid references public.departments(id) on delete set null,

  -- Classification
  event_type        text not null default 'general'
                      check (event_type in (
                        'general', 'training', 'meeting', 'shift',
                        'time_off', 'holiday', 'other'
                      )),

  -- Location (optional — which room/operatory)
  room_id           uuid references public.rooms(id) on delete set null,

  -- Recurrence (RFC 5545 rrule string, null = one-time)
  -- Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260630T235959Z"
  rrule             text,

  -- Display
  color             text,  -- optional override; null = derive from department

  -- Audit
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Sanity: end must be after start
  constraint schedule_events_time_range check (end_at > start_at)
);

alter table public.schedule_events enable row level security;

-- Indexes for common query patterns
create index schedule_events_practice_range on public.schedule_events (practice_id, start_at, end_at);
create index schedule_events_assigned on public.schedule_events (assigned_to) where assigned_to is not null;

-- RLS: same pattern as tasks
create policy "schedule_events_select" on public.schedule_events
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

create policy "schedule_events_insert" on public.schedule_events
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "schedule_events_update" on public.schedule_events
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "schedule_events_delete" on public.schedule_events
  for delete using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- Auto-update updated_at
create trigger schedule_events_updated_at
  before update on public.schedule_events
  for each row execute function public.update_updated_at();
