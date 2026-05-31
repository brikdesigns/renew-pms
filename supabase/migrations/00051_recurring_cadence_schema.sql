-- Migration: 00051_recurring_cadence_schema.sql
--
-- Adds task_reset_cadence to task_templates.
--
-- ADR-002 chose skip+spawn-fresh as the rollover semantic.
-- ADR-003 deferred per-practice timezone (fixed UTC cron, no practices.timezone column).
--
-- task_reset_cadence controls how the weekly/monthly generators decide to
-- stale-skip an incomplete task: a template with frequency='weekly' and
-- task_reset_cadence='weekly' gets stale-skipped by generate_weekly_tasks().
-- Nullable — existing daily/per_shift templates implicitly reset daily and
-- don't need a value here (generate_daily_tasks() ignores this column).

alter table public.task_templates
  add column if not exists task_reset_cadence text
    check (task_reset_cadence in ('daily', 'weekly', 'monthly'));

comment on column public.task_templates.task_reset_cadence is
  'Controls which generator owns stale-skip for this template. '
  'Null = inherited from frequency (daily/per_shift templates always reset daily). '
  'Set explicitly for weekly/monthly templates by practice admins via #343 Settings UI.';
