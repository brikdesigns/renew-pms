-- Seed schedule events for Renew Dental practice
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062
-- Uses existing practice_members from 00012_seed_practice_members.sql
--
-- Events span the current week (Monday-Friday) with realistic dental office activities.
-- Looks up practice_members by email (robust across DB resets).

DO $$
DECLARE
  v_practice_id uuid := 'd9f05b47-5429-41bc-aea9-79043c5c7062';
  v_monday date := date_trunc('week', CURRENT_DATE)::date;
  v_admin uuid;
  -- Practice member IDs (looked up by email)
  v_sylvia   uuid;
  v_autumn   uuid;
  v_rachel   uuid;
  v_tessa    uuid;
  v_destiny  uuid;
  v_avilina  uuid;
BEGIN
  -- Look up practice_members by joining through profiles
  SELECT pm.id INTO v_sylvia FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+sylvia.salazar@brikdesigns.com' AND pm.practice_id = v_practice_id;
  SELECT pm.id INTO v_autumn FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+autumn.weimer@brikdesigns.com' AND pm.practice_id = v_practice_id;
  SELECT pm.id INTO v_rachel FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+rachel.stein@brikdesigns.com' AND pm.practice_id = v_practice_id;
  SELECT pm.id INTO v_tessa FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+tessa.hernandez@brikdesigns.com' AND pm.practice_id = v_practice_id;
  SELECT pm.id INTO v_destiny FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+destiny.mora@brikdesigns.com' AND pm.practice_id = v_practice_id;
  SELECT pm.id INTO v_avilina FROM public.practice_members pm
    JOIN public.profiles p ON pm.user_id = p.id WHERE p.email = 'test+avilina.igitol@brikdesigns.com' AND pm.practice_id = v_practice_id;

  -- Get admin for created_by
  SELECT id INTO v_admin FROM public.profiles WHERE system_role = 'platform_admin' LIMIT 1;

  -- Skip if members not found
  IF v_sylvia IS NULL THEN
    RAISE NOTICE 'Skipping schedule event seed — practice_members not found';
    RETURN;
  END IF;

  INSERT INTO public.schedule_events (
    practice_id, title, description, start_at, end_at, assigned_to, event_type, created_by
  ) VALUES
  -- Monday
  (v_practice_id, 'Daily Team Huddle',
    'Morning standup — review schedule, patient alerts, staffing changes',
    (v_monday + interval '8 hours'), (v_monday + interval '8 hours 30 minutes'),
    v_sylvia, 'meeting', v_admin),

  (v_practice_id, 'Patient Check-In Review',
    'Review front desk check-in workflow and patient intake forms',
    (v_monday + interval '9 hours'), (v_monday + interval '11 hours'),
    v_tessa, 'training', v_admin),

  -- Tuesday
  (v_practice_id, 'Staff Huddle',
    'Weekly clinical team sync',
    (v_monday + interval '1 day' + interval '8 hours 30 minutes'), (v_monday + interval '1 day' + interval '10 hours'),
    v_autumn, 'meeting', v_admin),

  (v_practice_id, 'Instrument Sterilization Protocol',
    'Sterilization room deep-clean and protocol review',
    (v_monday + interval '1 day' + interval '10 hours 30 minutes'), (v_monday + interval '1 day' + interval '12 hours'),
    v_avilina, 'training', v_admin),

  (v_practice_id, 'Hygiene Refresher',
    'Quarterly hygiene technique review',
    (v_monday + interval '1 day' + interval '13 hours'), (v_monday + interval '1 day' + interval '15 hours 30 minutes'),
    v_destiny, 'training', v_admin),

  -- Wednesday
  (v_practice_id, 'OSHA Training',
    'Annual OSHA compliance training — bloodborne pathogens',
    (v_monday + interval '2 days' + interval '9 hours'), (v_monday + interval '2 days' + interval '10 hours 30 minutes'),
    v_rachel, 'training', v_admin),

  (v_practice_id, 'Front Desk Procedures',
    'Insurance verification and appointment scheduling training',
    (v_monday + interval '2 days' + interval '10 hours 30 minutes'), (v_monday + interval '2 days' + interval '12 hours'),
    v_tessa, 'training', v_admin),

  (v_practice_id, 'Equipment Calibration',
    'Quarterly X-ray and autoclave calibration check',
    (v_monday + interval '2 days' + interval '13 hours'), (v_monday + interval '2 days' + interval '14 hours 30 minutes'),
    v_avilina, 'general', v_admin),

  -- Thursday
  (v_practice_id, 'X-Ray Protocol Review',
    'Digital radiography technique and safety protocol review',
    (v_monday + interval '3 days' + interval '9 hours'), (v_monday + interval '3 days' + interval '12 hours'),
    v_destiny, 'training', v_admin),

  (v_practice_id, 'Clinical Manager 1:1',
    'Weekly check-in with practice owner',
    (v_monday + interval '3 days' + interval '14 hours'), (v_monday + interval '3 days' + interval '15 hours'),
    v_autumn, 'meeting', v_admin),

  -- Friday
  (v_practice_id, 'Supply Inventory',
    'Weekly supply count and reorder review',
    (v_monday + interval '4 days' + interval '10 hours'), (v_monday + interval '4 days' + interval '12 hours'),
    v_avilina, 'general', v_admin),

  (v_practice_id, 'Week Wrap-Up',
    'End-of-week team debrief and next-week planning',
    (v_monday + interval '4 days' + interval '15 hours'), (v_monday + interval '4 days' + interval '16 hours'),
    v_sylvia, 'meeting', v_admin);

END $$;
