# Renew PMS — Beta Launch Runbook

**Target launch:** Monday (T-0)
**Audience:** Nick + assisting agent. Read top-to-bottom once before starting; execute phase-by-phase on the day.
**Status:** Draft — answer the open questions in §1 before executing.

This runbook coordinates three changes that **must happen together**:

1. Provision a dedicated production Supabase project (separate from current dev/staging).
2. Move customer-facing surface from the current "all in one project" Netlify setup to a real prod ↔ staging split.
3. Cut the first real-customer beta cleanly — no test users, no persona switcher, no `TestUser123!` password baked into the prod bundle.

If any phase fails, the rollback at the end of that phase puts you back to the prior working state. Don't skip rollback verification — it's the cheapest insurance.

---

## §0. Conventions used in this doc

- **🟡 ASK NICK** — a decision that must be made before the step can run.
- **✅ Verify** — a concrete check (command or dashboard observation) that the step succeeded.
- **↩️ Rollback** — what to do if this step fails or you need to back out within the next ~24 hours.
- **🔒 Secret** — a value lives in 1Password / Netlify env vars; never paste, never `cat`, never `netlify env:list`. Reference items by 1P title, fetch with `op read` piped into the consumer.

---

## §1. Open questions (resolve before T-0)

These block Phase 1 or Phase 4. Answer them in this section before starting.

### 1.1 Production custom domain

🟡 **ASK NICK:** What domain should production live at?

Current `netlify.toml` comment says: `main → renew-pms.netlify.app (production, custom domain TBD)`. Three reasonable options:

- `renew-pms.brikdesigns.com` — Brik subdomain, fastest to set up (DNS already managed).
- `app.renewdental.com` (or whatever the practice's domain is) — feels like the practice's product, cleaner for end-users.
- Keep `renew-pms.netlify.app` for the beta, decide on real domain after.

**Recommendation:** Brik subdomain for the beta. Cheapest, reversible, doesn't lock in a name we may regret. Promote to a practice-owned domain post-beta.

**Decision (fill in):** _____________________________

### 1.2 Practice + staff data — what gets seeded?

🟡 **ASK NICK:** What's the source of truth for the real practice and staff list?

The dev project (`zneuygoeorhkuhktmuld`) currently has:
- 7 test personas (`test+*@brikdesigns.com`) created by `scripts/seed-test-users.ts`.
- Real staff records from earlier Notion sync (per `project_beta_email_plan` memory: 4 incomplete records still need title/dept/start date in Notion before they can be provisioned).

We do **not** want to migrate the dev project's data wholesale. Test users + persona-switcher artifacts must not land in prod. Three sub-questions:

- **a.** Is the practice provisioning script in the repo, or do we provision the practice manually via SQL? Today, only `seed_practice_defaults(practice_id, office_id)` exists — that seeds reference tables (departments, role types, etc.) but not the practice row itself.
- **b.** Do we have real emails for **all** staff? If not, who gets the placeholder `test+...` treatment until they're collected?
- **c.** Do any existing tasks / requests / training assignments need to come along to prod, or does the practice start with a clean slate?

**Decision (fill in):** _____________________________

### 1.3 Cron secret + cron destination

The `CRON_SECRET` env var gates `POST /api/cron/generate-daily-tasks`. Today it lives on Netlify production context. After Phase 4, production becomes `main`-deploys (a different deploy context). Need to:

- Keep `CRON_SECRET` on the new production context.
- Confirm the Netlify scheduled function `cron-daily-tasks.mts` runs against the new prod URL, not staging.

**Decision (fill in):** _____________________________

### 1.4 Sentry project — one or two?

Currently a single Sentry project (`renew-pms`) receives errors from all environments. Sentry's `environment` tag (set via Sentry SDK config) distinguishes them, so a single project is fine — as long as the SDK initialization tags `production` vs `staging` correctly.

**Verify (during Phase 4):** confirm `instrumentation-client.ts` and `instrumentation.ts` set `environment: process.env.NEXT_PUBLIC_NETLIFY_CONTEXT` or equivalent.

If they don't, this becomes a blocker — open a small fix PR before launch.

---

## §2. Pre-flight — T-3 to T-1 (do these earlier in the week)

Each can be done before the cutover day; doing them early de-risks the day-of.

- [ ] **§2.1** Confirm Supabase Pro plan covers 2 active projects with no add-on cost. Check current org dashboard at https://supabase.com/dashboard — Org Settings → Billing. Pro plan today (2026-05) includes 2 projects; a third adds $10/month. Two is the target.
- [ ] **§2.2** Confirm domain availability + DNS access for the answer to §1.1. If using a Brik subdomain, no action — Netlify will issue + auto-renew the Lets Encrypt cert when wired in Phase 4.
- [ ] **§2.3** Pull the **real staff list** from Notion + practice contact and resolve the 4 incomplete records flagged in `project_beta_email_plan`. Without complete records, Phase 3 stalls.
- [ ] **§2.4** Confirm 1Password vault has placeholders for the new credentials. Create empty items now so Phase 1 can fill them in immediately:
  - `Renew PMS — Production DB` (will hold the new Supabase URL + service role + anon key + DB password)
  - `Renew PMS — Production Cron Secret`
- [ ] **§2.5** Make sure `op` CLI is signed in: `eval $(op signin)`. Confirms before Phase 1 needs to write items.
- [ ] **§2.6** PR #133 (feedback FAB gate split) merged to staging? `gh pr view 133 --json state -q .state` should return `MERGED`. If not, this is a blocker for Phase 4 — the FAB code path must exist in `staging` before that branch's bundle becomes the production deploy.
- [ ] **§2.7** PR #134 (release-please) merged to staging? Same check, PR 134. Not strictly a blocker for launch but lands the versioning machinery so Monday's launch can be tagged `v0.1.1-beta.0`.
- [ ] **§2.8** Save a fresh schema dump from dev as a baseline reference: `supabase db dump --linked --file ./pre-launch-schema-snapshot.sql` (don't commit). This is a safety net so we can compare prod schema against it after Phase 2.

---

## §3. Phase 1 — Provision the production Supabase project

**Goal:** Empty Supabase project, on the same Brik Designs org, ready to receive migrations. Currently the only project is the combined dev/staging at `zneuygoeorhkuhktmuld`.

**Time estimate:** 15 minutes.

### Steps

- [ ] **§3.1** Open https://supabase.com/dashboard. Confirm org "Brik Designs" is selected (top-left).
- [ ] **§3.2** Click **New project**. Fill in:
  - **Name:** `renew-pms-production`
  - **Database password:** generate via `openssl rand -base64 32`, save to 1P item `Renew PMS — Production DB` field `db-password`. Do **not** paste into chat.
  - **Region:** match dev (look at dev project Settings → General → Region — likely `us-east-1`).
  - **Pricing plan:** Pro (org-level, no per-project cost up to 2 projects).
- [ ] **§3.3** Wait for provisioning (~2 minutes). Project goes through "Setting up" → "Active".
- [ ] **§3.4** Once active, capture and save these to 1Password item `Renew PMS — Production DB` (use 1P web UI directly — never paste into chat):
  - **Project ref:** the slug in the URL after `/project/` (e.g., `abcdefghijklmnop`). Save as field `project-ref`.
  - **Project URL:** Settings → API → Project URL (`https://<ref>.supabase.co`). Save as `url`.
  - **Anon key:** Settings → API → `anon` `public`. Save as `anon-key`.
  - **Service role key:** Settings → API → `service_role` `secret`. Save as `service-role-key`. **This is the dangerous one** — it bypasses RLS.
- [ ] **§3.5** Configure auth settings to match dev:
  - **Authentication → URL Configuration → Site URL:** the production URL from §1.1 (or `https://renew-pms.netlify.app` as a placeholder if domain isn't ready).
  - **Authentication → URL Configuration → Redirect URLs:** add the production URL + `https://staging--renew-pms.netlify.app` + `https://deploy-preview-*--renew-pms.netlify.app` (deploy preview wildcard).
  - **Authentication → Email Templates:** copy from dev (Settings → Auth → Email Templates on dev, paste into prod). Should match the welcome / reset / confirm flows.

### ✅ Verify

- [ ] `op item get "Renew PMS — Production DB" --vault Development --fields project-ref --reveal` returns the new ref. (Use `--reveal` only inside `$()` capture, never to terminal.)
- [ ] Dashboard shows project status "Active" with database accessible.
- [ ] **No** schema yet (Tables tab empty).

### ↩️ Rollback

Provisioning is reversible — Settings → General → Pause project, or delete entirely. No customer impact since prod URL isn't pointed here yet.

---

## §4. Phase 2 — Migrate prod schema

**Goal:** Run the 47 migrations from `supabase/migrations/` against prod. Prod schema = dev schema, byte-for-byte (ignoring data).

**Time estimate:** 10 minutes (the migrations are fast).

### Steps

- [ ] **§4.1** From the primary worktree on `staging`:
  ```bash
  cd /Users/nickstanerson/Documents/GitHub/product/renew-pms
  git checkout staging && git pull --ff-only
  ```
- [ ] **§4.2** Source the production credentials silently into the shell **without displaying them**:
  ```bash
  PROD_REF=$(op item get "Renew PMS — Production DB" --vault Development --fields project-ref --reveal)
  SUPABASE_DB_PASSWORD=$(op item get "Renew PMS — Production DB" --vault Development --fields db-password --reveal)
  export PROD_REF SUPABASE_DB_PASSWORD
  ```
- [ ] **§4.3** Link the Supabase CLI temporarily to prod (the `supabase/config.toml` `project_id` stays as `renew-pms` for dev — we override per-command):
  ```bash
  supabase link --project-ref "$PROD_REF"
  ```
  This rewrites `.supabase/config.toml` (gitignored) to point at prod. Confirm with `supabase status`.
- [ ] **§4.4** Inspect what's about to apply (sanity check):
  ```bash
  supabase migration list
  ```
  Expect: all 47 migrations listed as "local only" / "remote not present".
- [ ] **§4.5** Apply migrations:
  ```bash
  supabase db push
  ```
  This runs each migration in order. Watch for errors — any failure stops the chain.
- [ ] **§4.6** Re-link to dev so day-to-day work doesn't accidentally hit prod:
  ```bash
  supabase link --project-ref zneuygoeorhkuhktmuld
  ```

### ✅ Verify

- [ ] `supabase migration list` (after re-linking to dev) shows dev unchanged.
- [ ] In Supabase dashboard for prod project, **Table Editor** shows all expected tables (practices, profiles, practice_members, tasks, etc. — 17 tables per CLAUDE.md).
- [ ] **Authentication → Users** is empty (zero rows — clean slate).
- [ ] Run `./scripts/db-health.sh --prod` against prod (set `SUPABASE_PROJECT_REF` env to PROD_REF first). Expect: 0 orphans, 0 RLS failures, 17/17 tables RLS-enabled, 38 policies.

### ↩️ Rollback

If any migration fails:

1. Note the failing migration number.
2. The schema is in a partial state. **Do not** try to "fix" the migration on prod — fix it in dev first (open a PR, run on dev, merge), then come back.
3. To fully reset prod: Supabase dashboard → Settings → Database → Reset database. Wipes all schemas. You can then re-run §4.5 from a clean state.
4. If prod is unrecoverable, delete the project (Settings → General → Delete) and re-provision from §3.1. We haven't pointed any customer traffic at it yet — the cost is just time.

---

## §5. Phase 3 — Seed production with real practice + staff

**Goal:** Bootstrap prod with the real dental practice and real staff accounts. No test personas, no plus-addressed emails.

**Time estimate:** 30 minutes (depends on §1.2 answer).

### Sub-phases (depending on §1.2 answer)

#### §5.A The practice already exists in dev with all reference data — just clone the schema-shape

If the answer to §1.2 is "the dev project's practice and reference tables ARE the source of truth, just without test users":

- [ ] **§5.A.1** Adapt `scripts/seed-test-users.ts` into a new `scripts/seed-prod-practice.ts` that:
  - Reads a minimal config (practice name, office address, primary admin email + name).
  - Creates the practice + office rows.
  - Calls `seed_practice_defaults(practice_id, office_id)` to populate reference tables.
  - Creates the primary admin user via Supabase Admin API (sends a Supabase magic link / invite).
  - Does **not** create any other staff yet — they get invited via the in-app invite flow.
- [ ] **§5.A.2** Build the script in a small PR against `staging`, merge, then run against prod:
  ```bash
  SUPABASE_URL=$(op item get "Renew PMS — Production DB" --vault Development --fields url --reveal) \
  SUPABASE_SERVICE_ROLE_KEY=$(op item get "Renew PMS — Production DB" --vault Development --fields service-role-key --reveal) \
  npx tsx scripts/seed-prod-practice.ts
  ```

#### §5.B Manual seed via SQL (if the script approach is overkill for one practice)

- [ ] **§5.B.1** Open Supabase dashboard for prod → SQL Editor.
- [ ] **§5.B.2** Paste a minimal seed: practice insert, office insert, then call `select seed_practice_defaults('<practice_id>', '<office_id>');`. Run.
- [ ] **§5.B.3** Use the dashboard's Auth → Users → "Invite user" to send an email invite to the primary admin. Supabase sends the magic link.
- [ ] **§5.B.4** Once the admin signs up, manually upsert their `profiles` row to set `system_role = 'admin'` and `practice_members` to link them to the practice. (This step exists in the script approach above; manual is fine for one user.)

### ✅ Verify

- [ ] Prod **Authentication → Users** shows 1 user (the primary admin).
- [ ] Prod `practices` table: 1 row.
- [ ] Prod `practice_members` table: 1 row, linked to the admin user.
- [ ] Prod reference tables (`departments`, `practice_role_types`, etc.) populated by `seed_practice_defaults` — non-empty.
- [ ] Admin can log in via the magic link.

### ↩️ Rollback

If the seed is wrong:

1. Truncate the affected tables: `truncate practice_members, practices, profiles cascade;` (in prod SQL Editor). RLS prevents this from the API; service-role from the SQL editor can do it.
2. Re-run §5.A or §5.B.

---

## §6. Phase 4 — Netlify env split + production-branch flip

**Goal:** Production deploys come from `main`, pointing at the new prod Supabase. Staging deploys come from `staging`, pointing at the existing dev Supabase. DevTools env vars only on staging context.

**Time estimate:** 30 minutes.

### Steps

- [ ] **§6.1** Open https://app.netlify.com/projects/renew-pms.
- [ ] **§6.2** **Site settings → Build & deploy → Continuous deployment → Production branch.** Currently set to `staging`. Change to `main`. Save.

  ⚠️ **Important:** This change does **not** redeploy automatically. The next push to `main` will trigger a production build. Until then, the most recent `staging` deploy continues to serve `renew-pms.netlify.app`. That gives us a safe gap to set up env vars before traffic hits the new context.
- [ ] **§6.3** **Site settings → Build & deploy → Continuous deployment → Branches and deploy contexts.**
  - Production deploys: from `main` (now the production branch).
  - Branch deploys: confirm `staging` is in the list — it should be auto-detected.
- [ ] **§6.4** **Site settings → Environment variables.** Net effect we want:

  | Var | Production context (main) | Branch:staging context | Notes |
  |---|---|---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | NEW prod project URL | dev project URL (current) | from 1P |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEW prod anon key | dev anon key (current) | from 1P |
  | `SUPABASE_SERVICE_ROLE_KEY` | NEW prod service role | dev service role (current) | from 1P, server-only |
  | `NEXT_PUBLIC_SITE_URL` | https://`<§1.1 domain>` | https://staging--renew-pms.netlify.app | already set on staging context per `netlify.toml` |
  | `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | **UNSET** | `true` | persona switcher + DevBar |
  | `NEXT_PUBLIC_TEST_PASSWORD` | **UNSET** | `TestUser123!` | shared dev password |
  | `NEXT_PUBLIC_ENABLE_FEEDBACK_FAB` | `true` | (any — slot mode wins) | beta feedback FAB on prod |
  | `RESEND_API_KEY` | (same — same Resend account) | (same) | confirm with §6.7 |
  | `CRON_SECRET` | NEW value (generate fresh) | (current) | `openssl rand -hex 32` |
  | `NOTION_TOKEN` | (same) | (same) | for `/api/feedback` |
  | `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` | (same) | (same) | unless §1.4 changes the answer |
  | `PACKAGES_READ_TOKEN` | (same) | (same) | for `npm ci` during build |

  In Netlify, each var has a "Scopes" section. Use **Specific scopes** → check Production / Branch deploys / Deploy previews per the table above.
- [ ] **§6.5** Configure the production custom domain (if §1.1 is non-default):
  - **Site settings → Domain management → Add a domain.**
  - Add the apex/sub from §1.1.
  - DNS:
    - CNAME `renew-pms.brikdesigns.com → renew-pms.netlify.app` (or the configured prod alias).
    - Or apex (`renewdental.com`) → Netlify NS records.
  - Wait for SSL provisioning (~5 minutes).
- [ ] **§6.6** Update Supabase **Authentication → URL Configuration** for the prod project to add the new prod domain as Site URL + Redirect URL. (You did this in §3.5 with a placeholder; tighten now.)
- [ ] **§6.7** Update Resend's "from" domain verification + SPF/DKIM if the prod domain is new. Resend dashboard → Domains. Skip if reusing `brikdesigns.com`.

### ✅ Verify (do not yet trigger a prod deploy)

- [ ] Netlify env var list shows `NEXT_PUBLIC_ENABLE_DEV_TOOLS` only on branch:staging — NOT on production. (Use `netlify env:get NEXT_PUBLIC_ENABLE_DEV_TOOLS --context production` — this is OK, it's `--context`-scoped to a single var by name. Output should be empty.)
- [ ] Production-branch setting reads `main`.
- [ ] DNS resolution: `dig <prod-domain>` shows the Netlify CNAME.

### ↩️ Rollback

If anything looks wrong **before** the Phase 5 cutover push:

1. Revert production branch to `staging` in Netlify settings.
2. Restore the `NEXT_PUBLIC_ENABLE_DEV_TOOLS` and `NEXT_PUBLIC_TEST_PASSWORD` to the production context.
3. The `staging` branch deploys continue to serve `renew-pms.netlify.app` as before.

---

## §7. Phase 5 — Cutover (Monday morning, T-0)

**Goal:** Promote `staging` → `main`, trigger the first production build against the new Supabase project.

**Time estimate:** 15 minutes (build) + 30 minutes (smoke testing).

### Steps

- [ ] **§7.1** Open a PR from `staging` to `main`:
  ```bash
  cd /Users/nickstanerson/Documents/GitHub/product/renew-pms
  git checkout main && git pull --ff-only
  git checkout -b promote/staging-to-main-beta-launch
  git merge --ff-only origin/staging
  git push -u origin promote/staging-to-main-beta-launch
  gh pr create --base main --title "promote: staging → main for beta launch" --body "First production deploy. Cutover per docs/process/beta-launch-runbook.md §7."
  ```

  CI runs full test suite + Lighthouse + bundle analyzer. Wait for green.
- [ ] **§7.2** Merge the promotion PR (squash). This pushes to `main` → triggers prod deploy on Netlify against the new Supabase prod project.
- [ ] **§7.3** Watch the deploy in Netlify dashboard. ~3-5 minutes for build + deploy.
- [ ] **§7.4** Once "Published," the new prod URL serves the customer-facing build with FAB-only feedback widget.

### ✅ Verify (smoke checklist — see §8)

Run §8 immediately after deploy completes. Don't tell the practice "we're live" until §8 is fully green.

### ↩️ Rollback

If the deploy succeeds but smoke tests fail:

1. Netlify dashboard → Deploys → find the previous successful prod deploy (will be from `staging` pre-flip) → **Publish deploy** to instant-rollback.
2. The previous deploy used dev Supabase + DevBar visible. That's degraded but functional — buys time to debug.
3. To full-revert: Netlify production-branch back to `staging`, restore env vars per §6.4 reverse, repeat.

If migrations were applied to prod and customer data already exists, **do not** delete the prod project — restore via §6 rollback only.

---

## §8. Phase 6 — Smoke tests (post-deploy)

Run all of these against the new production URL within 30 minutes of cutover. Each is a simple GO/NO-GO.

- [ ] **§8.1** **Homepage loads.** `curl -sI https://<prod-domain> | head -3` returns `HTTP/2 200`.
- [ ] **§8.2** **No DevBar visible.** Open prod URL in an incognito window. No `bdb-bar` element at the bottom. (DevTools → Elements → search `bdb-bar` should return nothing.)
- [ ] **§8.3** **No persona switcher.** No floating B-icon button visible.
- [ ] **§8.4** **Feedback FAB visible.** A floating action button (chat-style icon) appears in the bottom-right (or wherever BDS default `fabPosition`).
- [ ] **§8.5** **Feedback FAB submits to Notion.** Click → fill out a test bug report → submit. Check Notion Backlog database for the new row with Product=`Renew PMS` and submitter=admin email.
- [ ] **§8.6** **Login flow.** Use the primary admin's magic link from §5 → confirm dashboard loads, no errors. Confirm the user's profile row exists in prod Supabase Auth → Users.
- [ ] **§8.7** **Network tab clean.** DevTools → Network → reload. No requests to the **dev** Supabase project (`zneuygoeorhkuhktmuld`). All requests should go to the **new prod** ref. (Search the Network panel for the dev ref string — should be 0 hits.)
- [ ] **§8.8** **No persona switcher / DevBar JS in bundle.** DevTools → Network → JS. Filter for "DevPersonaSwitcher" — should be 0 hits. Filter for "BrikDevBar" — should be 0 hits. (Tree-shaken at build time per the gate split in PR #133.)
- [ ] **§8.9** **Sentry receiving prod errors.** Sentry dashboard → renew-pms project → environment filter `production` → trigger a test error if needed (e.g., navigate to a non-existent route, view 404 telemetry). Confirm at least one prod-tagged event arrives within 5 minutes.
- [ ] **§8.10** **Cron job pointed at prod.** Netlify → Functions → `cron-daily-tasks` → check next scheduled invocation. Confirm `CRON_SECRET` matches the one set on prod context. Confirm the function's HTTP target is the prod URL, not staging.
- [ ] **§8.11** **Staging still works.** Browse to `https://staging--renew-pms.netlify.app`. DevBar visible, persona switcher works, dev Supabase data intact. (Should be unaffected by all of the above — verify anyway.)

If any check fails: stop, investigate, decide on §7 rollback vs. surgical fix.

---

## §9. Post-launch follow-ups (T+1 to T+14)

Open these as GitHub issues at T+0 so they're tracked and not lost.

- [ ] **§9.1** **CLAUDE.md flip:** branch workflow section + `BASE_BRANCH` in `scripts/new-task.sh` + `target-branch` in `.github/workflows/release-please.yml` all switch from `staging` to `main`. Update Supabase project ref in CLAUDE.md to point at prod. (Does not need to happen on T-0 itself; can be a T+1 PR.)
- [ ] **§9.2** **Drop release-please prerelease config** after ~2 weeks of stable beta operation. Remove `"prerelease": true` and `"prerelease-type": "beta"` from `release-please-config.json`. Next version becomes `1.0.0` (signal: post-beta stable).
- [ ] **§9.3** **Tighten Lighthouse CI assertions** from `warn` to `error` once we have ~2 weeks of baseline data.
- [ ] **§9.4** **Audit invite flow** for the rest of the staff — does the practice admin invite via the in-app flow, or do we keep using Supabase dashboard invites? Decide based on real usage.
- [ ] **§9.5** **Backup / disaster recovery for prod.** Supabase Pro includes daily backups; confirm retention policy + test a point-in-time restore once.
- [ ] **§9.6** **Decommission the persona switcher in dev?** Or keep it for ongoing internal QA. Decide post-launch when the value is clearer.
- [ ] **§9.7** **Email migration from `test+*@brikdesigns.com`** for any staff still on plus-addresses on staging — they should have real emails by now, sync up.
- [ ] **§9.8** **Trainual + Google Drive integration keys** — set on prod context per `practices.integrations` JSONB. Currently per-practice, configured via app UI; verify this works against prod after admin logs in.

---

## §10. Reference

- **Cross-repo CLAUDE.md** (`~/Documents/GitHub/CLAUDE.md`) § Supabase safety, § Netlify deploys.
- **Renew CLAUDE.md** § Supabase, § Branch Workflow.
- **`netlify.toml`** — current build config, context-specific overrides.
- **`supabase/migrations/`** — 47 migrations, ordered.
- **`scripts/seed-test-users.ts`** — pattern for prod-seed script (§5.A.1).
- **`docs/process/session-discipline.md`** — session lifecycle rules.
- **PR #133** — feedback FAB gate split (must be merged to staging before cutover).
- **PR #134** — release-please scaffolding (preferred to be merged to staging before cutover so v0.1.1-beta.0 tags cleanly).
- **1Password Development vault** — all live credentials, fetched via `op item get ... --reveal` inside `$()` only.

---

## §11. Cost summary

Approximate monthly cost increase from this work, given current Brik plans:

| Service | Before | After | Delta |
|---|---|---|---|
| Supabase Pro | $25 (1 project) | $25 (2 projects, included) | $0 |
| Netlify Pro | (existing) | (existing) | $0 |
| DNS | (existing in `brikdesigns.com` zone) | (existing) | $0 |

Custom domain registration only adds cost if the answer to §1.1 is a brand-new domain (e.g., `renewdental.com` purchase + renewal). Brik subdomain = $0.

---

*Maintained alongside this repo. When phases 1-7 have run successfully, mark this doc as `Status: Executed` at the top, save the verification artifacts (smoke test screenshots, Sentry events) somewhere durable, and treat the doc as a historical reference for the next product launch.*
