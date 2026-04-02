# Renew PMS — Claude Code Instructions

Dental practice management and training platform (vertical SaaS). Multi-tenant, practice-scoped data isolation.

**Full Documentation:** [Notion — Database Need to Knows](https://www.notion.so/Database-Need-to-Knows-32e97d34ed2880738291dc49554f0f97)

---

@../../brik/brik-bds/CLAUDE.md

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| React | React 19 |
| Auth | Supabase Auth (`@supabase/ssr`) — session refresh via `src/proxy.ts` |
| Database | Supabase PostgreSQL (RLS) |
| UI | BDS submodule + Tailwind CSS 4 + Radix UI |
| Styling | Tailwind CSS 4 (CSS-first config — no `tailwind.config.ts`; uses `@theme {}` in `globals.css`) |
| Email | Resend |
| Icons | FontAwesome 7 |
| Error tracking | Sentry |
| Testing | Vitest |
| Validation | Zod v4 |
| Docs | Fumadocs (fumadocs-ui, fumadocs-mdx, fumadocs-core) — `/docs` and `/guide` routes |
| Hosting | Netlify |

## Business Context

- Single dental practice client initially; validated before going to market
- Client pays via brik-client-portal — no in-app billing (Stripe deferred)
- Staff-only back office tool — no patient-facing features in V1
- Brik provisions practices; practice admins invite staff (no self-serve signup)

## Architecture

### Role model (two layers — keep distinct)

- **System role** (`profiles.system_role`) — controls permissions
  - `platform_admin` → Brik staff; full cross-practice access
  - `practice_admin` → manages their practice, invites staff
  - `staff` → scoped to their practice
- **Practice role** (`practice_members.practice_role_id`) — job function (what you ARE); user-renameable per practice

### Reference tables (user-renameable — never hardcode values in app logic)

`departments`, `practice_role_types`, `task_types`, `task_categories`, `compliance_types`, `equipment_categories`, `supply_categories`

### Enum fields (app logic depends on these)

- `profiles.system_role` — `platform_admin | practice_admin | staff`
- `practice_members.employee_type` — `new | maturing | active`
- `tasks.status` — `not_started | in_progress | awaiting_approval | completed | blocked | skipped | overdue`
- `tasks.priority` — `low | medium | high | critical`

### Multi-tenancy

Practices isolated via `practice_members` join table + RLS on every table. `practices.integrations` jsonb — per-practice API config (server-side only).

### Provisioning

`seed_practice_defaults(practice_id, office_id)` — seeds all reference tables with dental defaults on new practice creation.

## Supabase

| Environment | Project Ref | Purpose |
|-------------|-------------|---------|
| Development | `zneuygoeorhkuhktmuld` | Local dev + staging (`.env.local`) |
| Production | **NOT YET PROVISIONED** | Required before soft launch |

> **BEFORE SOFT LAUNCH:** Provision a dedicated production Supabase project (Pro plan). Dev project must NEVER serve production client data.

- CLI linked to dev project: `supabase/config.toml` → `project_id = "renew-pms"`
- Credentials: 1Password — "Renew PMS — Supabase Dev" / "Renew PMS — Production DB"
- RLS: 17/17 tables enabled, 38 policies. See `~/.claude/skills/supabase-workflow.md` for patterns.

## Integrations

- **Trainual** — staff training source of truth; API supports people management + assignment status only (cannot read/edit content). Key in `practices.integrations.trainual.api_key`.
- **Google Drive** — practice files, SOPs. Folder ID in `practices.integrations.gdrive.folder_id`.

## Token & Style Rules

```ts
import { font, color, space, gap, border, shadow } from '@/lib/tokens';
import { text, heading, detail } from '@/lib/styles';
```

Path aliases: `@/*` → `./src/*` · `@bds/components` → `./brik-bds/components` · `@bds/tokens` → `./brik-bds/tokens`

**Never use raw `var(--...)` strings in CSSProperties.** Always import from `@/lib/tokens` — this is enforced by the pre-commit hook and `./scripts/token-audit.sh`. If a token is missing from the typed exports, add it to `src/lib/tokens.ts` first.

**Department colors:** Read `department.color` from the DB row and call `departmentColor(colorKey)` from `@/lib/tokens`. `getDepartmentColors(name)` in `@/lib/department-colors` is `@deprecated` — do not add new calls to it.

### Tailwind CSS 4

Config is CSS-first — no `tailwind.config.ts`. Extend the theme in `src/app/globals.css` via `@theme {}`. PostCSS uses `@tailwindcss/postcss`.

### Client theming

`src/styles/theme-renew.css` overrides BDS semantic tokens with Renew Dental's palette. Values come from Figma file `kwNyWG6H3ifjZmytZnNJXd`. **Never edit this file without pulling the latest Figma export.** Never guess token values.

### Storybook MCP (use when building UI)

When Storybook is running (`npm run storybook` in `brik/brik-bds/`), Claude can query BDS components directly via MCP at `http://localhost:6006/mcp`. Start Storybook before building portal UI — do not read source files to guess props when the MCP is available.

- `list-all-documentation` — discover all components
- `get-documentation` — full props + JSX examples
- `preview-stories` — live preview URLs

Visual reference (no Storybook required): [BDS Chromatic](https://69b8918cac3056b39424d5d3-jtcwcnhshz.chromatic.com/)

## Commands

```bash
npm run dev              # Local dev server (localhost:3000, or next available port)
npm run build            # Production build — always run before pushing
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Vitest

npm run db:push          # Push migrations to dev Supabase
npm run db:diff          # Generate migration diff (--use-migra)
npm run db:status        # List migration status
npm run db:seed-test-users  # Seed test user accounts

./scripts/health-check.sh    # Verify env health (Supabase, env vars, Netlify)
./scripts/agent-preflight.sh # Pre-task environment validation
./scripts/token-audit.sh     # Full token compliance scan (hex, var(), font-size, rgba, Badge)
./scripts/bds-sync.sh        # Safe BDS submodule pull + rebuild
./scripts/dev-restart.sh     # Kill and restart dev server (--no-cache clears .next)
```

**After BDS/token changes:** clear the Next.js cache before restarting — `rm -rf .next && npm run dev`.

## Rules

- Follow global CLAUDE.md (parent directory)
- Always build locally before pushing
- Stage specific files, never `git add -A`
- Never push without user confirmation
- BDS development in `GitHub/brik/brik-bds/`, not in the submodule
