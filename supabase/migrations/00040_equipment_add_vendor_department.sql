-- =============================================================================
-- 00040: ADD vendor_id AND department_id TO equipment
-- =============================================================================
-- The equipment edit form has Vendor and Department fields, but the table
-- was missing the backing FK columns. This adds them.

alter table public.equipment
  add column vendor_id uuid references public.vendors(id) on delete set null,
  add column department_id uuid references public.departments(id) on delete set null;
