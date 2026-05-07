-- =============================================================================
-- 00049: Retire raw_user_meta_data.system_role pattern
-- =============================================================================
-- Closes [renew-pms#203]. Two coupled changes:
--
-- 1) handle_new_user trigger no longer reads raw_user_meta_data->>'system_role'.
--    profiles.system_role always defaults to 'staff' on auth.users insert.
--    Callers that need a different role must upsert public.profiles separately
--    after creating the auth user — making profiles.system_role the only
--    source of truth (per CLAUDE.md § Role model).
--
-- 2) One-shot data cleanup: strip 'system_role' from every existing
--    auth.users.raw_user_meta_data so the drift surface is closed.
--    Idempotent — re-running the migration is a no-op once cleared.
--
-- Why: as long as the trigger reads the metadata field and old seeds wrote
-- it, any direct admin.users.create() with a non-canonical value could
-- re-introduce the drift cleaned up in #200. This removes the drift source.
-- =============================================================================


-- ── Step 1: rewrite handle_new_user to ignore raw_user_meta_data.system_role

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, system_role, first_name, last_name)
  values (
    new.id,
    new.email,
    'staff',  -- always default; callers upsert profiles post-creation if a different role is needed
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;


-- ── Step 2: strip 'system_role' from every existing auth user's metadata

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'system_role'
where raw_user_meta_data ? 'system_role';
