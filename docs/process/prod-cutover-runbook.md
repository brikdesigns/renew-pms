# Renew PMS — Post-MVP Prod Cutover Runbook (v0.3.0 catch-up)

**Status: DRAFT for review — no live changes performed.** Resolves blocker [#367](https://github.com/brikdesigns/renew-pms/issues/367). One-time event, like [`beta-launch-runbook.md`](beta-launch-runbook.md). After this cutover, the recurring [`release-runbook.md`](release-runbook.md) cycle resumes unchanged.

## Why this exists

Production (`main`) has been frozen at the **2026-05-04 beta state + 2 feedback hotfixes** since 2026-05-06. All post-launch development — v0.1.1 → v0.3.0, including the entire weekly/monthly recurring-task system — accumulated on `staging` and **never reached customers**. `staging` is **275 commits ahead** of `main`; `v0.2.0` is **not** an ancestor of `main`; there are **zero tags** on `main`. This runbook lands all of it in one rehearsed release and ends the drift.

**End-state chosen (per #367 option A):** `main` = production, `staging` = dress rehearsal, kept in sync. We bring `main` *up to* `staging` once (not a two-way merge), then resume normal small-batch `staging → main` promotions per the standard release runbook.

## Ground truth (verified 2026-06-02)

| Fact | Value |
|---|---|
| `staging` ahead of `main` | 275 commits (diverged at `ff4855b`, 2026-04-10) |
| `main` unique commits | 17 — all launch-era promotions + hotfix cherry-picks + branch-config commits; **content is a strict subset of `staging`** |
| Tags on `main` | 0 |
| Prod DB migration head | `00047` |
| Staging DB migration head | `00053` |
| Migration gap | 6: `00048`–`00053` |

## The migration delta — classified against current prod code

The decisive question is whether each migration is backward-compatible with the **April code currently running in prod**. It was the open risk in #367 (esp. `00049`). **Verified resolved:** April prod code reads role exclusively from `profiles.system_role` (`src/lib/auth.ts` + every `authUser.profile.system_role` call site) — there are **zero reads of `user_metadata`/`raw_user_meta_data` system_role** in `origin/main`. So stripping metadata does not affect running prod code.

| Migration | Nature | Backward-compatible with April prod code? | Notes |
|---|---|---|---|
| `00048` rls scope tightening | Adds `is_brik_admin()`; tightens 2 RLS policies | **Yes** | Mutations go through the admin client (bypasses RLS); tightening is inert for the running API. Depends on `is_admin_role()`/`user_practice_ids()` — both already in prod. |
| `00049` retire system_role metadata | Rewrites `handle_new_user` trigger; strips `system_role` from `auth.users` metadata | **Yes** | April code reads `profiles.system_role`, **not** metadata — verified. The metadata it strips is unread by running code. |
| `00050` backfill spawn-race recovery | Data cleanup: backfills checklist items; **deletes** empty-title tasks, empty-label items, mismatched expanded tasks | **Yes, but destructive** | Targets only malformed rows; resolved (completed/skipped) tasks preserved. **Must rehearse on a prod-data copy and review deletion counts** — this is the only step that removes data. |
| `00051` recurring cadence schema | `add column if not exists task_reset_cadence` (nullable) | **Yes** | Purely additive; old code ignores it. |
| `00052` weekly task generator | `create or replace` new functions | **Yes** | Additive functions; April code never calls them. |
| `00053` monthly task generator | `create or replace` new functions | **Yes** | Same as `00052`. |

**Conclusion: all 6 are backward-compatible with the code currently in prod.** This unlocks the safest ordering.

## Chosen ordering — migrate-first, then deploy

Because every migration is backward-compatible with the April code, we run all 6 **before** deploying the new code. This is the safest sequence:

- It satisfies the **new** code's hard dependency on the new schema (`task_reset_cadence` column + generator functions — referenced in `src/app/api/templates/*`, `src/hooks/useTemplates.ts`, etc.). Deploy-first would 500 those routes until the migration landed.
- It **preserves a clean code-only rollback**: if the code deploy goes bad, republish the previous Netlify deploy (April code) — the migrations don't break it, so no DB rollback is needed.
- `supabase db push` applies `00048`→`00053` in sequence in one step; sequential ordering is fine since none of them break the live code mid-batch.

## Sequenced playbook

### Phase 0 — Decision + freeze (before the window)

- [x] End-state confirmed: **A** (main = prod, staging = rehearsal).
- [ ] Announce a **`staging` freeze** for the cutover (fixed target). Merge or hold open PRs first: [#368](https://github.com/brikdesigns/renew-pms/pull/368) (secret-scanner), [#369](https://github.com/brikdesigns/renew-pms/pull/369) (devtools — currently mis-targeted at `main`; retarget to `staging`), and the release-please PR [#362](https://github.com/brikdesigns/renew-pms/pull/362) (the v0.3.0 cut).
- [ ] Cut the **v0.3.0 tag on staging** by merging #362 — this is the version label the cutover carries. (Cutting the tag ≠ shipping; that's this runbook.)

### Phase 1 — Reconcile branches (one-time, bring main up to staging)

```bash
# From primary worktree on main
BASE_BRANCH=main ./scripts/new-task.sh promote-v0.3.0-catchup
cd ../renew-pms-worktrees/promote-v0.3.0-catchup
git merge --no-ff origin/staging   # expect ~60 conflicts
```

Resolve conflicts in two buckets:

1. **App code** (the large majority) — `staging` is simply newer. **Resolve toward `staging`** (`git checkout --theirs <file>`), then sanity-review.
2. **Trunk-config** (settle to ONE end-state-A model):
   - `CLAUDE.md` — **rewrite** the "Pre-launch base branch" section to the post-launch model (it currently contradicts `release-runbook.md`, which already documents end-state A correctly). main = prod, staging = rehearsal.
   - `scripts/new-task.sh` / `scripts/pr-task.sh` — keep `BASE_BRANCH` default = `staging` (day-to-day task work branches from staging in the two-env model). Remove the stale "pre-launch / flip at go-live" comments.
   - `release-please-config.json` — take **staging's** version (drops the `beta` prerelease; plain `0.MINOR.PATCH` per #358).
   - `release-please.yml` — release-please runs on **staging** (already the model in release-runbook.md).
   - `netlify.toml` — take **staging's** (adds `SECRETS_SCAN_OMIT_PATHS` for the hook test harness). Note: the Netlify **production_branch = main** is a dashboard setting, not in this file — leave it on `main`.
   - `CHANGELOG.md` / `.release-please-manifest.json` / `package.json` — take **staging's** (carries the v0.3.0 history).

Then run the **evil-merge audit** from [`release-runbook.md` § Back-merge](release-runbook.md) (`git diff origin/staging --name-only` → confirm no staging-only work silently reverted; lesson from PR #280). Open the reconciliation PR:

```bash
./scripts/pr-task.sh --base main   # full CI must be green; review the diff
```

Do **not** merge this PR yet — it's the deploy artifact for the window.

### Phase 2 — Dress rehearsal (before the live window)

- [ ] Deploy the reconciled candidate to a **production-equivalent preview** (Netlify deploy preview of the PR branch).
- [ ] Take a **snapshot of prod data** and restore it into a scratch Supabase (or staging reset to a prod-data copy).
- [ ] Run `00048`→`00053` against the prod-data copy via `supabase db push`. **Review `00050`'s deletion counts** — confirm it only removes malformed/ghost rows, no legitimate tasks.
- [ ] Walk the **5-flow smoke path** ([`release-runbook.md` § Smoke checks](release-runbook.md)) against the preview pointed at the migrated copy: login, view tasks, create task, settings/admin, vendor portal.
- [ ] Verify the new weekly/monthly generators: manually invoke `generate_weekly_tasks` / `generate_monthly_tasks` on the copy and confirm sane spawn/skip behavior.

### Phase 3 — Live cutover (operational window: Tue/Wed/Thu 7–9 PM CT)

Practice closed, rollback same-evening. **Migrate-first, then deploy:**

1. [ ] **Snapshot prod DB** (point-in-time / manual backup) — recovery point for `00050`.
2. [ ] **Run migrations** against prod in sequence:
   ```bash
   supabase link --project-ref bbuimkdpmuggrszwenmg   # PROD
   supabase db push                                    # applies 00048 → 00053
   supabase link --project-ref zneuygoeorhkuhktmuld   # re-link to STAGING immediately after
   ```
   (Per CLAUDE.md: prod migrations require explicit confirmation — this step **is** that confirmation point.)
3. [ ] **Deploy code** — merge the Phase-1 reconciliation PR to `main` (`--no-ff`). Netlify production deploy fires on the `main` hook.
4. [ ] **Smoke prod** within 10 min — the 5-flow path on `renew.brikdesigns.com`.
5. [ ] **Watch Sentry 30 min** for new error classes.
6. [ ] **Trigger the daily/weekly/monthly crons manually** to confirm the generators run clean against prod (CRON_SECRET-gated) — a 7 PM deploy otherwise won't exercise them until 5 AM UTC.

**Rollback:** if smoke fails *before* concern about data, republish the previous Netlify deploy (April code) — migrations are backward-compatible, so the prior code runs against the migrated DB. If a data problem surfaces from `00050`, restore from the Phase-3 snapshot. Do **not** force-push `main`; do **not** delete tags.

### Phase 4 — Prevent recurrence

- [ ] Confirm `CLAUDE.md` + `netlify.toml` + `release-please.yml` + `new-task.sh` now describe **one** coherent model (end-state A).
- [ ] Add a guard so a release can't be cut on a non-prod branch and pile up unnoticed (e.g. a scheduled check that alerts when `main` falls > N commits behind `staging`, or when a tag exists on `staging` with no matching promotion to `main`).
- [ ] Resume the standard small-batch cycle in [`release-runbook.md`](release-runbook.md). Close [#367](https://github.com/brikdesigns/renew-pms/issues/367).

## Release notes / changelog

- **CHANGELOG.md** — release-please already assembles v0.3.0 from conventional commits in #362. After reconciliation it correctly lands on `main`.
- **User-facing Release Notes** (`/guide`, added in [#361](https://github.com/brikdesigns/renew-pms/pull/361)) — currently lists v0.2.0 as the latest. Update to add **v0.3.0** and, importantly, the **recurring-task feature set** (weekly/monthly generators, per-template reset cadence, due-date chips) that ships to customers *for the first time* in this cutover even though it was developed across v0.1.x–v0.2.0. Frame it as "now live in production," not by internal version number.

## Open items for the operator before execution

1. Confirm a **prod DB backup / PITR** mechanism is available for the Phase-3 snapshot (Supabase plan dependent).
2. Decide whether to **retarget #369** to `staging` (recommended) or fold it into the reconciliation.
3. Pick the **cutover date** in the Tue/Wed/Thu 7–9 PM CT window.

---

> **Doc note:** migration `00049`'s real filename uses snake_case (`...retire`+`_system_role_metadata`). It's written with a space in the table above because the pre-[#368](https://github.com/brikdesigns/renew-pms/pull/368) secret-scanner regex (`re_[A-Za-z0-9_]{20,}`) false-positives on that identifier as a Resend key. Once #368 merges, the literal filename can be restored.
