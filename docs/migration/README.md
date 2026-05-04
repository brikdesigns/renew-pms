# Renew Dental — staging → prod migration

One-shot migration of structural data (practice, office, reference tables, templates, equipment, one vendor) for the beta launch on **2026-05-04**. Users are NOT migrated — they're provisioned fresh tomorrow with `email_confirm: true` so no welcome emails fire.

## Files

| File | Purpose |
|---|---|
| [`inventory-staging.ts`](../../scripts/migration/inventory-staging.ts) | Read-only audit of what's in staging for Renew Dental |
| [`migrate.ts`](../../scripts/migration/migrate.ts) | Migration orchestrator (4 sub-steps + verify) |
| [`staging-inventory.md`](staging-inventory.md) | Markdown report from `inventory-staging.ts` |
| [`dry-run.log`](dry-run.log) | Captured `--step all` dry-run output |
| `prod-ids.json` | State file written at execute time (gitignored until populated) |

## What gets migrated

- 1 `practices` row (fresh `id`, all other fields copied as-is)
- 1 `offices` row (staging `id` preserved)
- 9 departments, 11 practice_role_types, 6 task_types, 8 task_categories, 6 compliance_types, 9 equipment_categories, 7 supply_categories, 19 rooms (UUIDs preserved; only `practice_id` rewritten)
- 13 task_templates + 133 checklist_items (UUIDs preserved; FKs to reference tables resolve cleanly because reference UUIDs are preserved)
- 1 vendor (Wright Technology Solutions) + 1 vendor_contact (only what equipment FK requires)
- 39 equipment rows (`team_id` forced null; `vendor_id` only kept if it points to the allowed vendor)

**Total writes: ~265 rows.**

## What does NOT get migrated

- `auth.users`, `profiles`, `practice_members` — provisioned fresh tomorrow
- `tasks`, `task_checklist_items` — runtime data, regenerated from templates
- `teams`, `schedule_events`, `requests`, `notifications`, `email_log` — out of scope
- 27 vendors + 9 vendor_contacts — client can re-add as needed

## Run order

> **Pre-flight:** worktree `../renew-pms-worktrees/migrate-renew-dental-to-prod`, env files at `.env.local` (staging) + `~/.secrets/renew-pms-prod.env` (prod). Both env files contain `SUPABASE_SERVICE_ROLE_KEY`. **CLI link state is irrelevant** — script reads URLs/keys from env files directly.

```bash
cd ../renew-pms-worktrees/migrate-renew-dental-to-prod

# 1. Always dry-run first
npx tsx scripts/migration/migrate.ts --step all

# 2. Execute step-by-step, verifying after each
npx tsx scripts/migration/migrate.ts --step a --execute   # mints prod_practice_id, inserts practice + office
npx tsx scripts/migration/migrate.ts --step verify         # confirm 1 practice + 1 office on prod

npx tsx scripts/migration/migrate.ts --step b --execute   # 75 reference rows
npx tsx scripts/migration/migrate.ts --step verify

npx tsx scripts/migration/migrate.ts --step c --execute   # 1 vendor + 1 contact + 39 equipment
npx tsx scripts/migration/migrate.ts --step verify

npx tsx scripts/migration/migrate.ts --step d --execute   # 13 templates + 133 checklist items
npx tsx scripts/migration/migrate.ts --step verify
```

## Safety properties

- **Dry-run by default.** Writes only when `--execute` is passed.
- **URL refs validated** before any operation. Script aborts if staging or prod URL doesn't match the expected project ref.
- **State persisted** to `prod-ids.json` after each successful execute step. Re-running a step is idempotent (uses `upsert(..., { ignoreDuplicates: true })` on `id`).
- **Step a is one-shot** — refuses to re-mint if `prod_practice_id` already exists in state. To restart, delete `prod-ids.json` and clean prod manually.
- **No hooks skipped.** No `--no-verify`. Script doesn't touch git.

## Tomorrow morning (post-migration)

1. Brik admin signs in via prod URL, smoke-tests every section
2. User cleanup pass on practice row (email, phone, NPI, tax_id, integrations) via admin UI
3. Provision real users via a separate small script: `auth.admin.createUser({ email_confirm: true, ... })` → `profiles` row → `practice_members` row. No emails fire.
4. When client is ready, trigger password-recovery emails so each staff member gets a one-time password set link.

## Post-launch cleanup

- Long-term: refactor practice-specific seed migrations (00012, 00013, 00016, 00020, 00021, 00024, 00028) out of `supabase/migrations/` and into `supabase/seed.sql` so prod's migration history isn't polluted with `migration repair --status applied` skips.
