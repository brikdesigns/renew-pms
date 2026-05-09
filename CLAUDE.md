# Renew PMS — Claude Code Instructions

Dental practice management and training platform (vertical SaaS). Multi-tenant, practice-scoped data isolation.

**Full Documentation:** [Notion — Database Need to Knows](https://www.notion.so/Database-Need-to-Knows-32e97d34ed2880738291dc49554f0f97)

---

## Worktree (renew-pms specifics)

Base branch `staging` (pre-launch — flips to `main` post-launch). Worktree path `../renew-pms-worktrees/{slug}`. Spawn via `./scripts/new-task.sh {slug}` from the primary. Cross-repo § Agent scope discipline carries the rule shape; `.claude/hooks/worktree-check.sh` enforces.

---

@../../brik/brik-bds/CLAUDE.md

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript) |
| React | React 19 |
| Auth | Supabase Auth (`@supabase/ssr`) — session refresh via `src/proxy.ts` |
| Database | Supabase PostgreSQL (RLS) |
| UI | BDS npm package (`@brikdesigns/bds`) + Tailwind CSS 4 + Radix UI |
| Styling | Tailwind CSS 4 (CSS-first config — no `tailwind.config.ts`; uses `@theme {}` in `globals.css`) |
| Email | Resend |
| Icons | FontAwesome 7 |
| Error tracking | Sentry |
| Testing | Vitest |
| Validation | Zod v4 |
| Docs | Fumadocs (fumadocs-ui, fumadocs-mdx, fumadocs-core) — `/docs` and `/guide` routes |
| Hosting | Netlify |

## LLM stack (renew-pms specifics)

No Claude calls today; routing + `workflow_type` + `@brikdesigns/claude-client` live in cross-repo § "How to add Claude to any Brik app." NEVER ship PHI-in-prompt flows before the PHI/PII redaction preprocessor lands ([ADR-003](../../brik/brik-llm/software/docs/adr/ADR-003-mini-llm-infrastructure-scope.md), currently deferred).

## Security — renew-pms specifics

Canonical security doc set + rotation doctrine live in cross-repo CLAUDE.md § Secrets. Renew-specific credential inventory (Supabase prod + staging, Resend, Sentry, two `CRON_SECRET` values, `PACKAGES_READ_TOKEN`, `RELEASE_PLEASE_TOKEN`) under `## renew-pms` in [`repo-token-map.md`](https://github.com/brikdesigns/brik-llm/blob/main/operations/security/repo-token-map.md#renew-pms). → rag:secrets

## Business Context

- Single dental practice client initially; validated before going to market
- Client pays via brik-client-portal — no in-app billing (Stripe deferred)
- Staff-only back office tool — no patient-facing features in V1
- Brik provisions practices; practice admins invite staff (no self-serve signup)

## Compliance Profile

Renew PMS is a dental PMS + staff training platform. Healthcare-regulated by default; **fully in-scope for all four regimes at all times** — PHI handling, WCAG 2.1 AA accessibility, and language access are default-on for every feature.

| Regime | Reason |
| --- | --- |
| **HIPAA** | Dental PMS handles PHI — patient records, treatment plans, scheduling, clinical notes |
| **ACA §1557** | Dental practices that accept Medicare/Medicaid are covered entities under the ACA |
| **Rehab Act §504** | Covered when the practice or platform receives federal funding |
| **ADA Title III** | Public-facing web app used by patients (appointment booking, patient portal surfaces) |

WCAG targets + impl details: [BDS healthcare-ada.md](https://design.brikdesigns.com/docs/content-system/compliance/Healthcare-ADA) (single source). Vestibular sensitivity matters in clinical workflows — guard motion choices. axe-core/Playwright CI gate pending — adopt the portal pattern when wiring ([brik-llm#130](https://github.com/brikdesigns/brik-llm/issues/130) phase 4.4).

---

## Architecture

### Role model (two layers — keep distinct)

**System role** (`profiles.system_role`, permission tier): `brik_admin` (Brik staff, cross-practice) > `admin` (practice owner; settings + all work) > `manager` (dept lead; triage, approve, team metrics; no settings) > `staff` (own work + dept).

**Practice role** (`practice_members.practice_role_id`): user-renameable job function with a `default_system_role` that suggests the permission tier at invite time.

USE `isAdmin()` from `@/lib/auth` — never inline `system_role === 'admin'` checks. `profiles.system_role` is the only runtime-consulted source; NEVER write `system_role` into `user_metadata` (seeds, scripts, `admin.createUser()`) — `tests/auth/no-system-role-metadata.test.ts` enforces. New profiles default to `'staff'` (migration 00049 / [#203](https://github.com/brikdesigns/renew-pms/issues/203)); upsert `public.profiles` for any other role.

### Reference tables (user-renameable — never hardcode values in app logic)

`departments`, `practice_role_types`, `task_types`, `task_categories`, `compliance_types`, `equipment_categories`, `supply_categories`

### Enum fields (app logic depends on these)

- `profiles.system_role` — `brik_admin | admin | manager | staff`
- `practice_members.employee_type` — `new | maturing | proficient`
- `tasks.status` — `not_started | in_progress | awaiting_approval | completed | blocked | skipped | overdue`
- `tasks.priority` — `low | medium | high | critical`

### Multi-tenancy

Practices isolated via `practice_members` join table + RLS on every table. `practices.integrations` jsonb — per-practice API config (server-side only).

### Provisioning

`seed_practice_defaults(practice_id, office_id)` — seeds all reference tables with dental defaults on new practice creation.

## Supabase

| Environment | Project Ref | Purpose |
| --- | --- | --- |
| Staging / Dev | `zneuygoeorhkuhktmuld` (`renew-pms-staging`) | Local dev + staging branch deploys (`.env.local`) — has test personas + plus-addressed emails |
| Production | `bbuimkdpmuggrszwenmg` (`renew-pms-production`) | Real customer data — provisioned 2026-05-02, clean schema, no users |

- CLI default-linked to staging via `scripts/project.env`. To run commands against prod: `supabase link --project-ref bbuimkdpmuggrszwenmg`, then **always re-link to staging** (`supabase link --project-ref zneuygoeorhkuhktmuld`) before continuing day-to-day work.
- Credentials: 1Password — `Renew PMS — Supabase Dev` (staging) / `Renew PMS — Production DB` (prod, contains `db-password`, `project-ref`, `url`, `anon-key`, `service-role-key`).
- RLS: 17/17 tables enabled, 38 policies — applied to both projects. See `~/.claude/skills/supabase-workflow.md` for patterns.

### Migration history — prod seed skips

Seven historical migrations (`00012`, `00013`, `00016`, `00020`, `00021`, `00024`, `00028`) contain Renew Dental practice-specific seed data; marked applied on prod via `supabase migration repair --status applied` to skip execution. Long-term fix: refactor practice-specific content out of `supabase/migrations/` into `supabase/seed.sql`. → rag:supabase-safety

## Integrations

- **Sentry** — error tracking (client + server + edge), error boundaries (`global-error.tsx`, `error.tsx`), and in-app User Feedback via `FeedbackButton` in the utility bar. Init in `instrumentation-client.ts` (client) and `instrumentation.ts` (server). Free tier.
- **Trainual** — staff training source of truth; API supports people management + assignment status only (cannot read/edit content). Key in `practices.integrations.trainual.api_key`.
- **Google Drive** — practice files, SOPs. Folder ID in `practices.integrations.gdrive.folder_id`.

## Error Handling

PREFER a visible failure over a silent fallback. READ [`docs/process/error-handling.md`](docs/process/error-handling.md) for banned patterns, required patterns, and type safety rules.

## General Principles

- **Match what exists first.** Before writing new patterns, read two or three nearby files. Copy their structure.
- **BDS first, always.** Before writing a custom UI element, check whether a BDS component covers the need. Build on the system — never build on an island.
- **No speculative abstractions.** Three similar lines of code is better than a premature helper. Only abstract when the pattern is stable and used in three or more places.
- **Design drives code.** Never build UI from assumptions when a Figma spec or Paper prototype exists. Read the spec first.

## Token & Style Rules

```ts
import { font, color, space, gap, border, shadow } from '@/lib/tokens';
import { text, heading, detail } from '@/lib/styles';
```

Path alias: `@/*` → `./src/*`. BDS components: `import { ... } from '@brikdesigns/bds'`

**Never use raw `var(--...)` strings in CSSProperties.** Always import from `@/lib/tokens` — this is enforced by the pre-commit hook and `./scripts/token-audit.sh`. If a token is missing from the typed exports, add it to `src/lib/tokens.ts` first.

**Department colors:** Read `department.color` from the DB row and call `departmentColor(colorKey)` from `@/lib/tokens`.

### Font family rules

Font family token **must match the element's semantic role**. BDS defaults all three families to Poppins — misuse is invisible until a client theme assigns distinct typefaces.

- `font.family.heading` — `h1`–`h5`, card names, section titles. Min size: `font.size.heading.tiny` (18px)
- `font.family.label` — Labels, badges, tags, buttons, captions
- `font.family.subtitle` — Subtitle-sized text alongside headings, secondary metadata. Pair with `font.size.subtitle.*`
- `font.family.body` — Body copy, descriptions, paragraphs

### Tailwind vs tokens

- **Tailwind** — layout and structural utilities: `flex`, `grid`, `gap`, `overflow`, `position`, `display`, `z-index`
- **BDS tokens** — all visual language: color, typography, spacing scale, border radius, shadow. These must be themed. Tailwind defaults are not themeable.
- Config is CSS-first — no `tailwind.config.ts`. Extend the theme in `src/app/globals.css` via `@theme {}`. PostCSS uses `@tailwindcss/postcss`.

### Client theming

`src/styles/theme-renew.css` overrides BDS semantic tokens with Renew Dental's palette. Values come from Figma file `kwNyWG6H3ifjZmytZnNJXd`. **Never edit this file without pulling the latest Figma export.** Never guess token values.

### Storybook MCP — renew surface filter

QUERY Storybook MCP for BDS component props before writing JSX (endpoint + fallback in `@brik-bds/CLAUDE.md`). FILTER to `surface-product` + `surface-shared` — NEVER use `surface-web` components (`Footer`, `NavBar`, `PricingCard`, `CardTestimonial`, `ServiceBadge`); they're marketing surfaces and misfit a clinical PMS UI.

### Canon retrieval — `brik-rag` for design reasoning

The Storybook MCP above answers *"what props does `PageHeader` take?"* The `brik-rag` MCP answers *"which token / component / pattern fits this clinical UI decision?"* — semantic retrieval over the canon corpus per [ADR-006](../../brik/brik-llm/software/docs/adr/ADR-006-design-vocabulary-corpus.md). Use both: `bds-find` to confirm a component exists, `brik-rag.query` to reason about which one fits.

**Pass `workflow_type: "renew-pms-build"`** on every `mcp__brik-rag__query` call. Tags Helicone traces and the retrieval log so the app's canon usage feeds [brik-llm#374](https://github.com/brikdesigns/brik-llm/issues/374) baseline measurement.

**Query before writing — filter to `surface-product` + `surface-shared` decisions only:**

| About to write… | `source_type` filter |
| --- | --- |
| CSS referencing tokens or theming patterns | `['canon-tokens', 'canon-theming']` |
| Product UI composed from BDS components | `['canon-components']` |
| Interactive clinical surface (form, modal, keyboard nav, focus) | `['canon-a11y', 'canon-components']` |
| Cross-cutting decision spanning multiple layers | `['canon']` (family-level) |

**Healthcare a11y.** renew-pms is HIPAA-adjacent and fully in-scope for WCAG 2.1 AA. The `canon-a11y` corpus includes the BDS healthcare-ada compliance doc. Query it before any interactive surface decision — not only when accessibility "feels relevant."

**Reasoning model.** renew-pms is customer-facing and pre-launch. The distinction between models is not complexity — it is reversibility and blast radius.

- **Default: Sonnet 4.6** (`claude-sonnet-4-6`) for BDS component composition, token-referencing CSS, feature implementation following established service patterns, migration execution once the schema is settled, bug fixes with a clear root cause, test authoring, copy within the product UI. BDS-grounded Sonnet handles all of this reliably *when canon is in context.* Without retrieval grounding, Sonnet quality drops — the discipline is **ground first, then reason**.

- **Use Opus** when the decision is hard to reverse or carries data-exposure risk:
  - Supabase schema design and new/modified RLS policies — a wrong policy silently breaks tenant isolation
  - Module boundary decisions ([ADR-002](../../brik/brik-llm/software/docs/adr/ADR-002-module-boundaries.md)) — 13 entitlement-gated modules; adding or splitting has long tails
  - First-time wiring of any new Claude feature in this app — `workflow_type` naming, narrow-call pattern, `max_tokens` sizing per [`docs/service-synthesis-pattern.md`](docs/service-synthesis-pattern.md)
  - Auth / session / permission surfaces — `isAdmin()`, Supabase Auth, practice isolation invariants
  - PHI flows — any feature that might touch patient data requires the PHI redaction preprocessor decision first (see LLM stack section above)

**The rule of thumb:** Opus to *design* anything schema-, security-, or module-shaped; Sonnet to *implement* it.

**Capture lessons via `mcp__brik-rag__remember_lesson`** when the build surfaces non-obvious patterns ("this RLS policy shape breaks when X," "we scoped this module boundary here because Y"). Product-app lessons are higher-signal than marketing-site lessons — capture them.

Opt-in per call. The auto-injection hook from [ADR-005](../../brik/brik-llm/software/docs/adr/ADR-005-three-tier-memory-model.md) Decision 4 is not deployed yet — you have to ask.

## Naming conventions

### "Sidebar" / "header" (renew language) ≠ `<PageHeader>` (BDS component)

Global app shell chrome and per-route content header are **two different concepts** — don't conflate.

| Concept | Renew code | BDS component | What it carries |
| --- | --- | --- | --- |
| **Global app shell chrome** | [`AppSidebar.tsx`](src/components/AppSidebar.tsx) | none — `<NavBar>` is `surface-web`, banned for product apps | Logomark + nav (top); help / theme toggle / notifications / avatar menu (bottom). Avatar carries practice + profile + sign-out. |
| **Per-route content header** | — (was renew-local, deleted in [#127](https://github.com/brikdesigns/renew-pms/pull/127)) | `<PageHeader>` from `@brikdesigns/bds` | Page title + subtitle + breadcrumbs + actions + tabs |

When the user says "header" / "page header" in renew, default-assume `<PageHeader>` (the per-route content header). Avatars / notifications / theme toggle / global nav = **sidebar** (`AppSidebar.tsx`). Don't propose a new BDS top-bar variant — Path B decision ([#101](https://github.com/brikdesigns/renew-pms/issues/101)) rules that out. → rag:bds-content

## Component Rules

CHECK BDS first via Storybook MCP — read props and examples before writing JSX. NEVER build raw `<button>` / `<a>` for interactive UI (bypasses BDS interaction states); use `Button` / `IconButton` from `@brikdesigns/bds`. NEVER export `CSSProperties` for interactive elements — `_shared.ts` is fine for layout/spacing only. NEVER convert `Button` → `IconButton` and silently drop the variant (`ghost` ≠ `primary`).

DEFAULT to Server Components — `'use client'` only when interactivity / `useState` / `useEffect` is needed. Data fetching on server; pass props down.

## File & Folder Conventions

- Components used by a single route live inside that route folder. Components used by two or more routes go in `src/components/`.
- Shared style definitions for a route group go in `_shared.ts` in the route folder. Do not duplicate style objects across sibling files. **Never put interactive element styles in `_shared.ts`** — use BDS components at call sites.
- React components: PascalCase file and function names. Utilities and hooks: camelCase, hooks prefixed with `use`.
- No version suffixes (`v2`, `_new`, `_final`). Name by purpose, not iteration.

## Branch Workflow

USE `./scripts/new-task.sh {scope}-{name}` — enforces `task/{scope}-{name}` from `staging`. Valid scopes: `renew`, `auth`, `tasks`, `training`, `vendor`, `bds`, `docs`, `infra`. Override base via `BASE_BRANCH=main` for rare infra PRs.

Pre-launch flow: `task/` → PR to `staging` → squash → periodic `staging → main` promotion. Post-launch (future): flip default in `scripts/new-task.sh` + `.github/workflows/release-please.yml`. Cross-repo § Agent scope discipline carries the broader rules.

## Session Discipline

READ [`docs/process/session-discipline.md`](docs/process/session-discipline.md) for lifecycle rules + guardrails. Mandatory.

## Commands

```bash
npm run dev | build | lint | typecheck | test       # standard Next.js
npm run db:push | db:diff | db:status | db:gen-types  # Supabase migrations
npm run db:seed-test-users                            # seed test accounts
npm run test:hooks                                    # smoke-test .claude/hooks/*

./scripts/health-check.sh       # env health (Supabase, env vars, Netlify)
./scripts/agent-preflight.sh    # pre-task environment validation
./scripts/token-audit.sh        # full token + component compliance scan
./scripts/db-health.sh          # DB hygiene: orphans, constraints, RLS (--prod, --fix)
./scripts/dev-restart.sh        # kill + restart dev server (--no-cache clears .next)
```

After BDS/token changes: `rm -rf .next && npm run dev`.

## Enforcement

### PreToolUse hooks ([`.claude/settings.json`](.claude/settings.json))

| Hook | Matcher | Blocks |
| --- | --- | --- |
| [`worktree-check.sh`](.claude/hooks/worktree-check.sh) | `SessionStart`, `Edit\|Write\|NotebookEdit` | Cross-worktree drift; primary on a `task/*` branch |
| [`secret-scanner.sh`](.claude/hooks/secret-scanner.sh) | `Edit\|Write\|NotebookEdit` | Recognizable secret shapes (Supabase JWT, `re_`, `sk-ant-`, GitHub PAT, AWS, private keys, DB URLs with embedded passwords) |
| [`bash-leak-guard.sh`](.claude/hooks/bash-leak-guard.sh) | `Bash` | Commands that exfiltrate secrets to transcript (guards the 2026-05-02 incident class — [#168](https://github.com/brikdesigns/renew-pms/issues/168)). → rag:secrets |

Smoke-test: `npm run test:hooks` (36 cases via [`scripts/test-claude-hooks.sh`](scripts/test-claude-hooks.sh)).

### Pre-commit hooks (automatic)

Block: hardcoded hex / rgba / rgb colors, raw `var(--...)` strings in style props, hardcoded font sizes in px, direct BDS component path imports (not via barrel).

### Manual audit (run before every PR)

```bash
./scripts/token-audit.sh   # 14 violation categories — buttons, colors, var(), fontFamily, borderRadius, gap, padding, Badge, headingStyle drift
npm run lint && npm run typecheck && npm run build
```

`token-audit.sh` catches things pre-commit hooks miss — run before every PR.

## Rules

ALWAYS run `npm run build` locally before pushing.
