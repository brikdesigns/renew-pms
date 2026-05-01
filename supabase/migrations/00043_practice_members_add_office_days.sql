-- =============================================================================
-- 00043: ADD office_days TO practice_members
-- =============================================================================
-- Track which days of the week each staff member is in the office. Multi-
-- select (e.g. {mon, tue, wed} for a part-time clinician) — distinct from the
-- existing single-value shift column. Empty array means "no days specified"
-- (the default).

alter table public.practice_members
  add column office_days text[] not null default '{}'::text[];

-- Constrain values to the canonical 3-letter day codes. CHECK uses <@ so every
-- element of office_days must be in the valid set; duplicates are tolerated by
-- the DB but should be normalised by the application.
alter table public.practice_members
  add constraint practice_members_office_days_valid
  check (office_days <@ array['sun','mon','tue','wed','thu','fri','sat']::text[]);
