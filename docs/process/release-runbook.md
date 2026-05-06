# Renew PMS — Release Runbook

How a release is cut, promoted to production, and back-merged. Companion to [`beta-launch-runbook.md`](beta-launch-runbook.md) (one-time launch) and [`session-discipline.md`](session-discipline.md) (per-session rules).

## Mental model — one tag history, two branches

| Branch | Means | Source of truth for |
|---|---|---|
| `staging` | "What's about to ship" | Active development; release-please runs here; `vX.Y.Z` tags created here |
| `main` | "What's in production" | Whatever's currently deployed at `renew.brikdesigns.com` |

Releases are cut on **staging** (release-please opens a PR; merging it tags + publishes). Promotion is a **separate event**: a PR from staging → main, merged when you're ready to deploy. Don't conflate "cut a release" with "deploy to prod" — they are independent decisions.

## Cadence

| Action | Cadence | Notes |
|---|---|---|
| **Cut a release** (merge release-please PR on staging) | Every 1–2 weeks | While 1–3 practices live; move to weekly at 4+ |
| **Promote staging → main** (deploy to prod) | Same day as the release cut, in the operational window below | One client = stability over novelty |
| **Hotfix → main** | On demand | Fix path bypasses the release cycle. See [Hotfix](#hotfix-path) below |

## Operational window for production deploys

- **Tue / Wed / Thu, 7–9 PM CT.** Practice is closed; you're awake; mistakes can be rolled back same-evening.
- **Never Friday afternoon, weekends, or before 6 AM CT** unless it's a hotfix you'll babysit.
- **Avoid Monday** — bad day to break someone's start-of-week.
- **Cron timing matters.** `generate-daily-tasks` runs early morning (CRON_SECRET-gated). A 7 PM deploy that breaks the cron doesn't fail until 6 AM the next day. If a deploy touches API routes the cron hits, plan for a manual cron trigger after deploy to verify.

## Pre-promotion checklist (before opening the staging → main PR)

Run through this in 2 minutes. Stop if any item fails.

- [ ] **Staging CI green** on the SHA you're about to promote (`gh run list --branch staging --limit 1`)
- [ ] **`v0.1.X` tag created** by release-please (`git fetch --tags && git tag -l v*`)
- [ ] **No open PRs targeting staging** with conflicting work (`gh pr list --base staging`)
- [ ] **Staging deploy preview is healthy** (load `staging.renew.brikdesigns.com`, click through 5 critical flows: login, view tasks, create task, settings, vendor portal token)
- [ ] **Sentry error rate baseline checked** — last 24h on staging shouldn't show new error classes vs. previous release
- [ ] **No prod migrations pending** (or if there are: see [Migrations](#migrations) below — they need a different flow)

## The promotion cycle — two PRs, in order

### 1. Promote: staging → main

```bash
# From primary worktree on main
BASE_BRANCH=main ./scripts/new-task.sh promote-vX.Y.Z
cd ../renew-pms-worktrees/promote-vX.Y.Z
git merge --no-ff origin/staging   # explicit merge commit, no squash
./scripts/pr-task.sh --base main
```

**Why no squash:** the promote PR's value is its commit history — preserves all the conventional commits release-please tagged. Squashing flattens that into one commit and breaks the `vX.Y.Z` → main correspondence.

When the PR merges:
- Netlify production deploy fires automatically (`main` branch hook)
- The `vX.Y.Z` tag now points at a SHA reachable from main
- Sentry releases pick up the tag via `SENTRY_AUTH_TOKEN` source-map upload

### 2. Smoke test prod (within 10 minutes)

Same 5 flows from the pre-promotion checklist, on `renew.brikdesigns.com`. Watch Sentry for new error classes for the next 30 minutes — most regressions surface within minutes of real traffic hitting them.

If smoke fails: see [Rollback](#rollback) below.

### 3. Back-merge: main → staging

After main is healthy in prod, run a back-merge to keep staging in sync.

```bash
# From primary worktree on staging
BASE_BRANCH=staging ./scripts/new-task.sh backmerge-vX.Y.Z
cd ../renew-pms-worktrees/backmerge-vX.Y.Z
git merge --no-ff origin/main
```

Then **the evil-merge audit** (mandatory; lesson from PR #280):

```bash
# Compare PR branch tree to current staging — anything different that staging didn't intend to change is a silent revert
git diff origin/staging --name-only

# For each file in the diff, find the last staging-side touch:
git diff origin/staging --name-only | while read f; do
  echo "=== $f ==="
  git log -1 --format='  staging: %h %s' origin/staging -- "$f"
  git log -1 --format='  main:    %h %s' origin/main -- "$f"
done
```

Review every entry. If a file's last-touch on staging is a PR that exists in the back-merge branch's git history but the working tree doesn't reflect it, that's a silent revert from the merge mechanism — restore with `git checkout origin/staging -- <file>` before pushing.

This audit catches the failure mode where `git merge` resolves a file in favor of main's version and the working tree silently drops staging-only PR work. PR #280 lost five staging-only PRs (two security regressions) this way; the audit makes it impossible to miss again.

```bash
./scripts/pr-task.sh --base staging
```

## Smoke checks — the 5-flow critical path

After every prod deploy, walk through these. Anything red = stop and rollback.

1. **Login** — `/login` → email/password → land on `/dashboard`. Then sign-out → sign-in via Google.
2. **View tasks** — `/tasks` → board renders, drag a card column-to-column → save reflects in DB.
3. **Create task** — `+ Add Task` from sidebar → fill template → save → appears on board.
4. **Settings — admin path** — `/settings/users` loads, invite flow opens (don't actually invite), `/settings/templates` lists templates.
5. **Vendor portal** — load a tokenized vendor URL (from `/settings/vendors`) in a private window → message thread renders → reply works.

If you have a few minutes more: also load `/schedule`, `/training`, `/requests`. If any of those break, it's a regression but not necessarily blocking — file an issue and decide.

## Rollback

If smoke fails or Sentry shows a new error class spike post-deploy:

```bash
# Identify the SHA you just deployed and the SHA before it
gh run list --branch main --workflow CI --limit 2 --json headSha,createdAt

# Open a revert PR for the merge commit
gh pr create --base main --head <revert-branch> --title "revert: emergency rollback of vX.Y.Z" --body "..."
```

**Don't** force-push to main. **Don't** delete the bad tag. The revert PR creates a clean rollback commit; if you later cherry-pick the offending change as a hotfix, the history is honest about what happened.

After the revert merges:
1. Smoke prod again
2. Open a tracking issue for the regression with reproduction steps
3. Back-merge the revert into staging so staging matches prod again

## Hotfix path

When prod is broken and you can't wait for a release cycle:

```bash
# Branch directly from main (not staging)
BASE_BRANCH=main ./scripts/new-task.sh hotfix-{slug}
# ... fix ...
./scripts/pr-task.sh --base main
```

After the hotfix merges to main:
1. Tag manually if needed (`git tag -a vX.Y.Z+1 -m "hotfix: ..."` then push)
2. Cherry-pick the fix onto staging (`git cherry-pick <sha>` from a staging-based branch)
3. Or wait for the next back-merge cycle if the bug isn't on staging anyway

Hotfixes don't go through release-please — that's a feature, not a bug. The CHANGELOG entry for the next regular release will note them.

## Migrations

Per [`CLAUDE.md` § Supabase](../../CLAUDE.md): **never run prod migrations without explicit confirmation.** The release runbook respects that — promotion to main does not auto-run migrations on the production Supabase project.

When a release contains a migration:
1. Verify the migration ran clean on staging Supabase before promoting
2. After main deploys, run the migration against prod via Management API: `supabase link --project-ref bbuimkdpmuggrszwenmg && supabase db push` (then immediately re-link to staging)
3. Smoke check that the migration's effect is visible in prod (e.g., new column populated for existing rows)

If the migration is destructive (drop column, drop table, alter constraint) — pause and consult before promotion. Two-step migrations (additive on release N, destructive on release N+1 once code is live) are the safe default for column drops.

## Tag policy

- Tags live on **staging** (created by release-please). They stay where release-please puts them.
- Don't move tags. Don't retag. Don't delete tags.
- The `--no-ff` promotion merge means `vX.Y.Z` is reachable from main after promotion — no tag movement needed. `git describe origin/main` answers "what's deployed."

## What this runbook does not cover

- The first prod cutover (covered in [`beta-launch-runbook.md`](beta-launch-runbook.md), one-time event from 2026-05-04)
- Per-session work discipline (covered in [`session-discipline.md`](session-discipline.md))
- Cross-repo release coordination — when a release depends on a BDS bump, the BDS publish and version pin happens before the renew-pms release cycle starts
