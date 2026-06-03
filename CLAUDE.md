# renew-pms

Renew PMS — dental practice management + staff training (vertical SaaS). Multi-tenant, practice-scoped, healthcare-regulated. Post-launch — beta live since 2026-05-04.

@../../brik/brik-bds/CLAUDE.md

## Branch model — post-launch (two environments)

- **`main` = production.** Deploys to `renew.brikdesigns.com` via the Netlify `main` hook. `staging` = integration / dress-rehearsal.
- **`task/*` branches + PRs target `staging`.** You develop on `staging`, then promote `staging → main` per [`docs/process/release-runbook.md`](docs/process/release-runbook.md). As of the 2026-06-02 catch-up cutover ([#367](https://github.com/brikdesigns/renew-pms/issues/367)), `staging` is an ancestor of `main`, so promotions are clean fast-forwards.
- **release-please runs on `staging`** and cuts `vX.Y.Z` tags there; the `--no-ff` promotion makes each tag reachable from `main`. (The repo is squash-only by default — the promote PR must merge as a real merge commit, or the staging/main ancestry breaks again. This was the #367 drift root cause.)
- **Never let `staging` pile up unreleased.** Promote in small batches (release-runbook cadence). The [`release-drift-guard`](.github/workflows/release-drift-guard.yml) workflow alerts when `main` falls behind `staging`.

## Stack

- Next.js 16 (App Router, TypeScript, React 19) + Tailwind 4 (CSS-first via `@theme {}` in `globals.css`) + BDS via `@brikdesigns/bds` npm + Radix
- Supabase: auth (`@supabase/ssr`, session refresh in `src/proxy.ts`) + Postgres + RLS — **staging project `zneuygoeorhkuhktmuld`**, **prod project `bbuimkdpmuggrszwenmg`**
- Email: Resend. Errors: Sentry. Docs: Fumadocs (`/docs`, `/guide`). Hosting: Netlify.
- Model: ALWAYS Opus for renew sessions (overrides global Sonnet default).

## Compliance — healthcare-regulated by default

- **All four regimes always in scope: HIPAA, ACA §1557, Rehab Act §504, ADA Title III.** WCAG 2.1 AA target. Vestibular sensitivity matters in clinical workflows — guard motion choices.
- Canon: [`@brikdesigns/bds/content-system/compliance/healthcare-ada`](https://design.brikdesigns.com/docs/content-system/compliance/Healthcare-ADA) — single source of truth, never duplicate inline.
- **No LLM calls today.** NEVER ship PHI-in-prompt flows before the PHI/PII redaction preprocessor lands ([ADR-003](https://github.com/brikdesigns/brik-llm/blob/main/software/docs/adr/ADR-003-mini-llm-infrastructure-scope.md), currently deferred).

## renew-pms specifics

- **Canon for CSS** — INVOKE `canon-css` / `validate-token-names` skill before writing any token declaration. Pre-commit `scripts/token-audit.sh` hard-fails on hex / rgba / raw `var()` / hardcoded font sizes / direct BDS path imports — no exemption path.
- **Tokens in TS/TSX** — IMPORT from `@/lib/tokens` (`font`, `color`, `space`, `gap`, `border`, `shadow`) and `@/lib/styles` (`text`, `heading`, `detail`). NEVER write raw `var()` strings. Department colors: `departmentColor(department.color)`.
- **Surface filter** — product app: USE `surface-product` + `surface-shared` BDS components. NEVER use `surface-web` (`Footer`, `NavBar`, `PricingCard`, `CardTestimonial`, `ServiceBadge`).
- **BDS first** — QUERY Storybook MCP for component props before writing JSX. NEVER build raw `<button>` / `<a>` for interactive UI; use `Button` / `IconButton` from `@brikdesigns/bds`.
- **Role model** — USE `isAdmin()` from `@/lib/auth`; never inline `system_role === 'admin'`; NEVER write `system_role` into `user_metadata` (`tests/auth/no-system-role-metadata.test.ts` enforces).
- **Supabase CLI** — default-linked to staging via `scripts/project.env`. To run against prod: `supabase link --project-ref bbuimkdpmuggrszwenmg`, then **always re-link to staging** before continuing day-to-day work.
- **Migrations** — `npm run db:push` applies immediately. Seven historical migrations (`00012/13/16/20/21/24/28`) marked `applied` on prod via `supabase migration repair --status applied` to skip practice-specific seed data. Long-term fix: move practice-specific seeds into `supabase/seed.sql`.
- **Dev server** — ALWAYS use `./scripts/dev-restart.sh`; restart after every code change. After BDS / token changes: `--no-cache`.
- **Claude calls** — when added, USE `@brikdesigns/claude-client` with `CallMetadata({ workflowType })` (ADR-001). NEVER raw `@anthropic-ai/sdk`.
- **PreToolUse hooks** — `worktree-check.sh`, `secret-scanner.sh`, `bash-leak-guard.sh` (guards the 2026-05-02 secret-exfiltration class — [#168](https://github.com/brikdesigns/renew-pms/issues/168)). Smoke-test: `npm run test:hooks`.
- **Branch workflow** — USE `./scripts/new-task.sh {scope}-{name}` (valid scopes: `renew`, `auth`, `tasks`, `training`, `vendor`, `bds`, `docs`, `infra`).
- **Pre-PR** — ALWAYS `./scripts/token-audit.sh && npm run lint && npm run typecheck && npm run build` before pushing.

## Where deeper context lives

- **Schema, RLS, role model (system vs practice), enums, reference tables, multi-tenancy, provisioning** → `brik-rag query "renew schema ..." --slug renew-pms`
- **Integrations** (Sentry init, Trainual API scope, Google Drive folder config) → `brik-rag query "renew integrations ..." --slug renew-pms`
- **Tailwind vs tokens, font family rules, AppSidebar vs `<PageHeader>`, naming, file/folder conventions, component rules** → `brik-rag query "renew ..." --slug renew-pms`
- **brik-rag MCP calls** — pass `workflow_type: "renew-pms-build"` on every `mcp__brik-rag__query` call (tags Helicone traces + canon usage log)
- **Error handling** → [`docs/process/error-handling.md`](docs/process/error-handling.md)
- **Session discipline** → [`docs/process/session-discipline.md`](docs/process/session-discipline.md)
- **Release / launch runbooks** → [`docs/process/release-runbook.md`](docs/process/release-runbook.md), [`docs/process/beta-launch-runbook.md`](docs/process/beta-launch-runbook.md)
- **Client theming source** — Figma file `kwNyWG6H3ifjZmytZnNJXd` → `src/styles/theme-renew.css` (never edit without pulling latest Figma export)
- **Security credential surface** → `## renew-pms` section of [`brik-llm/operations/security/repo-token-map.md`](https://github.com/brikdesigns/brik-llm/blob/main/operations/security/repo-token-map.md#renew-pms)
- **ADRs** → [`brik-llm/software/docs/adr/`](https://github.com/brikdesigns/brik-llm/tree/main/software/docs/adr) (esp. ADR-001 Claude calls, ADR-003 mini-LLM scope incl. PHI redaction)
