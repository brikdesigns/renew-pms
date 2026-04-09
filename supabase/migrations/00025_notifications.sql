-- =============================================================================
-- Notifications — in-app notification feed
-- =============================================================================
--
-- Drives the bell icon and notification dropdown in the top bar.
-- Types: request_new, request_status_change, request_assigned, task_assigned
-- =============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  practice_id uuid references public.practices(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Index for the notifications bell query (user + unread + recent)
create index notifications_user_read on public.notifications (user_id, is_read, created_at desc);

-- Users can read their own notifications
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

-- Server-side inserts happen via the user's session context, but the notification
-- is for a DIFFERENT user (e.g., Emily submits → Sarah gets notified).
-- Allow inserts for any authenticated user within the same practice.
create policy "notifications_insert" on public.notifications
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

-- Users can mark their own notifications as read
create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own notifications
create policy "notifications_delete" on public.notifications
  for delete using (user_id = auth.uid());
