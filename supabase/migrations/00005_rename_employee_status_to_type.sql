-- Migration: Rename employee_status to employee_type
-- "Status" is reserved for future online/offline/away presence.
-- "Type" describes the employment lifecycle stage: new, maturing, active.

alter table public.practice_members
  rename column employee_status to employee_type;

comment on column public.practice_members.employee_type is
  'Employment lifecycle type — new (onboarding), maturing (transitioning), active (fully ramped)';
