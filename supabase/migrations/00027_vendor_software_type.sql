-- Add 'software' to vendor type constraint
alter table public.vendors drop constraint if exists vendors_type_check;
alter table public.vendors add constraint vendors_type_check
  check (type in ('equipment', 'software', 'service', 'lab', 'referring_practice'));
