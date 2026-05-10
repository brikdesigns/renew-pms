-- =============================================================================
-- 00050: Backfill recovery for the template spawn-race bug (#312)
-- =============================================================================
-- Templates created via POST /api/templates used to spawn today's task
-- instance BEFORE PUT /api/templates/[id]/items wrote the items, leaving the
-- spawned task with 0 task_checklist_items rows. The forward fix (#312)
-- moved the spawn call to fire after items land. This migration cleans up
-- the data the bug left behind. All three steps are idempotent — safe to
-- re-run, no-ops when nothing matches.
-- =============================================================================


-- ── Step 1: Backfill task_checklist_items for nested-mode active tasks ──────
-- For every active nested-mode task whose template has items but the task
-- has none, copy the template's checklist_items into task_checklist_items.
-- Resolved (completed/skipped) tasks are left alone — historical work stays
-- as it was. Empty-label template items are excluded so we don't propagate
-- known-bad rows.
insert into public.task_checklist_items
  (task_id, practice_id, label, sort_order, room_id, equipment_id, supply_category_id, is_completed)
select
  t.id, t.practice_id, ci.label, ci.sort_order, ci.room_id, ci.equipment_id, ci.supply_category_id, false
from public.tasks t
join public.task_templates tt on tt.id = t.template_id
join public.checklist_items ci on ci.template_id = tt.id
where tt.display_mode = 'nested'
  and t.status not in ('completed', 'skipped')
  and ci.label is not null
  and trim(ci.label) <> ''
  and not exists (
    select 1 from public.task_checklist_items existing
    where existing.task_id = t.id
  );


-- ── Step 2: Delete empty-title active tasks ─────────────────────────────────
-- These are the ghost cards on the board — tasks the generator created when
-- an expanded-mode template had an empty-label checklist_item, or other
-- malformed shapes. Resolved tasks are preserved.
delete from public.tasks
where status not in ('completed', 'skipped')
  and (title is null or trim(title) = '');


-- ── Step 3: Delete empty-label checklist_items ──────────────────────────────
-- PR #305 added template-editor validation to prevent empty rows going
-- forward; this drops pre-existing offenders so the next spawn doesn't
-- recreate the ghost.
delete from public.checklist_items
where label is null or trim(label) = '';


-- ── Step 4: Drop expanded-mode tasks that still carry task_checklist_items ──
-- Pattern: a template was spawned under nested mode (one parent task with
-- copied items), then flipped to expanded after the fact. The old nested-
-- shape task is now hidden by the loadTasks render filter (display_mode =
-- 'expanded' AND tci > 0), and the generator's idempotency check refuses
-- to re-spawn → nothing visible on the board.
--
-- Recovery: delete the mismatched task + its tci children. The next
-- generator pass (or the in-app save flow under the #312 fix) spawns the
-- correct expanded shape (one task per checklist_item, no tci rows).
--
-- Note: legitimate expanded children have tci = 0 by definition (they ARE
-- the items), so the `exists tci` clause correctly excludes them.
with mismatched as (
  select t.id as task_id
  from public.tasks t
  join public.task_templates tt on tt.id = t.template_id
  where tt.display_mode = 'expanded'
    and t.status not in ('completed', 'skipped')
    and exists (select 1 from public.task_checklist_items tci where tci.task_id = t.id)
),
del_items as (
  delete from public.task_checklist_items
  where task_id in (select task_id from mismatched)
  returning task_id
)
delete from public.tasks
where id in (select task_id from mismatched);
