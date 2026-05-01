-- =============================================================================
-- 00045: Template assignment FK fix + mode-aware daily generator
-- =============================================================================
-- Two corrections folded into one migration since they are coupled:
--
-- 1) Replace task_templates.assigned_user_id (→ profiles) with
--    task_templates.assigned_member_id (→ practice_members). Symmetric with
--    tasks.assigned_to, which also references practice_members. Avoids a
--    profile→member translation in the generator and keeps practice scoping
--    inside the FK.
--
-- 2) Rename + rewrite the daily task generator to be mode-aware. Previously it
--    was hardcoded to assignment_mode = 'pool', so individual/role/department
--    templates produced no daily instances at all (the bug Emily Rivera hit).
--    Stale-skip predicate also widened from `assigned_to IS NULL` to
--    `template_id IS NOT NULL` so stale incomplete instances of any mode get
--    cleared the next day.
--
-- The migration is dev-only at this point — no production data exists.
-- =============================================================================


-- ── Step 1: replace assigned_user_id with assigned_member_id ────────────────

alter table public.task_templates
  drop column if exists assigned_user_id;

alter table public.task_templates
  add column assigned_member_id uuid references public.practice_members(id) on delete set null;

create index if not exists task_templates_assigned_member_id_idx
  on public.task_templates(assigned_member_id)
  where assigned_member_id is not null;

comment on column public.task_templates.assigned_member_id is
  'Individual assignee for assignment_mode = ''individual''. References practice_members(id) to mirror tasks.assigned_to. Null for role/department/pool modes.';


-- ── Step 2: drop old pool-only functions ────────────────────────────────────

drop function if exists public.run_daily_pool_tasks();
drop function if exists public.generate_daily_pool_tasks(uuid);


-- ── Step 3: mode-aware daily generator ─────────────────────────────────────

create or replace function public.generate_daily_tasks(p_practice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today    date := current_date;
  v_template record;
  v_task_id  uuid;
  v_item     record;
  v_exists   boolean;
  v_assigned_to uuid;
  v_assigned_role_id uuid;
  v_assigned_department uuid;
begin

  -- Step A: skip stale generator-spawned daily/per-shift tasks from prior days.
  -- Predicate is template_id IS NOT NULL (covers all assignment modes), not
  -- assigned_to IS NULL (which only caught pool/role/department, missing
  -- individual-mode stale instances).
  update public.tasks
  set status = 'skipped',
      updated_at = now()
  where practice_id = p_practice_id
    and template_id is not null
    and frequency in ('daily', 'per_shift')
    and due_date < v_today
    and status not in ('completed', 'skipped');

  -- Step B: spawn today's instances for every active recurring template
  -- whose assignment is fully specified for its mode. Pool templates always
  -- qualify; the others require their corresponding FK to be set, otherwise
  -- the generator silently skips an unconfigured template (admin sees nothing
  -- spawned, prompting them to finish the assignment).
  for v_template in
    select id, name, description, type, frequency, priority, display_mode,
           room_id, assignment_mode,
           assigned_member_id, assigned_role_id, department_id
    from public.task_templates
    where practice_id = p_practice_id
      and status = 'active'
      and frequency in ('daily', 'per_shift')
      and (
        assignment_mode = 'pool'
        or (assignment_mode = 'individual' and assigned_member_id is not null)
        or (assignment_mode = 'role'       and assigned_role_id   is not null)
        or (assignment_mode = 'department' and department_id      is not null)
      )
  loop

    -- Idempotency: skip if today's instance(s) already exist for this template
    select exists(
      select 1 from public.tasks
      where template_id = v_template.id
        and practice_id = p_practice_id
        and due_date = v_today
    ) into v_exists;

    if v_exists then
      continue;
    end if;

    -- Resolve assignment FKs from mode. AssignmentPicker enforces that only
    -- the mode-relevant FK is set on the template, so this CASE just copies
    -- the right one onto each spawned task without inventing data.
    v_assigned_to         := case when v_template.assignment_mode = 'individual' then v_template.assigned_member_id end;
    v_assigned_role_id    := case when v_template.assignment_mode = 'role'       then v_template.assigned_role_id   end;
    v_assigned_department := case when v_template.assignment_mode = 'department' then v_template.department_id      end;

    -- ── EXPANDED display_mode: one task per checklist item ────────────────
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
          'not_started', v_template.priority, v_template.frequency, v_today
        );
      end loop;

    -- ── NESTED display_mode: one task with copied checklist items ─────────
    else

      insert into public.tasks (
        practice_id, title, description, template_id,
        room_id, assigned_to, assigned_role_id, assigned_department,
        status, priority, frequency, due_date
      ) values (
        p_practice_id, v_template.name, v_template.description, v_template.id,
        v_template.room_id,
        v_assigned_to, v_assigned_role_id, v_assigned_department,
        'not_started', v_template.priority, v_template.frequency, v_today
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


-- ── Step 4: cross-practice wrapper ─────────────────────────────────────────

create or replace function public.run_daily_tasks()
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
    perform public.generate_daily_tasks(v_practice.id);
  end loop;
end;
$$;
