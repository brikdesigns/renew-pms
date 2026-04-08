-- Seed "Closing Office" checklist template for Renew Dental
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062

DO $$
DECLARE
  v_practice_id uuid := 'd9f05b47-5429-41bc-aea9-79043c5c7062';
  v_template_id uuid;
  v_admin uuid;
BEGIN
  SELECT id INTO v_admin FROM public.profiles WHERE system_role = 'platform_admin' LIMIT 1;

  INSERT INTO public.task_templates (
    practice_id, name, description, type, frequency, priority,
    status, is_default, requires_approval, created_by
  ) VALUES (
    v_practice_id,
    'Closing Office',
    'Daily closing procedure checklist. Ensure all end-of-day processes are complete before leaving.',
    'checklist',
    'daily',
    'high',
    'active',
    true,
    false,
    v_admin
  ) RETURNING id INTO v_template_id;

  INSERT INTO public.checklist_items (template_id, practice_id, label, sort_order) VALUES
    (v_template_id, v_practice_id, 'Be sure your End of Day process for Open Dental has been completed', 1),
    (v_template_id, v_practice_id, 'Print Payments report and balance the deposit', 2),
    (v_template_id, v_practice_id, 'Print Provider Production Report', 3),
    (v_template_id, v_practice_id, 'Print Daily Production report', 4),
    (v_template_id, v_practice_id, 'Check for any messages that need to be returned before we leave', 5),
    (v_template_id, v_practice_id, 'Put down photo frame, turn off TV, turn off Renew Dental and tooth lights', 6),
    (v_template_id, v_practice_id, 'Wipe down and put iPads away in IT closet', 7),
    (v_template_id, v_practice_id, 'Wipe down all Admin areas', 8),
    (v_template_id, v_practice_id, 'Clean up Patient Lounge and Kitchen', 9),
    (v_template_id, v_practice_id, 'Cover outdoor plants (if temp will be below freezing)', 10),
    (v_template_id, v_practice_id, 'Lock front and side doors', 11),
    (v_template_id, v_practice_id, 'Clock out and have a great night!', 12);

END $$;
