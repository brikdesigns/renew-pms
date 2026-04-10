-- Fix: vendors INSERT blocked by RLS
--
-- Root cause: migration 00033/00035 replaced individual policies with
-- `vendors_admin_manage for all using(...)` but never dropped the original
-- `vendors_insert`, `vendors_update`, `vendors_delete` from 00022.
-- The `for all` policy without an explicit `with check` clause may fail
-- on INSERT depending on policy evaluation order.
--
-- Fix: drop all legacy policies, recreate clean separated policies with
-- proper `with check` for INSERT.

-- Drop everything
drop policy if exists "vendors_select"       on public.vendors;
drop policy if exists "vendors_insert"       on public.vendors;
drop policy if exists "vendors_update"       on public.vendors;
drop policy if exists "vendors_delete"       on public.vendors;
drop policy if exists "vendors_admin_manage" on public.vendors;

-- SELECT: any practice member + brik_admin
create policy "vendors_select" on public.vendors
  for select using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    or public.get_my_system_role() = 'brik_admin'
  );

-- INSERT: admin or brik_admin (with check for new rows)
create policy "vendors_insert" on public.vendors
  for insert with check (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );

-- UPDATE: admin or brik_admin
create policy "vendors_update" on public.vendors
  for update using (
    practice_id in (select public.user_practice_ids(auth.uid()))
    and public.is_admin_role()
  );

-- DELETE: admin or brik_admin
create policy "vendors_delete" on public.vendors
  for delete using (
    public.is_admin_role()
  );
