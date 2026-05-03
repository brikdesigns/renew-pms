# Renew PMS — Beta Launch Runbook

**Target launch:** Monday 2026-05-04 (T-0)
**Audience:** Nick + assisting agent. Read top-to-bottom once before starting; execute phase-by-phase on the day.
**Status:** **In progress** — Phase 1-3 done as of 2026-05-02 evening. Phase 4 onward pending.

## Progress as of 2026-05-02 evening

| Phase | Status | Notes |
|---|---|---|
| §3 Phase 1 — Provision prod Supabase | ✅ Done | `bbuimkdpmuggrszwenmg` (`renew-pms-production`), us-east-1, Pro plan |
| §4 Phase 2 — Migrate prod schema | ✅ Done | 47/47 applied (40 ran, 7 practice-specific seeds skipped via `migration repair`) |
| §5.A Phase 3a — Resend domain verification | ⏳ Pending | Tracked as GitHub issue (see linked) |
| §5.B Phase 3b — Provision practice + reference data | ⏳ Pending | Cutover-day work |
| §5.C Phase 3c — Invite primary admin | ⏳ Pending | Monday morning launch signal |
| §6 Phase 4 — Netlify env split + custom domain | ⏳ Pending | **Next session — needs Nick on Netlify dashboard** |
| §7 Phase 5 — Cutover (staging → main promo) | ⏳ Pending | Monday morning |
| §8 Phase 6 — Smoke tests | ⏳ Pending | Post-cutover |

**Tracking issues** (the source of truth for what's next — runbook is the how, issues are the what/when):

| # | Title | Phase | Priority |
|---|---|---|---|
| [#150](https://github.com/brikdesigns/renew-pms/issues/150) | Phase 4: Netlify env split + production-branch flip + add renew.brikdesigns.com | §6 | p0-now |
| [#151](https://github.com/brikdesigns/renew-pms/issues/151) | Phase 5.A: Resend sending domain verification | §5.A | p0-now |
| [#152](https://github.com/brikdesigns/renew-pms/issues/152) | Phase 5.B: Provision real practice + reference data on prod | §5.B | p0-now |
| [#153](https://github.com/brikdesigns/renew-pms/issues/153) | Phase 5.C: Invite primary admin (the launch signal) | §5.C | p0-now |
| [#154](https://github.com/brikdesigns/renew-pms/issues/154) | Phase 7: Cutover — promote staging → main, first prod deploy | §7 | p0-now |
| [#155](https://github.com/brikdesigns/renew-pms/issues/155) | Phase 6: Smoke test prod after cutover (11-point checklist) | §8 | p0-now |
| [#140](https://github.com/brikdesigns/renew-pms/issues/140) | Refactor practice-specific seeds out of migrations into seed.sql | post-launch | p2-month |
| [#156](https://github.com/brikdesigns/renew-pms/issues/156) | Grant 1P service account write on Development vault | post-launch | p1-week |
| [#157](https://github.com/brikdesigns/renew-pms/issues/157) | Drop release-please prerelease config after stable beta soak | post-launch | p2-month |
| [#158](https://github.com/brikdesigns/renew-pms/issues/158) | Tighten Lighthouse CI assertions warn → error | post-launch | p2-month |
| [#159](https://github.com/brikdesigns/renew-pms/issues/159) | Flip CLAUDE.md / new-task.sh / release-please.yml branch refs staging → main | post-launch | p1-week |

To get the live list at any time: `gh issue list --state open --label "priority:p0-now"`.

## Resuming on a fresh machine (e.g., switching from MacBook to Mac mini)

The repo + this runbook sync via git, so most state travels with you. What doesn't:

1. **Local credentials in `~/.secrets/renew-pms-prod.env`** — recreate by running this on the fresh machine:

   ```bash
   eval $(op signin)  # auth 1Password CLI
   PROD_REF=$(op item get "Renew PMS — Production DB" --vault Development --fields project-ref --reveal)
   PROD_URL=$(op item get "Renew PMS — Production DB" --vault Development --fields url --reveal)
   ANON=$(op item get "Renew PMS — Production DB" --vault Development --fields anon-key --reveal)
   SVC=$(op item get "Renew PMS — Production DB" --vault Development --fields service-role-key --reveal)

   umask 077
   {
     echo "RENEW_PROD_PROJECT_REF=$PROD_REF"
     echo "RENEW_PROD_SUPABASE_URL=$PROD_URL"
     echo "RENEW_PROD_SUPABASE_ANON_KEY=$ANON"
     echo "RENEW_PROD_SUPABASE_SERVICE_ROLE_KEY=$SVC"
   } > ~/.secrets/renew-pms-prod.env
   chmod 600 ~/.secrets/renew-pms-prod.env

   unset PROD_REF PROD_URL ANON SVC
   ```

   Note: `--reveal` outputs to terminal — only run inside `$()` capture as shown.

2. **Supabase CLI link** — defaults to staging via `scripts/project.env`. Run `supabase link --project-ref bbuimkdpmuggrszwenmg` only when you need prod, then re-link to staging (`zneuygoeorhkuhktmuld`) when done.

3. **GitHub CLI auth (`gh`)** — already per-machine. Run `gh auth login` if not signed in.

4. **NPM packages auth** — `~/.secrets/brik-packages.env` carries `PACKAGES_READ_TOKEN`. Same recreation pattern as above; the token is in 1P (search "GitHub PAT classic").

This runbook coordinates three changes that **must happen together**:

1. Provision a dedicated production Supabase project (separate from current dev/staging).
2. Move customer-facing surface from the current "all in one project" Netlify setup to a real prod ↔ staging split.
3. Cut the first real-customer beta cleanly — no test users, no persona switcher, no `TestUser123!` password baked into the prod bundle.

If any phase fails, the rollback at the end of that phase puts you back to the prior working state. Don't skip rollback verification — it's the cheapest insurance.

---

## §0. Conventions used in this doc

- **🟡 Walk through with agent** — a step where Nick + agent execute together (typically credential-bearing or wizard-driven; the agent has visibility into the surrounding state but can't autonomously click through a third-party UI).
- **✅ Verify** — a concrete check (command or dashboard observation) that the step succeeded.
- **↩️ Rollback** — what to do if this step fails or you need to back out within the next ~24 hours.
- **🔒 Secret** — a value lives in 1Password / Netlify env vars; never paste, never `cat`, never `netlify env:list`. Reference items by 1P title, fetch with `op read` piped into the consumer.

---

## §1. Decisions (locked in before T-0)

All four originally-open questions are answered. The implications are folded into the relevant phases.

### 1.1 Production custom domain — `renew.brikdesigns.com`

DNS for `brikdesigns.com` is managed at Netlify, so adding the subdomain alias is a one-click operation in the same Netlify project. SSL certificate provisions automatically via Let's Encrypt.

Reflected in: §6.5 (Netlify domain config), §6.6 (Supabase auth URL config), §8.7 (smoke-test domain checks).

### 1.2 Practice + staff data — clean prod, no users at launch

Real staff emails are not yet ready. Phase 3 is restructured so prod ships with **zero users at cutover** — only the practice row, office, and reference data. The primary admin is invited *after* smoke tests pass; the rest of the staff are invited asynchronously as real emails come in.

Net effect:

- **§5.A** (Resend domain verification) becomes a pre-flight task (§2.9) since email delivery is the prerequisite for any invite.
- **§5.B** (provision practice + reference data) runs cutover day with no user creation.
- **§5.C** (invite primary admin) runs after smoke tests as the launch signal.
- **§5.D** (invite remaining staff) is a post-launch async loop.

Test personas and `test+*@brikdesigns.com` plus-addressing stay on the dev/staging project only. Nothing migrates from dev to prod.

### 1.3 Cron secret strategy — separate per context, generated fresh at cutover

Two values, generated with `openssl rand -hex 32`:

- One on the **production** Netlify context, stored in 1P item `Renew PMS — Production Cron Secret`.
- One on the **branch:staging** Netlify context, stored in 1P item `Renew PMS — Staging Cron Secret` (rotate the existing value in §6.4).

Rationale: a leaked staging secret cannot trigger production cron jobs. Two values is a trivial management overhead — they're set once and then static.

The Netlify scheduled function `cron-daily-tasks.mts` reads `process.env.CRON_SECRET` at runtime; Netlify per-context env vars give each environment its own value automatically.

### 1.4 Sentry environment tagging — fixed in PR #136

The original SDK init tagged events with `process.env.NODE_ENV`, which returns `'production'` for both Netlify production builds AND staging branch deploys. Today every staging Sentry event is mis-tagged as production.

Fix shipped as **PR #136 (`fix(auth): tag Sentry events with deploy environment, not NODE_ENV`)** — adds `NEXT_PUBLIC_DEPLOY_ENVIRONMENT` set per Netlify context in `netlify.toml`, read by all three Sentry init paths (Node, Edge, Client).

**Hard pre-flight blocker:** PR #136 must be merged before Phase 4. Reflected in §2.9.

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
- [ ] **§2.9** **PR #136 (Sentry env tagging fix) merged to staging.** Hard blocker for Phase 4 per §1.4. `gh pr view 136 --json state -q .state` should return `MERGED`.
- [ ] **§2.10** **Resend sending domain verified for `renew.brikdesigns.com`.** This is the gate that opens §5.C (admin invite). Walk through the steps in §5.A together — agent will guide on the exact records since they vary based on Resend's current domain wizard output. Roughly: open Resend dashboard → Domains → Add `renew.brikdesigns.com` (or recommended `send.renew.brikdesigns.com` subdomain) → Resend generates 4–5 DNS records (MX + TXT for SPF + TXT for DKIM + optional DMARC) → add each at Netlify Domains DNS panel for `brikdesigns.com` → wait for Resend to mark domain "Verified" (~5–60 minutes for DNS propagation).

---

## §3. Phase 1 — Provision the production Supabase project ✅ DONE 2026-05-02

**Goal:** Empty Supabase project, on the same Brik Designs org, ready to receive migrations.

**Result:** Project `renew-pms-production` (`bbuimkdpmuggrszwenmg`) provisioned in `us-east-1`, on the Brik Designs Pro org. Existing project `renew-pms` was renamed to `renew-pms-staging` for clarity. Credentials captured to 1P item `Renew PMS — Production DB`. Local convenience copy at `~/.secrets/renew-pms-prod.env` (mode 600). PR #139 wired the new ref into `scripts/project.env` + CLAUDE.md.

The original step list is preserved below for reproducibility / disaster recovery.

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
  - **Authentication → URL Configuration → Site URL:** `https://renew.brikdesigns.com` (the locked-in domain from §1.1).
  - **Authentication → URL Configuration → Redirect URLs:** add the production URL + `https://staging--renew-pms.netlify.app` + `https://deploy-preview-*--renew-pms.netlify.app` (deploy preview wildcard).
  - **Authentication → Email Templates:** copy from dev (Settings → Auth → Email Templates on dev, paste into prod). Should match the welcome / reset / confirm flows.

### ✅ Verify

- [ ] `op item get "Renew PMS — Production DB" --vault Development --fields project-ref --reveal` returns the new ref. (Use `--reveal` only inside `$()` capture, never to terminal.)
- [ ] Dashboard shows project status "Active" with database accessible.
- [ ] **No** schema yet (Tables tab empty).

### ↩️ Rollback

Provisioning is reversible — Settings → General → Pause project, or delete entirely. No customer impact since prod URL isn't pointed here yet.

---

## §4. Phase 2 — Migrate prod schema ✅ DONE 2026-05-02

**Goal:** Run the 47 migrations from `supabase/migrations/` against prod.

**Result:** 47/47 migrations marked applied on prod. **40 actually ran**; **7 practice-specific seeds were marked applied via `supabase migration repair --status applied`** to skip running on prod (they hardcode Renew Dental's test personas + the staging practice ID): `00012`, `00013`, `00016`, `00020`, `00021`, `00024`, `00028`. Issue [#140](https://github.com/brikdesigns/renew-pms/issues/140) tracks the long-term refactor (move to `supabase/seed.sql`). `./scripts/db-health.sh --prod` returns "all checks pass."

The original step list is preserved below for reproducibility / disaster recovery.

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

## §5. Phase 3 — Seed production (split across pre-flight, cutover day, and post-launch)

**Goal:** Bootstrap prod with the real dental practice and (eventually) real staff accounts. No test personas, no plus-addressed emails. Per §1.2, **prod ships with zero users** — the primary admin is invited *after* smoke tests pass, and the rest of the staff are invited asynchronously as real emails come in.

This phase splits across three time windows:

- **§5.A** — Resend domain verification (pre-flight, T-2 or earlier).
- **§5.B** — Provision practice + reference data (cutover day, before §6).
- **§5.C** — Invite primary admin (after smoke tests pass — the launch signal).
- **§5.D** — Invite remaining staff (post-launch async loop).

### §5.A Resend sending domain verification (pre-flight, T-2 or earlier)

🟡 **Walk through with the agent** — the exact records depend on what Resend's wizard generates at execution time. The flow below is the shape; the agent will confirm each step against the live wizard output.

**Why this is the gatekeeper:** Supabase Auth uses Resend (via SMTP relay or HTTP API depending on integration) to send magic links + invite emails. Until the sending domain is verified at Resend AND the DNS records propagate, **every invite email goes to spam or bounces silently**. No verified domain → no admin invite → no launch.

> **Beta strategy (decided 2026-05-02 for Renew Dental's beta).** Renew Dental's beta launch verified the **apex `brikdesigns.com`** rather than the `send.renew.brikdesigns.com` subdomain described below. This is deliberate: the long-term plan is for each public-launch practice to send from a domain *they* own (e.g. `noreply@renewdental.com`), not from a Brik subdomain. The intermediate Brik-subdomain hop adds DNS work without serving the multi-tenant target state. Tracked on [#165](https://github.com/brikdesigns/renew-pms/issues/165) (`p2-month`, revisit during beta soak T+30).
>
> The `§5.A.x` steps below remain the canonical reference shape — apply them to whichever domain the practice owns when going public. For Brik's beta tenants sharing the apex, the records are already in place; only `RESEND_FROM_ADDRESS` needs to be set per-tenant on Netlify production env.

- [ ] **§5.A.1** Open https://resend.com/domains → **Add Domain**.
- [ ] **§5.A.2** Enter the sending domain. Recommended: `send.renew.brikdesigns.com` (subdomain isolation — Resend's recommended pattern keeps email-reputation drift away from the app domain). Alternative: `renew.brikdesigns.com` directly. Final email "From:" address can still be `noreply@renew.brikdesigns.com` regardless.
- [ ] **§5.A.3** Resend wizard generates 4–5 DNS records. Typically:
  - **MX** record on `send.renew.brikdesigns.com` → `feedback-smtp.us-east-1.amazonses.com` priority 10 (Resend uses AWS SES under the hood; region may differ — use what the wizard shows).
  - **TXT** SPF record on `send.renew.brikdesigns.com` → value starts with `v=spf1 include:amazonses.com ~all`.
  - **TXT** DKIM record at `resend._domainkey.send.renew.brikdesigns.com` → long base64 value, generated per-domain.
  - **TXT** DMARC record at `_dmarc.renew.brikdesigns.com` → start with `v=DMARC1; p=none;` (monitor mode; tighten to quarantine/reject after 30 days of clean reports).
- [ ] **§5.A.4** Add each record at Netlify Domains. Open https://app.netlify.com → Team Brik Designs → Domains → `brikdesigns.com` → DNS panel. For each Resend record, click **Add a record** with the type/name/value the wizard provided.
- [ ] **§5.A.5** Click **Verify Domain** in the Resend dashboard. Status moves through "Pending" → "Verified" as DNS propagates. Typical wait: 5–60 minutes.

#### ✅ Verify §5.A

- [ ] Resend dashboard shows the domain as **Verified** with DKIM + SPF green.
- [ ] `dig TXT send.renew.brikdesigns.com +short` returns the SPF record.
- [ ] `dig TXT resend._domainkey.send.renew.brikdesigns.com +short` returns the DKIM key.
- [ ] Send a Resend test email via dashboard "Send test" → arrives within 30 seconds, not in spam, with green DKIM/SPF in Gmail's "Show original" view.

#### ↩️ Rollback §5.A

Removing the records at Netlify DNS reverses verification. No customer impact since no users yet.

### §5.B Provision practice + reference data (cutover day)

Runs on cutover day after Phase 2 (migrations applied). Creates the practice row + office + reference tables. **No users yet.**

Two paths — pick based on practice complexity:

#### §5.B (script path) — for repeatability

- [ ] **§5.B.1** Adapt `scripts/seed-test-users.ts` into a new `scripts/seed-prod-practice.ts` that:
  - Reads a minimal config (practice name, office address — collected from the practice).
  - Creates the practice + office rows.
  - Calls `seed_practice_defaults(practice_id, office_id)` to populate reference tables (departments, role types, task categories, etc.).
  - Stops there — no user creation.
- [ ] **§5.B.2** Build the script in a small PR against `staging`, merge, then run against prod:
  ```bash
  PROD_URL=$(op item get "Renew PMS — Production DB" --vault Development --fields url --reveal)
  PROD_SVC=$(op item get "Renew PMS — Production DB" --vault Development --fields service-role-key --reveal)
  NEXT_PUBLIC_SUPABASE_URL="$PROD_URL" SUPABASE_SERVICE_ROLE_KEY="$PROD_SVC" \
    npx tsx scripts/seed-prod-practice.ts
  ```

#### §5.B (SQL path) — fastest for one-time provisioning

- [ ] **§5.B.1** Open Supabase dashboard for prod → SQL Editor.
- [ ] **§5.B.2** Run a minimal seed:
  ```sql
  -- Replace the values below with the real practice details
  with new_practice as (
    insert into public.practices (name, slug)
    values ('<Practice Name>', '<practice-slug>')
    returning id
  ),
  new_office as (
    insert into public.offices (practice_id, name, address_line1, city, state, postal_code)
    select id, 'Main Office', '<address>', '<city>', '<state>', '<zip>' from new_practice
    returning id, practice_id
  )
  select seed_practice_defaults(practice_id, id) from new_office;
  ```

#### ✅ Verify §5.B

- [ ] Prod **Authentication → Users**: still 0 users.
- [ ] Prod `practices` table: 1 row.
- [ ] Prod `offices` table: 1 row, linked to the practice.
- [ ] Prod reference tables (`departments`, `practice_role_types`, `task_types`, `task_categories`, etc.) populated by `seed_practice_defaults` — non-empty.

#### ↩️ Rollback §5.B

```sql
-- In prod SQL Editor — RLS is bypassed via service role
truncate practices, offices, departments, practice_role_types, task_types, task_categories cascade;
```
Then re-run §5.B with corrected values.

### §5.C Invite primary admin (post-smoke, the launch signal)

Runs **after** §8 smoke tests pass. This is the first real Resend email — if it lands cleanly, the email pipeline is verified end-to-end.

- [ ] **§5.C.1** Confirm Resend domain still **Verified** (§5.A.5 may have been weeks ago).
- [ ] **§5.C.2** Confirm Supabase Auth → Email Templates use the verified Resend domain in the "From:" address. Prod Supabase dashboard → Authentication → URL Configuration → SMTP / SMTP Custom (or Auth → Providers → Email if using HTTP API).
- [ ] **§5.C.3** Invite the admin via Supabase dashboard:
  - Prod project → **Authentication → Users → Invite user**.
  - Enter the admin's real email + name.
  - Supabase sends a magic link via Resend.
- [ ] **§5.C.4** Admin opens the email, clicks the magic link, lands on the prod URL, signs in.
- [ ] **§5.C.5** Once signed up (`auth.users` has 1 row), upsert their profile + practice membership:
  ```sql
  -- Run in prod SQL Editor
  -- Replace email + practice_id below
  update public.profiles
    set system_role = 'admin', first_name = '<Admin First>', last_name = '<Admin Last>'
    where email = '<admin@example.com>';

  insert into public.practice_members (user_id, practice_id, practice_role_id, employee_type)
  select p.id, '<practice_id>', (select id from public.practice_role_types where name = 'Owner' limit 1), 'proficient'
  from public.profiles p where p.email = '<admin@example.com>';
  ```
- [ ] **§5.C.6** Admin signs out + signs back in to confirm the role takes effect (RLS now treats them as admin).

#### ✅ Verify §5.C

- [ ] Admin can log into the prod URL and reach `/dashboard` without errors.
- [ ] Admin sees the practice's data (no "select a practice" prompt).
- [ ] Admin can navigate to Settings → Users (admin-only route).

#### ↩️ Rollback §5.C

If the magic link doesn't arrive, **the issue is almost always Resend domain verification** — return to §5.A.

If the admin's profile setup is wrong:
```sql
delete from public.practice_members where user_id = (select id from public.profiles where email = '<admin>');
delete from public.profiles where email = '<admin>';
delete from auth.users where email = '<admin>';  -- requires service role
```
Re-run §5.C from §5.C.3.

### §5.D Invite remaining staff (post-launch async)

Async work that happens over the days/weeks after launch as the practice provides real emails. Each staff member follows the same path as §5.C but invited from inside the app (admin → Settings → Users → Invite) rather than the Supabase dashboard.

- [ ] **§5.D.1** Practice provides a real email + role for each staff member.
- [ ] **§5.D.2** Admin invites them via the in-app invite flow.
- [ ] **§5.D.3** Staff member clicks the email, signs in, lands in the app with their assigned `practice_role`.
- [ ] **§5.D.4** Confirm: they see only what their role permits (e.g., a `staff` user can't reach Settings).

No rollback needed for §5.D — individual user issues are handled per-user, not as a phase.

---

## §6. Phase 4 — Netlify env split + production-branch flip

**Goal:** Production deploys come from `main`, pointing at the new prod Supabase. Staging deploys come from `staging`, pointing at the existing dev Supabase. DevTools env vars only on staging context.

**Time estimate:** 30 minutes.

### Steps

- [ ] **§6.1** Open https://app.netlify.com/projects/renew-pms.
- [ ] **§6.2** **Project Configuration → Build & deploy → Continuous deployment → Production branch.** Currently set to `staging`. Change to `main`. Save. *(Netlify recently renamed "Site settings" → "Project Configuration" — same screen.)*

  ⚠️ **Important:** This change does **not** redeploy automatically. The next push to `main` will trigger a production build. Until then, the most recent `staging` deploy continues to serve `renew-pms.netlify.app`. That gives us a safe gap to set up env vars before traffic hits the new context.
- [ ] **§6.3** **Project Configuration → Build & deploy → Continuous deployment → Branches and deploy contexts.**
  - Production deploys: from `main` (now the production branch).
  - Branch deploys: select **"Let me add individual branches"** and add `staging` (the default after the production-branch flip is "None — Deploy only the production branch", which would stop staging deploys entirely). Task branches don't need their own deploys; PR previews cover them via the "Any pull request" Deploy Previews setting.
- [ ] **§6.4** **Project Configuration → Environment variables.** Net effect we want:

  | Var | Production context (main) | Branch:staging context | Notes |
  |---|---|---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | NEW prod project URL | dev project URL (current) | from 1P `Renew PMS — Production DB` / `Renew PMS — Supabase Dev` |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEW prod anon key | dev anon key (current) | from same 1P items |
  | `SUPABASE_SERVICE_ROLE_KEY` | NEW prod service role | dev service role (current) | from same 1P items, server-only |
  | `NEXT_PUBLIC_SITE_URL` | `https://renew.brikdesigns.com` | `https://staging--renew-pms.netlify.app` | staging value already set in `netlify.toml`; prod set here |
  | `NEXT_PUBLIC_DEPLOY_ENVIRONMENT` | (auto from netlify.toml — `production`) | (auto from netlify.toml — `staging`) | added by PR #136 — verify after merge |
  | `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | **UNSET** | `true` | persona switcher + DevBar |
  | `NEXT_PUBLIC_TEST_PASSWORD` | **UNSET** | `TestUser123!` | shared dev password |
  | `NEXT_PUBLIC_ENABLE_FEEDBACK_FAB` | `true` | (any — slot mode wins anyway) | beta feedback FAB on prod, per PR #133 |
  | `RESEND_API_KEY` | (same — same Resend account, verified per §5.A) | (same) | one Resend account, both contexts |
  | `CRON_SECRET` | NEW value — `openssl rand -hex 32`, store in 1P `Renew PMS — Production Cron Secret` | NEW value — different from prod, store in 1P `Renew PMS — Staging Cron Secret`, replace existing | per §1.3 — separate-per-context isolation |
  | `NOTION_TOKEN` | (same) | (same) | for `/api/feedback` |
  | `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` | (same) | (same) | one Sentry project; environment tag set by `NEXT_PUBLIC_DEPLOY_ENVIRONMENT` |
  | `PACKAGES_READ_TOKEN` | (same) | (same) | for `npm ci` during build |

  In Netlify, each var has a "Scopes" section. Use **Specific scopes** → check Production / Branch deploys / Deploy previews per the table above. Use the dashboard UI; do **not** use `netlify env:list --plain` or `netlify env:list --json` to inspect (they dump values to stdout).

  When generating the new cron secrets, save them to 1P **before** pasting into Netlify so the value is recorded for cron-job sender + recipient sides.

- [ ] **§6.5** Configure the production custom domain (`renew.brikdesigns.com`). **DNS for `brikdesigns.com` is on SiteGround**, not Netlify (apex NS is `ns1.siteground.net.`/`ns2.siteground.net.`), so the CNAME has to be added manually at SiteGround:
  - **At SiteGround DNS panel:** add a CNAME record. Host: `renew`. Points to: `renew-pms.netlify.app`. TTL: default (3600). Same pattern as the existing `portal.brikdesigns.com` and `staging.portal.brikdesigns.com` entries.
  - **In Netlify:** open the renew-pms site → **Project Configuration → Domain management → Add a domain alias** (Netlify renamed "Site settings" → "Project Configuration"). Enter `renew.brikdesigns.com`. Netlify won't auto-create the CNAME (it doesn't control the zone), so it'll show a "DNS not configured" warning that clears once the SiteGround record propagates (typically <5 min).
  - Verify resolution: `dig +short renew.brikdesigns.com` returns `renew-pms.netlify.app.` plus Netlify A records.
  - SSL: Netlify auto-provisions a Let's Encrypt cert once DNS is verified. Status moves to **HTTPS enabled** within ~5 minutes. If it stalls past 10 min, click **Renew certificate** to retry.
- [ ] **§6.6** Update Supabase **Authentication → URL Configuration** for the prod project to add `https://renew.brikdesigns.com` as Site URL + as a Redirect URL (also keep the staging + deploy-preview wildcards from §3.5). Save.
- [ ] **§6.7** Confirm Resend domain status (set up in §5.A) is still **Verified** in the Resend dashboard. No new work — sanity check only.

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
- **`scripts/seed-test-users.ts`** — pattern for prod-seed script (§5.B script path).
- **`docs/process/session-discipline.md`** — session lifecycle rules.
- **PR #133** — feedback FAB gate split (merged; required for §6 customer-feedback path).
- **PR #134** — release-please scaffolding (preferred to be merged before cutover so v0.1.1-beta.0 tags cleanly).
- **PR #136** — Sentry env tagging fix (`NEXT_PUBLIC_DEPLOY_ENVIRONMENT`); **hard blocker for Phase 4** per §1.4.
- **1Password Development vault** — all live credentials, fetched via `op item get ... --reveal` inside `$()` only. Items referenced: `Renew PMS — Supabase Dev`, `Renew PMS — Production DB`, `Renew PMS — Production Cron Secret`, `Renew PMS — Staging Cron Secret`.

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
