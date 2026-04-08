-- Seed "Opening Office" checklist template for Renew Dental
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062

DO $$
DECLARE
  v_practice_id uuid := 'd9f05b47-5429-41bc-aea9-79043c5c7062';
  v_template_id uuid;
  v_admin uuid;
BEGIN
  -- Get admin for created_by
  SELECT id INTO v_admin FROM public.profiles WHERE system_role = 'platform_admin' LIMIT 1;

  -- Create the template
  INSERT INTO public.task_templates (
    practice_id, name, description, type, frequency, priority,
    status, is_default, requires_approval, created_by
  ) VALUES (
    v_practice_id,
    'Opening Office',
    'Daily opening procedure checklist. Arrive no later than 6:30 AM. Your key fob allows entrance access as early as 6:20 AM.',
    'checklist',
    'daily',
    'high',
    'active',
    true,
    false,
    v_admin
  ) RETURNING id INTO v_template_id;

  -- Insert checklist items in order
  INSERT INTO public.checklist_items (template_id, practice_id, label, sort_order) VALUES
    (v_template_id, v_practice_id, 'Turn on lights — main light switch by back door turns on all office lights; front desk light has separate switch near frosted glass door', 1),
    (v_template_id, v_practice_id, 'Log in to Open Dental to clock in', 2),
    (v_template_id, v_practice_id, 'Check voicemail for any new or saved messages from last night', 3),
    (v_template_id, v_practice_id, 'Log in to Modento and check for any text messages that might affect today''s schedule', 4),
    (v_template_id, v_practice_id, 'Get iPads out, plug to charger as needed', 5),
    (v_template_id, v_practice_id, 'Unlock the front door and open blinds', 6),
    (v_template_id, v_practice_id, 'Put up photo frame, fill and turn on diffuser', 7),
    (v_template_id, v_practice_id, 'Turn on TV, turn on Renew Dental and tooth light', 8),
    (v_template_id, v_practice_id, 'Open SONOS and turn on music', 9),
    (v_template_id, v_practice_id, 'Have 7 AM routers ready with iPads for anyone who needs forms', 10),
    (v_template_id, v_practice_id, 'Review all routers for the day (if any add-ons or cancellations)', 11),
    (v_template_id, v_practice_id, 'Set provider folders for the day', 12),
    (v_template_id, v_practice_id, 'GO TO HUDDLE PROMPTLY AT 6:40 AM', 13);

END $$;
