-- =============================================================================
-- 00053: Monthly task generator
-- =============================================================================
-- Adds generate_monthly_tasks(p_practice_id) and run_monthly_tasks() following
-- the same structure as generate_weekly_tasks (migration 00052).
--
-- ADR-002: skip+spawn-fresh rollover semantic.
--   - Stale-skip: frequency='monthly' tasks with due_date < 1st of current month.
--   - Spawn: one task per active monthly template per practice, due 1st of month.
--   - Idempotency: skip if due_date = 1st of current month already exists for template.
--
-- ADR-003: fixed UTC cron (0 5 1 * *), no per-practice timezone column.
--   - current_date at 05:00 UTC on the 1st is still the 1st for all US practices.
--   - task_reset_cadence column (00051) is informational at this stage; the
--     generator owns monthly templates by frequency, not by reset cadence.
-- =============================================================================


create or replace function public.generate_monthly_tasks(p_practice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month_start date := date_trunc('month', current_date)::date;
  v_template    record;
  v_task_id     uuid;
  v_item        record;
  v_exists      boolean;
  v_assigned_to         uuid;
  v_assigned_role_id    uuid;
  v_assigned_department uuid;
begin

  -- Step A: stale-skip incomplete monthly tasks from prior month boundaries.
  -- Mirrors the weekly generator's approach: mark anything spawned by a monthly
  -- template that has a due_date before the 1st of this month as skipped.
  update public.tasks
  set status     = 'skipped',
      updated_at = now()
  where practice_id = p_practice_id
    and template_id is not null
    and frequency   = 'monthly'
    and due_date    < v_month_start
    and status not in ('completed', 'skipped');

  -- Step B: spawn this month's instance for every active monthly template
  -- whose assignment is fully specified for its mode.
  for v_template in
    select id, name, description, type, frequency, priority, display_mode,
           room_id, assignment_mode,
           assigned_member_id, assigned_role_id, department_id
    from public.task_templates
    where practice_id = p_practice_id
      and status      = 'active'
      and frequency   = 'monthly'
      and (
        assignment_mode = 'pool'
        or (assignment_mode = 'individual' and assigned_member_id is not null)
        or (assignment_mode = 'role'       and assigned_role_id   is not null)
        or (assignment_mode = 'department' and department_id      is not null)
      )
  loop

    -- Idempotency: skip if this month's instance already exists.
    select exists(
      select 1 from public.tasks
      where template_id = v_template.id
        and practice_id = p_practice_id
        and due_date    = v_month_start
    ) into v_exists;

    if v_exists then
      continue;
    end if;

    v_assigned_to         := case when v_template.assignment_mode = 'individual' then v_template.assigned_member_id end;
    v_assigned_role_id    := case when v_template.assignment_mode = 'role'       then v_template.assigned_role_id   end;
    v_assigned_department := case when v_template.assignment_mode = 'department' then v_template.department_id      end;

    -- ── EXPANDED display_mode: one task per checklist item ──────────────────
    if v_template.display_mode = 'expanded' then

      for v_item in
        select label, sort_order, room_id, equipment_id, supply_category_id
        from public.checklist_items
        where template_id = v_template.id
        order by sort_order
      loop
        insert into public.tasks (
          practice_id, title, description, template_id,
          room_id, assigned_to, assigned_role_id, assigned_department,
          status, priority, frequency, due_date
        ) values (
          p_practice_id,
          v_item.label,
          v_template.name,
          v_template.id,
          coalesce(v_item.room_id, v_template.room_id),
          v_assigned_to, v_assigned_role_id, v_assigned_department,
          'not_started', v_template.priority, v_template.frequency, v_month_start
        );
      end loop;

    -- ── NESTED display_mode: one task with copied checklist items ────────────
    else

      insert into public.tasks (
        practice_id, title, description, template_id,
        room_id, assigned_to, assigned_role_id, assigned_department,
        status, priority, frequency, due_date
      ) values (
        p_practice_id, v_template.name, v_template.description, v_template.id,
        v_template.room_id,
        v_assigned_to, v_assigned_role_id, v_assigned_department,
        'not_started', v_template.priority, v_template.frequency, v_month_start
      )
      returning id into v_task_id;

      for v_item in
        select label, sort_order, room_id, equipment_id, supply_category_id
        from public.checklist_items
        where template_id = v_template.id
        order by sort_order
      loop
        insert into public.task_checklist_items (
          task_id, practice_id, label, sort_order,
          room_id, equipment_id, supply_category_id,
          is_completed
        ) values (
          v_task_id, p_practice_id, v_item.label, v_item.sort_order,
          v_item.room_id, v_item.equipment_id, v_item.supply_category_id,
          false
        );
      end loop;

    end if;

  end loop;

end;
$$;


create or replace function public.run_monthly_tasks()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_practice record;
begin
  for v_practice in
    select id from public.practices where status = 'active'
  loop
    perform public.generate_monthly_tasks(v_practice.id);
  end loop;
end;
$$;
