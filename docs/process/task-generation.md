# Task generation — how it works & how to operate it

How recurring tasks land on users' boards each day, and what to do when they don't.
Written after the 2026-05 outage where generation silently stopped for ~2 weeks
(boards went empty; customers reverted to pen-and-paper).

## The pipeline

1. **Templates** (`task_templates`, `is_default` or admin-authored) define recurring
   work with a `frequency` (`daily` / `per_shift` / `weekly` / `monthly` / …) and an
   `assignment_mode` (`individual` / `role` / `department` / `pool`) + matching FK.
2. **Generators** (Postgres functions) spawn dated `tasks` rows from active templates:
   - `run_daily_tasks()` → `generate_daily_tasks(practice)` — `daily` + `per_shift` (migration 00045)
   - `run_weekly_tasks()` — `weekly` (00052)
   - `run_monthly_tasks()` — `monthly` (00053)
   - All are SECURITY DEFINER and **idempotent** (skip a practice whose tasks for the
     period already exist), so re-running is always safe.
3. **Scheduler** — **pg_cron, in-database** (migration 00054). This is the source of
   truth. Runs in whichever DB it's installed in, so **staging and prod behave
   identically** (the gap that hid the outage). Jobs (UTC):
   | job | schedule | function |
   |---|---|---|
   | `renew-daily-tasks` | `0 5 * * *` | `run_daily_tasks()` |
   | `renew-weekly-tasks` | `0 5 * * 1` | `run_weekly_tasks()` |
   | `renew-monthly-tasks` | `0 5 1 * *` | `run_monthly_tasks()` |
4. **Backup trigger** — `netlify/functions/cron-daily-tasks.mts` → `POST /api/cron/generate-daily-tasks`
   (Bearer `CRON_SECRET`). Manual/redundant only; **not** the primary path. (Netlify
   scheduled functions run only in the production deploy context, which is why relying
   on them silently failed.)
5. **Monitor** — `.github/workflows/task-generation-monitor.yml` runs 06:00 UTC daily and
   **fails (notifies)** if any active practice with recurring templates has 0 tasks today.
   Independent of app/Netlify/DB-cron, so it catches every failure mode.

## Operations

**Is generation healthy?**
```bash
# cron jobs present + active (per DB)
./scripts/netlify-ops.sh status         # site overview (deploys)
# DB scheduler state (read-only Management API; see scripts/db-health.sh for the pattern)
#   select * from cron.job;
#   select status, return_message, start_time from cron.job_run_details
#     join cron.job using (jobid) where jobname='renew-daily-tasks' order by start_time desc limit 5;
```

**Manually generate today** (idempotent — safe anytime):
```sql
select public.run_daily_tasks();          -- all active practices
-- or one practice:
select public.generate_daily_tasks('<practice_id>'::uuid);
```
Run via the Supabase SQL editor, or the Management API path used by `scripts/db-health.sh`.
App fallback: `POST https://renew.brikdesigns.com/api/cron/generate-daily-tasks`
with `Authorization: Bearer $CRON_SECRET` (prod value lives only in Netlify env).

**When the monitor fires (PROD has starved practices):**
1. Manually generate (above) to unblock customers immediately.
2. Diagnose the scheduler: check `cron.job` (jobs present + `active`) and
   `cron.job_run_details` (last run status + `return_message`).
3. Common causes: pg_cron disabled/extension dropped; a `run_*` function error
   (read the `return_message`); a template data issue (`assignment_mode` set but its
   FK null → generator skips it — see [launch-checklist 0.8](../qa/launch-checklist.md)).

## Known gaps (tracked separately)

- **Quarterly / annual frequencies don't generate** — only daily/per_shift/weekly/monthly
  have generators. Templates 6 (annual) & 8 (quarterly) from `seed_template_defaults`
  never spawn. See launch-checklist 1.1.
- **`seed_template_defaults` (00009) is stale** — looks up depts/roles by pre-00033
  names, so a newly provisioned practice gets un-spawnable templates. Forward fix tracked
  as a follow-up. (Existing customer Renew Dental is unaffected — its templates are correct.)
