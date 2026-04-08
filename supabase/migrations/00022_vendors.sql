-- =============================================================================
-- Vendors & Vendor Contacts — third-party companies for service requests
-- =============================================================================

-- =============================================================================
-- 1. VENDORS
-- =============================================================================

create table public.vendors (
  id            uuid primary key default gen_random_uuid(),
  practice_id   uuid not null references public.practices(id) on delete cascade,

  name          text not null,
  type          text not null check (type in ('equipment', 'service', 'lab', 'referring_practice')),
  phone         text,
  email         text,
  website_url   text,
  address       text,
  notes         text,

  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique(practice_id, name)
);

alter table public.vendors enable row level security;

create index vendors_practice on public.vendors (practice_id);

create policy "vendors_select" on public.vendors
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

create policy "vendors_insert" on public.vendors
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "vendors_update" on public.vendors
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

create policy "vendors_delete" on public.vendors
  for delete using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.update_updated_at();

-- =============================================================================
-- 2. VENDOR CONTACTS
-- =============================================================================

create table public.vendor_contacts (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  practice_id   uuid not null references public.practices(id) on delete cascade,

  name          text not null,
  role          text,
  phone         text,
  email         text,
  is_primary    boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.vendor_contacts enable row level security;

create index vendor_contacts_vendor on public.vendor_contacts (vendor_id);

create policy "vendor_contacts_select" on public.vendor_contacts
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

create policy "vendor_contacts_admin_manage" on public.vendor_contacts
  for all using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

create trigger vendor_contacts_updated_at
  before update on public.vendor_contacts
  for each row execute function public.update_updated_at();
