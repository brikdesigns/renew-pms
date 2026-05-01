-- =============================================================================
-- 00042: VENDOR PORTAL — tokenized vendor access to requests
-- =============================================================================
-- Two new tables:
--   vendor_request_tokens — one active token per vendor-to-request assignment
--   vendor_messages       — bidirectional message thread between vendor and staff
--
-- Token lifecycle:
--   active → revoked  (vendor reassigned or removed)
--   active → expired  (past expires_at — set lazily on access)
--   active → closed   (request resolved or closed)
-- =============================================================================


-- ─── 1. VENDOR REQUEST TOKENS ─────────────────────────────────────────────────

create table public.vendor_request_tokens (
  id                uuid primary key default gen_random_uuid(),
  practice_id       uuid not null references public.practices(id) on delete cascade,
  request_id        uuid not null references public.requests(id) on delete cascade,
  vendor_id         uuid not null references public.vendors(id) on delete cascade,
  vendor_contact_id uuid references public.vendor_contacts(id) on delete set null,

  token             text not null unique,
  status            text not null default 'active'
                      check (status in ('active', 'revoked', 'expired', 'closed')),

  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  revoked_at        timestamptz,

  constraint vendor_request_tokens_token_length check (char_length(token) >= 32)
);

alter table public.vendor_request_tokens enable row level security;

-- Lookup by token (public API hot path)
create unique index vendor_request_tokens_token_idx
  on public.vendor_request_tokens (token);

-- Find active tokens for a request (revocation query)
create index vendor_request_tokens_request_active_idx
  on public.vendor_request_tokens (request_id, status)
  where status = 'active';

-- Practice scoping
create index vendor_request_tokens_practice_idx
  on public.vendor_request_tokens (practice_id);

-- RLS: practice members can view tokens for their practice
create policy "vendor_request_tokens_select" on public.vendor_request_tokens
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- All inserts/updates happen via admin client (service role) — no user-session
-- write policies needed.


-- ─── 2. VENDOR MESSAGES ───────────────────────────────────────────────────────

create table public.vendor_messages (
  id                uuid primary key default gen_random_uuid(),
  practice_id       uuid not null references public.practices(id) on delete cascade,
  request_id        uuid not null references public.requests(id) on delete cascade,
  token_id          uuid not null references public.vendor_request_tokens(id) on delete cascade,

  -- Who sent it
  sender_type       text not null check (sender_type in ('vendor', 'staff')),
  sender_member_id  uuid references public.practice_members(id) on delete set null,
  sender_name       text not null,

  -- Content
  body              text not null,

  -- Vendor can optionally update their work status with each message
  vendor_status     text check (vendor_status is null or vendor_status in (
    'acknowledged', 'scheduled', 'in_progress', 'on_hold',
    'parts_ordered', 'completed'
  )),

  created_at        timestamptz not null default now()
);

alter table public.vendor_messages enable row level security;

-- Thread query from portal (ordered by time)
create index vendor_messages_request_created_idx
  on public.vendor_messages (request_id, created_at);

-- Thread query from public API (scoped to token)
create index vendor_messages_token_created_idx
  on public.vendor_messages (token_id, created_at);

-- RLS: practice members can read messages for their practice
create policy "vendor_messages_select" on public.vendor_messages
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- RLS: practice members can insert messages (staff replies)
create policy "vendor_messages_insert" on public.vendor_messages
  for insert with check (
    sender_type = 'staff'
    and practice_id in (select public.user_practice_ids(auth.uid()))
  );

-- Vendor-side inserts go through admin client (service role).
-- Messages are append-only — no update/delete policies.
