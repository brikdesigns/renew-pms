# ADR-002: Recurring Task Rollover Semantic

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Nick Stanerson  
**Relates to:** #337, #338, #339, #340, #341

---

## Context

Daily task generation is live (`generate_daily_tasks`, migration 00045). The weekly and monthly generators (#340, #341) need a defined rollover semantic before any code can be written: when a recurring task is incomplete at the rollover boundary, what should happen to the stale row and what should the next period's row look like?

Three decisions are nested here:

1. **Row fate** — skip the old row, or carry it forward.
2. **Week start** — ISO Monday or US Sunday, for weekly tasks.
3. **Prior-period scope** — how far back does the stale-skip sweep?

---

## Decision

### 1. Skip + spawn fresh (Option A)

When the generator runs at a period boundary, it:

1. Marks all `not_started` or `in_progress` tasks from prior periods as `skipped` (stale-skip).
2. Inserts a new `not_started` task row with `due_date` set to the current period start.

The daily generator already uses this pattern (migration 00045, lines 88–95). Consistency across all frequencies is the primary motivation.

**Not chosen — Option B (carry row forward):** updating `due_date` on the existing row preserves row identity but breaks the idempotency invariant (the generator uses `due_date = period_start` to skip already-spawned rows), complicates history queries, and risks duplicate detection failures if the generator re-runs mid-period.

### 2. Monday as ISO week start

The weekly generator uses `date_trunc('week', current_date)` (Postgres default: Monday) as the period start date. Weekly tasks spawn on Monday; incomplete tasks with `due_date < date_trunc('week', current_date)` are stale-skipped.

**Not chosen — Sunday start:** requires manual offset arithmetic (`current_date - EXTRACT(DOW FROM current_date)::int`), diverges from Postgres built-ins, and adds test complexity with no business benefit.

### 3. Single-period stale-skip

Each generator only sweeps its own frequency. The weekly generator does not touch daily tasks; the monthly generator does not touch weekly tasks. The stale-skip predicate is:

- Weekly: `frequency = 'weekly' AND due_date < date_trunc('week', current_date) AND status NOT IN ('completed', 'skipped')`
- Monthly: `frequency = 'monthly' AND due_date < date_trunc('month', current_date) AND status NOT IN ('completed', 'skipped')`

---

## Consequences

**Positive:**
- Consistent history model across all frequencies — stale = skipped, new period = new row.
- Idempotency is trivially checkable: `EXISTS(SELECT 1 FROM tasks WHERE template_id = X AND due_date = period_start)`.
- Postgres `date_trunc('week', …)` gives Monday for free; no custom offset math.

**Negative:**
- A task that was always incomplete shows a chain of `skipped` rows over time. Acceptable for a pre-launch product with no historical data yet.
- Row identity is not preserved across periods. Future analytics that need "the same task across weeks" must join on `template_id` + period start, not on `task.id`.

**Constraints imposed on downstream issues:**
- `generate_weekly_tasks()` and `generate_monthly_tasks()` must run the stale-skip update before the spawn loop.
- `loadTasks()` stale-recurring clause excludes `skipped`, so skipped rollover rows stay off the board — no change needed there.
- Integration tests must verify: (a) stale-skip fires, (b) completed tasks are not re-opened, (c) idempotency within the same period.
