-- =============================================================================
-- Daily Pool Task Generator
-- =============================================================================
-- Creates fresh task instances each day from pool templates (Opening/Closing
-- Office, etc.) and auto-skips yesterday's incomplete pool tasks.
--
-- Designed for pg_cron: SELECT public.run_daily_pool_tasks();
-- Schedule: 0 5 * * * (5:00 AM UTC daily)
--
-- Idempotent — safe to re-run. Checks for existing today-instance before insert.
-- =============================================================================

-- ─── Per-practice generator ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_daily_pool_tasks(p_practice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today       date := current_date;
  v_template    record;
  v_task_id     uuid;
  v_item        record;
  v_exists      boolean;
BEGIN

  -- ── Step 1: Auto-skip stale pool tasks ────────────────────────────────────
  -- Any pool task from a previous day that wasn't completed gets marked skipped.
  -- This prevents rollover chaos — each day starts clean.

  UPDATE public.tasks
  SET
    status = 'skipped',
    updated_at = now()
  WHERE practice_id = p_practice_id
    AND assigned_to IS NULL
    AND frequency IN ('daily', 'per_shift')
    AND due_date < v_today
    AND status NOT IN ('completed', 'skipped');

  -- ── Step 2: Generate today's pool task instances ──────────────────────────
  -- For each active pool template, create one task instance for today.

  FOR v_template IN
    SELECT id, name, description, type, frequency, priority,
           room_id, assigned_role_id, department_id,
           task_category_id, compliance_type_id
    FROM public.task_templates
    WHERE practice_id = p_practice_id
      AND assignment_mode = 'pool'
      AND status = 'active'
      AND frequency IN ('daily', 'per_shift')
  LOOP

    -- Idempotency check: skip if today's instance already exists
    SELECT EXISTS(
      SELECT 1 FROM public.tasks
      WHERE template_id = v_template.id
        AND practice_id = p_practice_id
        AND due_date = v_today
    ) INTO v_exists;

    IF v_exists THEN
      CONTINUE;
    END IF;

    -- Create task instance
    INSERT INTO public.tasks (
      practice_id, title, description, template_id,
      room_id, assigned_to, assigned_role_id, assigned_department,
      status, priority, frequency, due_date
    ) VALUES (
      p_practice_id, v_template.name, v_template.description, v_template.id,
      v_template.room_id,
      null, -- pool: no individual assignee
      null, -- pool: no role assignment
      null, -- pool: no department assignment
      'not_started', v_template.priority, v_template.frequency, v_today
    )
    RETURNING id INTO v_task_id;

    -- Copy checklist items from template → task
    FOR v_item IN
      SELECT label, sort_order, room_id, equipment_id, supply_category_id
      FROM public.checklist_items
      WHERE template_id = v_template.id
      ORDER BY sort_order
    LOOP
      INSERT INTO public.task_checklist_items (
        task_id, practice_id, label, sort_order,
        room_id, equipment_id, supply_category_id,
        is_completed
      ) VALUES (
        v_task_id, p_practice_id, v_item.label, v_item.sort_order,
        v_item.room_id, v_item.equipment_id, v_item.supply_category_id,
        false
      );
    END LOOP;

  END LOOP;

END;
$$;

-- ─── Wrapper: iterate all active practices ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_daily_pool_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_practice record;
BEGIN
  FOR v_practice IN
    SELECT id FROM public.practices WHERE status = 'active'
  LOOP
    PERFORM public.generate_daily_pool_tasks(v_practice.id);
  END LOOP;
END;
$$;

-- ─── pg_cron schedule ───────────────────────────────────────────────────────
-- pg_cron is available on Supabase Pro plans. On free tier, these functions
-- can be called manually or via an Edge Function webhook.
--
-- To enable on a paid project, uncomment the following:
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
-- SELECT cron.schedule(
--   'generate-daily-pool-tasks',
--   '0 5 * * *',
--   $$SELECT public.run_daily_pool_tasks()$$
-- );
