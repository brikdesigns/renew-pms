# Renew PMS — Launch-Readiness QA Checklist

**Status:** Active — pre-launch (target: week of 2026-04-27)
**Last updated:** 2026-04-25
**Owner:** Nick Stanerson
**Source:** Synthesized from [Notion — Renew JBTD](https://www.notion.so/34d97d34ed2880d0bedccb542109dce8) (40 jobs), Renew User Stories (1 entry), Renew Product Requirements (1 entry), and renew-pms codebase memory.
**Broader catalog:** [Notion — Renew Workflows](https://www.notion.so/Workflows-34e97d34ed2880e7a0bfe6f74d41b876) — full surface-area catalog of every supported user flow, indexed by service and role. This file is the prioritized pre-launch subset; the Notion DB is the team-facing index.

---

## Coverage gap (raised at synthesis time, 2026-04-25)

The Renew POS section in [Notion — Product Content](https://www.notion.so/34d97d34ed2880c7a7e3eaa48fc5da7e) has rich JBTD content (40 jobs) but the **User Stories** and **Product Requirements** databases each contain a single entry — both about "Recurring task daily appearance logic." The fact that *recurring task generation* is the only workflow appearing in all three Notion DBs is itself a signal — it is the most-watched, most-fragile surface area. Weighted accordingly in Tier 1 below.

Two pre-launch follow-ups:

1. Backfill the **Renew Product Requirements** DB so each Tier 0/1 workflow below has a corresponding requirement entry.
2. ~~Add a **Workflows** entry under Renew POS in the Product Content database for parity with Brik Client Portal.~~ ✅ **Done 2026-04-26** — see [Notion — Renew Workflows](https://www.notion.so/Workflows-34e97d34ed2880e7a0bfe6f74d41b876). 36 workflows seeded (14 Tier 0+1 fully, 22 Tier 2-4 stubs), grouped by service. The DB is the broader catalog; this file remains the pre-launch must-verify subset.

---

## How to read this checklist

Workflows are ordered by **risk-on-launch-day**. Each row lists trigger → expected steps → pass criteria. The right-hand column flags whether **Playwright** e2e or **manual** QA is the better fit (some need seeded multi-tenant state Playwright can set up; others need visual judgment).

| Tier | Meaning |
|------|---------|
| **0** | Blocking. Cannot launch without all green. |
| **1** | Core daily loops. Highest user-visible blast radius. |
| **2** | Frequent secondary loops. |
| **3** | Reporting & settings. Lower frequency, high-stakes if wrong. |
| **4** | Nice-to-have. Defer if time-boxed. |

---

## Decisions made (durable — applies to all future spec work)

### Resend (transactional email)

**App-level emails** (`src/lib/email.ts` — request status, vendor messages) and **auth emails** (invite acceptance for 0.5, password reset for 0.2) share one Resend pipeline. The auth flow uses `auth.admin.generateLink({ type: 'invite' | 'recovery' })` to produce links, then sends them via the same `sendEmail` path as app email — Supabase's built-in mailer stays off so users never get duplicates. Path chosen 2026-04-27 over routing Supabase SMTP through Resend, to keep a single branded email surface and one place to update templates.

**Sender:** `Renew PMS <support@brikdesigns.com>` — piggybacks on the already-verified `brikdesigns.com` domain in the shared Brik Portal Resend account. The `support@` mailbox is intentional: if a recipient hits Reply (e.g. "the link doesn't work"), the message lands in a real human inbox alongside other Brik product support, not a renew-only address that nobody monitors. Display name says "Renew PMS" so brand identity isn't lost. Splits to a dedicated subdomain (`renew.brikdesigns.com`) and/or a `noreply` + `Reply-To: support@` pattern when one of: deliverability reputation needs isolation, account count justifies a paid Resend tier, or Renew gets its own product domain post-signoff.

**Domain:** `brikdesigns.com` (already verified in the shared Brik Portal Resend account — confirmed 2026-04-27). No new DNS work for the piggyback path. Override in `.env.local`:

```
RESEND_FROM_ADDRESS=Renew PMS <support@brikdesigns.com>
```

**Token lifetime:** invite + recovery links both 7 days (Supabase OTP expiry — single project-level setting, applies uniformly). Matches Slack/Notion/GitHub norms; long enough for "invited Friday, opened Monday" and to absorb staff PTO without forcing re-invites.

**Re-invite affordance:** "Resend invite" action on Settings → Users for accounts with `last_sign_in_at` null — ships in the same PR as the initial invite flow per 0.5 ("no other workflow works without this") so a single expired invite doesn't lock anyone out.

**Practice-aware copy:** invite emails name the practice ("You've been invited to **Renew Dental**") for orientation. Practice name is non-PHI metadata, safe to include in email payload.

**Status (2026-04-27):** `RESEND_FROM_ADDRESS=Renew PMS <support@brikdesigns.com>` is set on `.env.local` + Netlify (production/deploy-preview/branch-deploy contexts). Supabase Auth → email OTP expiry: 604800s (7d); `uri_allow_list` includes both prod Netlify URL and localhost:3000/3200/127.0.0.1:3000 for local dev. Bottom-of-stack Resend API send to `nick@brikdesigns.com` accepted (msg id `4587f28f-6685-43e9-a956-3a09ad8687dc`). 0.2 + 0.5 flipped to ✅ pending recipient inbox confirmation.

### Tier 1.1 (recurring task generation) — split test strategy

The generator (`generate_daily_pool_tasks`, migration 00031) reads Postgres `current_date` directly. The frontend task-list endpoint (`/api/tasks/route.ts`) uses `new Date()` independently. JS-side time travel doesn't reach the DB; DB-side time travel doesn't reach the JS query.

- **Recurrence rule correctness** → Vitest DB-level integration test that overrides `current_date` via a test-schema function + `search_path`, calls the RPC, and asserts which tasks were created.
- **UI surface** ("right user's board, today") → manual smoke for V1.
- **Future option** (not blocking launch): add an optional `?as_of=YYYY-MM-DD` parameter to both `/api/tasks/generate-pool` and `/api/tasks`, gated by `NODE_ENV !== 'production'`, and a corresponding `p_as_of date default current_date` to the RPC. Then 1.1 can be fully Playwright.

### Test data assumptions (seeded by `scripts/seed-test-users.ts`)

- **Practice 1** — *Renew Dental* (slug `renew-dental`) — full 7-persona role matrix per tester
- **Practice 2** — *Bayside Family Dental (Test)* (slug `bayside-test`) — 2 personas (admin + staff) per tester, distinct emails (`*+p2admin@`, `*+p2staff@`). Existence proves Tier 0.6.

---

## Tier 0 — Blocking (cannot launch without all green)

| # | Workflow | Steps to verify | Auto/Manual |
|---|---|---|---|
| 0.1 | **Login** | Visit `/login` → enter valid creds → land on dashboard. Invalid creds → error inline, no redirect loop. | Playwright — [`tests/e2e/auth/login.spec.ts`](../../tests/e2e/auth/login.spec.ts) |
| 0.2 | **Password reset** | Request reset → email arrives (Resend) → token link → set new pw → login with new pw. ✅ **Pipeline verified 2026-04-27** — `RESEND_FROM_ADDRESS=Renew PMS <support@brikdesigns.com>` set on `.env.local` + Netlify (production/deploy-preview/branch-deploy contexts), Supabase OTP expiry → 7d, Resend API smoke send returned msg id `4587f28f-6685-43e9-a956-3a09ad8687dc`. Recipient inbox confirmation pending. | Playwright + manual inbox check |
| 0.3 | **Logout** | From any page → logout → session cleared, protected routes redirect. | Playwright — [`tests/e2e/auth/logout.spec.ts`](../../tests/e2e/auth/logout.spec.ts) |
| 0.4 | **Edit account info** | Profile → change name/email → save → reflected in header + DB. | Playwright |
| 0.5 | **Admin invites team member** | Settings → Add team member → email arrives → invitee accepts → lands in correct practice with correct role. **No other workflow works without this.** ✅ **Pipeline verified 2026-04-27** — same env + Supabase config as 0.2; Resend smoke send to `nick@brikdesigns.com` accepted (msg id `4587f28f-6685-43e9-a956-3a09ad8687dc`). Recipient inbox confirmation + invite-acceptance round-trip pending. | Playwright + manual inbox |
| 0.6 | **Multi-tenancy isolation (RLS)** | Seed two practices, log in as User A from Practice 1 → confirm zero rows from Practice 2 visible in tasks/requests/training/staff/settings. **HIPAA-critical.** | Playwright — [`tests/e2e/rls/isolation.spec.ts`](../../tests/e2e/rls/isolation.spec.ts) |
| 0.7 | **Role-gated permissions** | Staff cannot access Settings, cannot reassign others' tasks, cannot approve own requests. Manager scoped to department. Admin full access within practice. | ✅ All sub-cases covered. Playwright — settings access [`tests/e2e/permissions/settings-access.spec.ts`](../../tests/e2e/permissions/settings-access.spec.ts); task visibility scope [`tests/e2e/permissions/task-scope.spec.ts`](../../tests/e2e/permissions/task-scope.spec.ts); task reassignment guard [`tests/e2e/permissions/task-reassign.spec.ts`](../../tests/e2e/permissions/task-reassign.spec.ts); request triage guard [`tests/e2e/requests/admin-only-fields.spec.ts`](../../tests/e2e/requests/admin-only-fields.spec.ts) (staff cannot move status, reassign, set vendor, or write resolution_notes — admin-only). Note: requests have no literal "approve" status; the closest mapping is the status pipeline (submitted → in_review → in_progress → waiting_on_vendor → resolved → closed), which is now admin/manager-gated end-to-end. |

## Tier 1 — Core daily loops

| # | Workflow | Steps to verify | Auto/Manual |
|---|---|---|---|
| 1.1 | **Recurring task template → daily appearance** ⭐ flagged in all 3 Notion DBs | Admin creates recurring template (daily/weekly/monthly + frequency) → wait for/trigger generator → task appears on the right day on the right user's board → does NOT appear on wrong days. ⚠ **Partial coverage**: the generator (`generate_daily_pool_tasks`, migrations 00031/00032) only handles `daily` and `per_shift`. Templates with weekly/bi-weekly/monthly/quarterly/semi-annual/annual/custom frequency can be saved but never spawn tasks — generator extension required before this row is fully green. | Vitest DB-level (daily, idempotency, stale-skip) — [`tests/integration/recurring-tasks.test.ts`](../../tests/integration/recurring-tasks.test.ts); manual UI smoke for "appears on user's board"; weekly/monthly **deferred** until generator supports them |
| 1.2 | **Staff: my tasks today → complete & sign off** | Login as staff → see today's tasks → open one → follow steps → mark complete with sign-off → status flips to `completed`, audit trail recorded. ⚠ **Status auto-flip gap**: marking every checklist item complete does NOT update the parent `tasks.status` column. The UI derives "Completed" visually from `allDone`, but the underlying status stays put — only an explicit PATCH /api/tasks/[id] (or kanban drag) flips it. Either auto-flip on last-item-completed or reword this row to match the "checklist done ≠ task done" model. | Playwright — [`tests/e2e/tasks/staff-completion.spec.ts`](../../tests/e2e/tasks/staff-completion.spec.ts) (checklist fetch + PATCH + completed_at). Auto-flip test is `test.skip`-marked. |
| 1.3 | **Admin assigns task → notification → staff sees it** | Admin assigns task to user → notification fires → staff in-app + (if enabled) email → click notification → lands on task. **Note:** notification system is mid-migration (snapshot → reference-based) per memory; verify both write path and rendered display. | Playwright + manual notification UI check |
| 1.4 | **Assign to role (not just person)** | Admin assigns task to a `practice_role` → all members of that role see it OR triage view shows unassigned-by-role correctly. ⚠ **V1 pool scope is universal** — every authenticated practice member sees every pool task regardless of role. The assignment is currently a label, not a visibility filter. Tightening pool scope to honor `assigned_role_id` is a logged follow-up in [`src/lib/task-scope.ts`](../../src/lib/task-scope.ts). | Playwright — [`tests/e2e/tasks/assign-to-role.spec.ts`](../../tests/e2e/tasks/assign-to-role.spec.ts) (data integrity, role-staff visibility, admin read-by-id). The "non-role staff don't see it" test is `test.skip`-marked. |
| 1.5 | **Recurring shift tasks (opening/closing)** | Staff sees their shift's recurring tasks at start of shift, ordered correctly. ⚠ **Shift filtering not implemented**: tasks API and `/tasks` UI have no filter on `practice_members.shift`. The generator (PR #42) creates Opening Office and Closing Office pool tasks daily, and pool scope is universal in V1, so every staff member sees both regardless of their assigned shift. Either add a shift filter to the tasks query (e.g. `?shift=opening`) and/or tag pool tasks with shift metadata, or reword this row to "staff sees the day's recurring tasks (shift-agnostic in V1)". Generator-side coverage exists at [`tests/integration/recurring-tasks.test.ts`](../../tests/integration/recurring-tasks.test.ts). | Spec deferred until shift filter ships |
| 1.6 | **Add notes to a task** | Staff adds note → persists → admin sees it on review. ⚠ **Feature not implemented**: tasks have only a `description` field set at creation; there is no `task_notes` / `task_comments` table or add-note API. Either repurpose `description` (one-shot) or add a notes table with timestamped entries before launch can claim this row. | Spec deferred until feature lands |
| 1.7 | **Status transitions** | `not_started → in_progress → awaiting_approval → completed`; `blocked` and `skipped` reachable; `overdue` triggers when past `due_at`. ⚠ **Auto-overdue gap**: no app or DB trigger flips a task's status TO `overdue`; the UI derives "overdue" at query time for past-due daily/per_shift tasks but the column itself stays at its prior value. | Playwright — [`tests/e2e/tasks/status-transitions.spec.ts`](../../tests/e2e/tasks/status-transitions.spec.ts) (forward path, completed_at side-effects, blocked/skipped branches, every enum value accepted). Auto-overdue test is `test.skip`-marked until the trigger is implemented. |

## Tier 2 — Frequent secondary loops

| # | Workflow | Steps to verify | Auto/Manual |
|---|---|---|---|
| 2.1 | **Calendar — day/week view** | Switch views, navigate prev/next, tasks appear on correct dates, time zone correct. | Playwright |
| 2.2 | **Supply request: submit → approve/reject** | Staff submits → admin sees in queue → approves → status updates → staff notified. Reject path same. | Playwright |
| 2.3 | **Training module: assign with deadline → staff completes** | Admin assigns training module to role with deadline → staff sees in their queue → marks complete → admin sees completion + Trainual sync (if enabled). | Playwright + Trainual API mock |
| 2.4 | **Escalate blocked task** | Staff marks task `blocked` with reason → manager/admin notified → can unblock or reassign. | Playwright |
| 2.5 | **View SOP from a task** | Open task with linked SOP → SOP renders → return to task. | Playwright |
| 2.6 | **Edit forms prepopulate correctly** ⚠ known issue (memory: edit sheet Selects show placeholders, not current values) | For every edit sheet (Task, Request, Training, Event, Staff, Settings entries) → open existing record → all fields show current values, not blank placeholders. | **Manual sweep first** (visual judgment), then add Playwright assertions per sheet |
| 2.7 | **Production hours logging** | Staff logs hours on a procedure → reflected in daily production total. | Playwright |
| 2.8 | **Schedule an event on calendar** | Admin creates event → appears for invited staff → time picker accepts valid times. | Playwright |

## Tier 3 — Reporting & settings

| # | Workflow | Steps to verify | Auto/Manual |
|---|---|---|---|
| 3.1 | **Daily production report** | Numbers match underlying production-hours rows; goal vs. actual computed correctly. | Manual against SQL spot check |
| 3.2 | **All overdue tasks (admin)** | Filter shows every task past `due_at` not in a terminal status. No false positives, no missing rows. | Playwright + SQL parity check |
| 3.3 | **Task completion rates by role** | Calculation matches a hand-summed sample. | Manual |
| 3.4 | **Compliance deadlines + alerts** | Set deadline → before due: no alert; at/past due: alert fires. | Playwright with seeded time |
| 3.5 | **Compliance report export** | Export → file downloads → contains expected columns + rows. | Manual (file inspection) |
| 3.6 | **Settings: configure task/supply categories** | Add, rename, delete → no orphan FK breakage; existing tasks keep their category. | Playwright |
| 3.7 | **Settings: manage roles + assign team members** | Create role with `default_system_role` → invite resolves to correct `system_role` tier. | Playwright |
| 3.8 | **Settings: manage rooms/areas** | CRUD; tasks referencing a deleted room handle gracefully (don't 500). | Playwright |
| 3.9 | **Settings: SOP knowledge base** | CRUD on SOPs; linkage from tasks holds. | Manual |

## Tier 4 — Nice-to-have for launch (defer if time-boxed)

| # | Workflow | Notes |
|---|---|---|
| 4.1 | Patient procedure checklist (create + review/approve) | Clinical-adjacent — confirm with stakeholder whether V1 or V2. |
| 4.2 | Bulk assign tasks to multiple members | Test for the partial-failure case (3 of 5 succeed). |
| 4.3 | Holidays display on calendar | Cosmetic in V1 unless it drives task suppression. |
| 4.4 | Anniversaries / birthdays display | Cosmetic. |
| 4.5 | Sterilization sign-off | Confirm whether this is distinct from generic "sign off task as complete." |

---

## Cross-cutting checks (run at the end of every test pass)

- **Email delivery** (Resend) — staff invites + notifications + password reset. Memory note: dev uses `test+` plus-addressing; **swap to real emails before beta launch**.
- **Sentry** receives client + server errors with practice context.
- **Accessibility** — WCAG 2.1 AA on every Tier 0 and Tier 1 workflow (keyboard navigation, focus order, label association). Required by ACA §1557 + ADA Title III per [renew-pms CLAUDE.md](../../CLAUDE.md).
- **No PHI in URLs or query strings** (HIPAA).
- `./scripts/token-audit.sh` clean, `npm run typecheck` clean, `npm run build` succeeds.

---

## Recommended execution order (Mac mini handoff)

When picking this up on the dedicated machine:

1. **Tier 0.1 – 0.7 first.** Everything else assumes auth, invites, and RLS work. If 0.6 (RLS isolation) regresses, all later tests are theoretical.
2. **Then 1.1 (recurring task generation).** It is the only workflow that appears in all three Notion DBs and the highest-novelty surface area.
3. **Tier 1 remainder** in the order listed.
4. **Tier 2** is where 2.6 (edit-form prepopulation) needs human eyes first — Playwright assertions can come after we know what the correct prepopulated state looks like.
5. **Tier 3** runs against a seeded multi-week dataset; a freshly-seeded DB will produce empty reports.

---

## Test infrastructure assumptions

The Mac mini agent should set these up before driving workflows. Calling them out now so they don't surprise mid-run:

- **Two seeded practices** with at least one admin, one manager, and two staff each, for RLS isolation testing.
- **Seeded `practice_role_types`** matching `seed_practice_defaults()` output.
- **A test inbox** the agent can poll for invite/reset emails (or Resend test mode + sandbox API).
- **Time-travel hook** for recurring task generation — either DB-level `now()` override or a generator endpoint the test can trigger directly.
- **A Trainual mock** (or skip 2.3's API-roundtrip portion against the real Trainual key).

---

## Update protocol

- This file is the canonical pre-launch QA checklist. Edit here, not in conversation.
- When a Tier 0 or 1 workflow lands its first passing Playwright spec, link the spec file from the row.
- When a workflow is verified manually, add a date + initials column note (no separate file).
- Promote checklist findings into Notion (User Stories / Requirements DBs) as the coverage gap is closed.
