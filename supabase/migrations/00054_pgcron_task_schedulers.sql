-- =============================================================================
-- 00054: In-DB scheduling for recurring task generation (pg_cron)
-- =============================================================================
-- WHY: the Netlify scheduled function (netlify/functions/cron-daily-tasks.mts)
-- was the only thing driving generation, and Netlify scheduled functions run
-- ONLY in the production deploy context — never on branch/staging deploys — and
-- in prod it silently never fired. Net effect: generation had to be triggered
-- by hand, lapsed on 2026-05-20, and every practice's board went empty with no
-- alarm. Staging hid it because staging never scheduled anything either.
--
-- FIX: schedule generation in-database with pg_cron. Because it runs in whatever
-- database it's installed in, applying this migration to BOTH staging and prod
-- gives the two environments identical generation behavior — staging finally
-- mirrors prod, so this class of outage surfaces in staging next time. pg_cron
-- also records every run in cron.job_run_details, giving us an audit trail the
-- Netlify path never exposed.
--
-- Schedules are UTC and match the prior Netlify cron intent (05:00 UTC = just
-- before US dental practices open):
--   daily    0 5 * * *   -> run_daily_tasks()    (migration 00045)
--   weekly   0 5 * * 1   -> run_weekly_tasks()   (migration 00052)
--   monthly  0 5 1 * *   -> run_monthly_tasks()  (migration 00053)
--
-- The run_* functions are SECURITY DEFINER and idempotent (skip practices whose
-- tasks already exist for the period), so a pg_cron firing that overlaps a
-- manual run or the still-present Netlify backup endpoint is safe.
--
-- Idempotent: unschedules any same-named job before (re)creating it, so this
-- migration is safe to re-run.
-- =============================================================================

create extension if not exists pg_cron;

-- Drop any prior incarnations of our named jobs so re-applying is a clean upsert.
do $do$
declare
  v_job text;
begin
  foreach v_job in array array['renew-daily-tasks', 'renew-weekly-tasks', 'renew-monthly-tasks']
  loop
    if exists (select 1 from cron.job where jobname = v_job) then
      perform cron.unschedule(v_job);
    end if;
  end loop;
end
$do$;

select cron.schedule('renew-daily-tasks',   '0 5 * * *', $$select public.run_daily_tasks()$$);
select cron.schedule('renew-weekly-tasks',  '0 5 * * 1', $$select public.run_weekly_tasks()$$);
select cron.schedule('renew-monthly-tasks', '0 5 1 * *', $$select public.run_monthly_tasks()$$);
