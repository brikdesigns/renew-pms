# ADR-003: Recurring Task Timezone Scope

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Nick Stanerson  
**Relates to:** #337, #338, #339, #340, #341

---

## Context

The existing daily task generator fires at `0 5 * * *` UTC (Netlify scheduled function). The weekly and monthly generators must also choose a fire time. A dental practice in Los Angeles (PDT, UTC−7) sees 05:00 UTC as 10:00 PM the previous evening; a practice in New York (EDT, UTC−4) sees it as 01:00 AM local. The question is whether these generators need to be timezone-aware at launch.

---

## Decision

**Fire at a fixed UTC time (Option A). No per-practice timezone column.**

All three generators (daily, weekly, monthly) fire at 05:00 UTC. The daily generator already uses this schedule and it is working correctly. Weekly and monthly generators adopt the same schedule:

| Generator | Cron | UTC fire time |
|---|---|---|
| Daily | `0 5 * * *` | 05:00 UTC daily |
| Weekly | `0 5 * * 1` | 05:00 UTC every Monday |
| Monthly | `0 5 1 * *` | 05:00 UTC first of each month |

No `practices.timezone` column is added in this release. All stale-skip predicates use `current_date` at UTC-midnight as the boundary.

**Not chosen — Option B (per-practice timezone):** computing practice-local midnight requires a `practices.timezone` column (IANA zone), a `pg_timezone_names` check constraint, and generator refactoring to accept a timezone parameter. For a pre-launch product with a US-only customer base, this adds ~4h of schema + refactor work with no immediate benefit. The 05:00 UTC fire time falls in a low-activity window for all US time zones (9 PM–midnight local), which is acceptable.

---

## Consequences

**Positive:**
- Zero schema changes needed for timezone scope.
- Simple, uniform cron schedule — all generators fire at the same UTC hour.
- Consistent with the working daily generator; no divergence risk.

**Negative:**
- West Coast practices (PDT) roll over at ~10 PM local. A Monday task for a PDT practice technically "appears" Sunday night local. For clinical workflows this is acceptable since staff log in Monday morning and see the fresh task.
- This decision must be revisited before expanding to non-US markets. The migration path (add `practices.timezone`, backfill `'America/New_York'`, refactor generators) is straightforward but disruptive to cron schedules.

**Constraints imposed on downstream issues:**
- Cron schedules for `cron-weekly-tasks.mts` and `cron-monthly-tasks.mts` must use `'0 5 * * 1'` and `'0 5 1 * *'` respectively.
- No `practices.timezone` migration. Issue #339 only ships the `task_reset_cadence` column.
- If #345 QA tests cover DST: mark DST test as `test.skip` with a tracking comment referencing this ADR. DST impact is real but falls within the accepted timezone-drift tolerance above.
