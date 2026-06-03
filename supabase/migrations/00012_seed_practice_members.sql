-- =============================================================================
-- 00012: SEED PRACTICE MEMBERS (Renew Dental staff)
-- =============================================================================
-- Source: Notion Employees database
--   https://www.notion.so/2f097d34ed2880d7823ec2c13ae458a7
--
-- EMAIL NOTE: Supabase auth requires unique emails per user. Rather than a
-- shared test@brikdesigns.com address, this uses test+{slug}@brikdesigns.com
-- (plus-addressing). All test accounts use password: TestPass123!
--
-- SKIPPED (incomplete Notion records — no title, department, or start date):
--   - Ivonne (no last name or role data)
--   - Shelby Smith
--   - Jalene Lillie
--   - Addie Cagle
--
-- ROLE MAPPING FLAGS:
--   - Chris Gray: Notion title is "COO" — no COO role exists. Mapped to (O) Owner
--     since his Notion departments include "Owner".
--   - Sylvia Salazar: Notion title is "Office Admin" → mapped to Office Manager.
--     No start date in Notion — joined_at set to practice created_at.
--   - Konner Rudolph / Samantha Rodriguez: "Administrative Assistant" in Notion.
--     Mapped to Business Administrator (closest existing role).
--   - Autumn Weimer: Clinical Manager — listed in Hygienist + Assistant depts
--     in Notion (she supervises both). Mapped to Clinical Manager role.
--
-- EMPLOYEE TYPE heuristic (can be updated per practice preference):
--   active   — joined before 2023
--   maturing — joined 2023–2024
--   new      — joined 2025+
--   active   — no start date (established employees)
--
-- SYSTEM ROLE assignments:
--   practice_admin — Dr. Dani Gray, Chris Gray, Sylvia Salazar (owner/ops level)
--   staff          — everyone else
-- =============================================================================


-- ── Step 0: Ensure pgcrypto is available for password hashing ────────────────

create extension if not exists pgcrypto with schema extensions;


-- ── Step 1: Insert auth users ─────────────────────────────────────────────────
-- The on_auth_user_created trigger auto-creates public.profiles from
-- raw_user_meta_data (first_name, last_name). Trigger defaults
-- profiles.system_role to staff; callers upsert if different role needed.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  -- GoTrue expects these as empty strings, not NULL
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, reauthentication_token
)
values

  -- 1. Dr. Dani Gray — Owner/Dentist — practice_admin
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+dani.gray@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Dani","last_name":"Gray"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 2. Chris Gray — COO (mapped: Owner) — practice_admin
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+chris.gray@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Chris","last_name":"Gray"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 3. Sylvia Salazar — Office Admin → Office Manager — practice_admin
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+sylvia.salazar@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Sylvia","last_name":"Salazar"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 4. Autumn Weimer — Clinical Manager — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+autumn.weimer@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Autumn","last_name":"Weimer"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 5. Dr. Rachel Stein — Dentist — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+rachel.stein@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Rachel","last_name":"Stein"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 6. Dr. Phillip Ray — Dentist — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+phillip.ray@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Phillip","last_name":"Ray"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 7. Tessa Hernandez — Lead Admin → Lead Business Administrator — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+tessa.hernandez@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Tessa","last_name":"Hernandez"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 8. Konner Rudolph — Administrative Assistant → Business Administrator — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+konner.rudolph@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Konner","last_name":"Rudolph"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 9. Samantha Rodriguez — Administrative Assistant → Business Administrator — staff
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+samantha.rodriguez@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Samantha","last_name":"Rodriguez"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 10. Avilina Igitol — Registered Dental Assistant — staff (active: 2022)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+avilina.igitol@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Avilina","last_name":"Igitol"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 11. Elizabeth Carrillo — Registered Dental Assistant — staff (maturing: 2023)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+elizabeth.carrillo@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Elizabeth","last_name":"Carrillo"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 12. Destiny Mora — Registered Dental Hygienist — staff (active: 2022)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+destiny.mora@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Destiny","last_name":"Mora"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 13. Olivia Biggs — Registered Dental Hygienist — staff (maturing: 2024)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+olivia.biggs@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Olivia","last_name":"Biggs"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 14. Jo Cleasby — Registered Dental Hygienist — staff (maturing: 2024)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+jo.cleasby@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Jo","last_name":"Cleasby"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 15. Nadiya Achuff — Registered Dental Assistant — staff (new: 2025)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+nadiya.achuff@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Nadiya","last_name":"Achuff"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 16. Josalyn Bibee — Registered Dental Hygienist — staff (new: 2025)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+josalyn.bibee@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Josalyn","last_name":"Bibee"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 17. Jordan Johnston — Registered Dental Assistant — staff (new: 2025)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+jordan.johnston@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Jordan","last_name":"Johnston"}'::jsonb,
   now(), now(),
   '', '', '', '', '', ''),

  -- 18. Kelly Schumacher — Registered Dental Hygienist — staff (new: 2026)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'test+kelly.schumacher@brikdesigns.com',
   extensions.crypt('TestPass123!', extensions.gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"first_name":"Kelly","last_name":"Schumacher"}'::jsonb,
   now(), now(),
   '', '', '', '', '', '');


-- ── Step 1b: Create auth.identities for each user ────────────────────────────
-- GoTrue requires an identity record for email/password sign-in.
-- Without this, the admin list users API returns 500 when these users
-- are included in the result set (GoTrue's GORM preload fails).

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.created_at,
  u.created_at,
  u.created_at
from auth.users u
where u.email like 'test+%@brikdesigns.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);


-- ── Step 1c: Promote the three practice_admins from default 'staff' ───────────
-- Trigger no longer reads system_role from raw_user_meta_data — caller must
-- upsert profiles for any non-default role. See migration 00049 + #203.
update public.profiles
set system_role = 'practice_admin'
where email in (
  'test+dani.gray@brikdesigns.com',
  'test+chris.gray@brikdesigns.com',
  'test+sylvia.salazar@brikdesigns.com'
);


-- ── Step 2: Create practice_members linking profiles → practice ───────────────
-- Profiles were auto-created by the on_auth_user_created trigger above.
-- Looks up each profile by email and the practice/office by position.

do $$
declare
  p_id           uuid;
  o_id           uuid;

  -- Role UUIDs
  role_owner     uuid;
  role_doctor    uuid;
  role_office_mgr uuid;
  role_lead_ba   uuid;
  role_ba        uuid;
  role_clinical_mgr uuid;
  role_hygienist uuid;
  role_assistant uuid;

begin

  select id into p_id from public.practices limit 1;
  select id into o_id from public.offices where practice_id = p_id limit 1;

  select id into role_owner        from public.practice_role_types where practice_id = p_id and name = '(O) Owner';
  select id into role_doctor       from public.practice_role_types where practice_id = p_id and name = '(D) Doctor';
  select id into role_office_mgr   from public.practice_role_types where practice_id = p_id and name = 'Office Manager';
  select id into role_lead_ba      from public.practice_role_types where practice_id = p_id and name = 'Lead Business Administrator';
  select id into role_ba           from public.practice_role_types where practice_id = p_id and name = 'Business Administrator';
  select id into role_clinical_mgr from public.practice_role_types where practice_id = p_id and name = 'Clinical Manager';
  select id into role_hygienist    from public.practice_role_types where practice_id = p_id and name = '(H) Dental Hygienist';
  select id into role_assistant    from public.practice_role_types where practice_id = p_id and name = '(A) Dental Assistant';

  insert into public.practice_members
    (practice_id, user_id, practice_role_id, employee_type, joined_at)

  -- 1. Dr. Dani Gray — Owner — active (2018)
  select p_id, id, role_owner, 'active', '2018-08-14'::timestamptz
  from public.profiles where email = 'test+dani.gray@brikdesigns.com'

  union all

  -- 2. Chris Gray — Owner (COO) — active (2018)
  select p_id, id, role_owner, 'active', '2018-11-16'::timestamptz
  from public.profiles where email = 'test+chris.gray@brikdesigns.com'

  union all

  -- 3. Sylvia Salazar — Office Manager — active (no start date)
  select p_id, id, role_office_mgr, 'active', now()
  from public.profiles where email = 'test+sylvia.salazar@brikdesigns.com'

  union all

  -- 4. Autumn Weimer — Clinical Manager — new (2025)
  select p_id, id, role_clinical_mgr, 'new', '2025-10-15'::timestamptz
  from public.profiles where email = 'test+autumn.weimer@brikdesigns.com'

  union all

  -- 5. Dr. Rachel Stein — Doctor — maturing (2024)
  select p_id, id, role_doctor, 'maturing', '2024-01-03'::timestamptz
  from public.profiles where email = 'test+rachel.stein@brikdesigns.com'

  union all

  -- 6. Dr. Phillip Ray — Doctor — new (2025)
  select p_id, id, role_doctor, 'new', '2025-01-06'::timestamptz
  from public.profiles where email = 'test+phillip.ray@brikdesigns.com'

  union all

  -- 7. Tessa Hernandez — Lead Business Administrator — maturing (2023)
  select p_id, id, role_lead_ba, 'maturing', '2023-07-31'::timestamptz
  from public.profiles where email = 'test+tessa.hernandez@brikdesigns.com'

  union all

  -- 8. Konner Rudolph — Business Administrator — new (2025)
  select p_id, id, role_ba, 'new', '2025-08-25'::timestamptz
  from public.profiles where email = 'test+konner.rudolph@brikdesigns.com'

  union all

  -- 9. Samantha Rodriguez — Business Administrator — new (2025)
  select p_id, id, role_ba, 'new', '2025-01-20'::timestamptz
  from public.profiles where email = 'test+samantha.rodriguez@brikdesigns.com'

  union all

  -- 10. Avilina Igitol — Dental Assistant — active (2022)
  select p_id, id, role_assistant, 'active', '2022-11-28'::timestamptz
  from public.profiles where email = 'test+avilina.igitol@brikdesigns.com'

  union all

  -- 11. Elizabeth Carrillo — Dental Assistant — maturing (2023)
  select p_id, id, role_assistant, 'maturing', '2023-06-13'::timestamptz
  from public.profiles where email = 'test+elizabeth.carrillo@brikdesigns.com'

  union all

  -- 12. Destiny Mora — Dental Hygienist — active (2022)
  select p_id, id, role_hygienist, 'active', '2022-02-14'::timestamptz
  from public.profiles where email = 'test+destiny.mora@brikdesigns.com'

  union all

  -- 13. Olivia Biggs — Dental Hygienist — maturing (2024)
  select p_id, id, role_hygienist, 'maturing', '2024-02-06'::timestamptz
  from public.profiles where email = 'test+olivia.biggs@brikdesigns.com'

  union all

  -- 14. Jo Cleasby — Dental Hygienist — maturing (2024)
  select p_id, id, role_hygienist, 'maturing', '2024-11-04'::timestamptz
  from public.profiles where email = 'test+jo.cleasby@brikdesigns.com'

  union all

  -- 15. Nadiya Achuff — Dental Assistant — new (2025)
  select p_id, id, role_assistant, 'new', '2025-07-07'::timestamptz
  from public.profiles where email = 'test+nadiya.achuff@brikdesigns.com'

  union all

  -- 16. Josalyn Bibee — Dental Hygienist — new (2025)
  select p_id, id, role_hygienist, 'new', '2025-04-23'::timestamptz
  from public.profiles where email = 'test+josalyn.bibee@brikdesigns.com'

  union all

  -- 17. Jordan Johnston — Dental Assistant — new (2025)
  select p_id, id, role_assistant, 'new', '2025-08-11'::timestamptz
  from public.profiles where email = 'test+jordan.johnston@brikdesigns.com'

  union all

  -- 18. Kelly Schumacher — Dental Hygienist — new (2026)
  select p_id, id, role_hygienist, 'new', '2026-01-05'::timestamptz
  from public.profiles where email = 'test+kelly.schumacher@brikdesigns.com';

end;
$$;
