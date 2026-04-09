-- =============================================================================
-- Requests — reactive work orders for equipment, devices, and facilities
-- =============================================================================
--
-- Status pipeline: submitted → in_review → in_progress → waiting_on_vendor → resolved → closed
-- Category: device_issue | equipment_issue | facility_maintenance
-- Urgency: low | medium | high | critical
--
-- Any staff member can submit. Admins triage, assign, and resolve.
-- High/critical urgency requests may involve third-party vendors.
-- =============================================================================

create table public.requests (
  id                       uuid primary key default gen_random_uuid(),
  practice_id              uuid not null references public.practices(id) on delete cascade,

  -- Content
  title                    text not null,
  description              text,

  -- Category (drives form fields and routing)
  category                 text not null check (category in (
                             'device_issue', 'equipment_issue', 'facility_maintenance'
                           )),

  -- Urgency (drives escalation path)
  urgency                  text not null default 'medium'
                             check (urgency in ('low', 'medium', 'high', 'critical')),

  -- Status pipeline
  status                   text not null default 'submitted'
                             check (status in (
                               'submitted', 'in_review', 'in_progress',
                               'waiting_on_vendor', 'resolved', 'closed'
                             )),

  -- Context: what is affected
  location_description     text,
  room_id                  uuid references public.rooms(id) on delete set null,
  equipment_id             uuid references public.equipment(id) on delete set null,

  -- Vendor assignment (for high/critical requiring external repair)
  vendor_id                uuid references public.vendors(id) on delete set null,
  vendor_contact_id        uuid references public.vendor_contacts(id) on delete set null,

  -- Assignment
  submitted_by             uuid not null references public.practice_members(id) on delete set null,
  assigned_to              uuid references public.practice_members(id) on delete set null,

  -- Resolution
  resolution_notes         text,
  resolved_at              timestamptz,

  -- Notification preferences (future — columns ready, no active sending)
  notify_on_status_change  boolean not null default true,
  notify_via               text[] not null default '{}',

  -- Audit
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.requests enable row level security;

-- Indexes for common queries
create index requests_practice_status on public.requests (practice_id, status);
create index requests_submitted_by on public.requests (submitted_by) where submitted_by is not null;
create index requests_vendor on public.requests (vendor_id) where vendor_id is not null;

-- RLS: any staff can view requests in their practice
create policy "requests_select" on public.requests
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'platform_admin'
  );

-- Any staff can submit a request
create policy "requests_insert" on public.requests
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
  );

-- Practice members can update requests; admins can update any
create policy "requests_update" on public.requests
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

-- Only admins can delete
create policy "requests_delete" on public.requests
  for delete using (
    public.get_my_system_role() in ('platform_admin', 'practice_admin')
  );

create trigger requests_updated_at
  before update on public.requests
  for each row execute function public.update_updated_at();
