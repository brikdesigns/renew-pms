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

- **System role** (`profiles.system_role`) — permission tier modifier
  - `brik_admin` → Brik staff; full cross-practice access
  - `admin` → practice owner/manager; settings, all departments, all work items
  - `manager` → department lead; triage, approve, team metrics within their department. No settings.
  - `staff` → individual contributor; scoped to own work and department
- **Practice role** (`practice_members.practice_role_id`) — job function (what you ARE); user-renameable per practice. Each role has a `default_system_role` that suggests the permission tier at invite time.
- **Permission check helper:** Use `isAdmin()` from `@/lib/auth` — never inline `system_role === 'admin'` checks

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
|-------------|-------------|---------|
| Development | `zneuygoeorhkuhktmuld` | Local dev + staging (`.env.local`) |
| Production | **NOT YET PROVISIONED** | Required before soft launch |

> **BEFORE SOFT LAUNCH:** Provision a dedicated production Supabase project (Pro plan). Dev project must NEVER serve production client data.

- CLI linked to dev project: `supabase/config.toml` → `project_id = "renew-pms"`
- Credentials: 1Password — "Renew PMS — Supabase Dev" / "Renew PMS — Production DB"
- RLS: 17/17 tables enabled, 38 policies. See `~/.claude/skills/supabase-workflow.md` for patterns.

## Integrations

- **Sentry** — error tracking (client + server + edge), error boundaries (`global-error.tsx`, `error.tsx`), and in-app User Feedback via `FeedbackButton` in the utility bar. Init in `instrumentation-client.ts` (client) and `instrumentation.ts` (server). Free tier.
- **Trainual** — staff training source of truth; API supports people management + assignment status only (cannot read/edit content). Key in `practices.integrations.trainual.api_key`.
- **Google Drive** — practice files, SOPs. Folder ID in `practices.integrations.gdrive.folder_id`.

## Error Handling: Fail Loud, Never Fake

Prefer a visible failure over a silent fallback. Never silently swallow errors to keep things "working."

**Priority order:**

1. Works correctly with real data
2. Falls back visibly — clearly signals degraded mode (banner, toast, log)
3. Fails with a clear error message
4. ~~Silently degrades to look "fine"~~ — **never do this**

### Banned patterns (new code)

```ts
// ❌ Empty catch — errors vanish
try { ... } catch (e) {}
try { ... } catch { /* ignore */ }

// ❌ Swallowed promise — fire-and-forget failure
somePromise.catch(() => {})
somePromise.catch(() => null)

// ❌ Silent null return — caller has no idea why
if (!data) return null;

// ❌ Catch that fakes success — caller thinks it worked
try { ... } catch (e) { return defaultValue; }
```

### Required patterns (new code)

```ts
// ✅ Catch that surfaces the error
try { ... } catch (e) {
  console.error('[context] what failed:', e);
  throw e; // or return an error type the caller handles
}

// ✅ Fallback that discloses degraded state
if (!data) {
  console.warn('[ComponentName] data unavailable, showing fallback');
  return <ErrorState message="Could not load X" />;
}

// ✅ Null check that explains itself
if (!user) throw new Error('Expected authenticated user — missing session');
```

### Type safety rules (new code)

- **Minimize `as` assertions.** Use type guards, Zod parsing, or narrow with `if` checks. `as` is acceptable for Supabase query results where the type is known but the SDK types are loose.
- **No non-null assertions (`!`)** unless the value was just null-checked in the preceding line.
- **Optional chaining (`?.`)** is fine for 1–2 levels. Three or more levels signals a data shape problem — destructure and validate at the boundary instead.

> **Existing code:** These rules apply to new and modified code. Do not refactor existing files solely to fix these patterns — address them when you're already editing the file for another reason.

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

Path aliases: `@/*` → `./src/*` · `@bds/components` → `./brik-bds/components` · `@bds/tokens` → `./brik-bds/tokens`

**Never use raw `var(--...)` strings in CSSProperties.** Always import from `@/lib/tokens` — this is enforced by the pre-commit hook and `./scripts/token-audit.sh`. If a token is missing from the typed exports, add it to `src/lib/tokens.ts` first.

**Department colors:** Read `department.color` from the DB row and call `departmentColor(colorKey)` from `@/lib/tokens`. `getDepartmentColors(name)` in `@/lib/department-colors` is `@deprecated` — do not add new calls to it.

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

### Storybook MCP (use when building UI)

When Storybook is running (`npm run storybook` in `brik/brik-bds/`), Claude can query BDS components directly via MCP at `http://localhost:6006/mcp`. Start Storybook before building portal UI — do not read source files to guess props when the MCP is available.

- `list-all-documentation` — discover all components
- `get-documentation` — full props + JSX examples
- `preview-stories` — live preview URLs

Visual reference (no Storybook required): [BDS Chromatic](https://69b8918cac3056b39424d5d3-jtcwcnhshz.chromatic.com/)

## Component Rules

### BDS first

- Check BDS before building custom. Query via Storybook MCP (`http://localhost:6006/mcp`) when running, or browse [BDS Chromatic](https://69b8918cac3056b39424d5d3-jtcwcnhshz.chromatic.com/). Read component props and examples before writing JSX.
- **Never build raw `<button>` or `<a>` elements for interactive UI.** Use `Button` / `IconButton` from `@bds/components`. Raw elements bypass all BDS interaction states (hover, pressed, focus, disabled) — they will always look broken.
- **Never export `CSSProperties` objects for interactive elements** (buttons, links, clickable divs). Shared layout/spacing styles in `_shared.ts` are fine; shared button styles are not — they bypass the component system and lose all interaction states.
- Never convert `Button` → `IconButton` and silently drop the variant. `ghost` = low emphasis, `primary` = high emphasis. Converting the element does not change the action's importance.
- BDS submodule discipline: see Global CLAUDE.md > BDS Ecosystem Rules > Submodule Discipline.

### Server vs client components

- Default to Server Components. Only add `'use client'` when you need interactivity, event handlers, `useState`, or `useEffect`.
- Data fetching happens on the server. Pass data down as props — don't fetch in client components unless triggered by user interaction.

## File & Folder Conventions

- Components used by a single route live inside that route folder. Components used by two or more routes go in `src/components/`.
- Shared style definitions for a route group go in `_shared.ts` in the route folder. Do not duplicate style objects across sibling files. **Never put interactive element styles in `_shared.ts`** — use BDS components at call sites.
- React components: PascalCase file and function names. Utilities and hooks: camelCase, hooks prefixed with `use`.
- No version suffixes (`v2`, `_new`, `_final`). Name by purpose, not iteration.

## Branching Model

Pre-launch, single developer — keep it simple.

```text
main (production — protected, deploys to production)
  └── staging (daily working branch — all work happens here)
```

### Rules

1. **Work directly on `staging`.** No feature branches until there are multiple contributors or a live production environment to protect.
2. **`main` is locked.** Only receives merges from `staging` via PR when ready to ship to production.
3. **Commit often, push deliberately.** Pushes trigger builds.
4. **Never leave changes floating in the working tree across sessions.** Commit before ending a session.

### When to revisit

Add feature branches when: (a) a second developer joins, (b) production is live with real users, or (c) a feature genuinely needs isolated testing. Until then, branches add overhead and risk losing work.

## Session Discipline

Every Claude Code session follows a predictable lifecycle. These rules prevent the two most common failure modes: forgotten commits and scope drift.

### Session start (enforced by `scripts/session-guard.sh` PreToolUse hook)

1. **The hook runs automatically** on your first Edit/Write of the session. If there are uncommitted changes from a prior session, it prints a warning with `git status --short` output.
2. **Resolve before proceeding.** Commit, stash, or discard prior changes. Do not start new work on top of orphaned changes — that's how mixed commits happen.
3. **Declare scope.** State what this session will accomplish in one sentence before writing code. If the scope changes mid-session, commit current work first.

### During the session

1. **One concern at a time.** Don't mix feature work, debugging, and docs in the same uncommitted state. If you need to context-switch (e.g., fix a bug discovered while building a feature), commit the feature WIP first.
2. **Commit at each stable checkpoint.** After completing a logical unit (new component, migration, route wiring), commit immediately. Don't accumulate changes for a single big commit.
3. **No scope drift without a commit.** If the task expands (e.g., "this also needs a new API route"), commit everything completed so far before starting the expansion.

### Session end

1. **Nothing uncommitted.** Before ending a session, all changes must be committed. Zero tolerance — the working tree must be clean.
2. **Verify with `git status`.** Explicitly check. Don't assume.
3. **Don't push unless asked.** Commits are free; pushes trigger builds and cost deploy credits.

### Guardrails in place

| Guard | Type | What it does |
| ----- | ---- | ------------ |
| `scripts/session-guard.sh` | Claude Code PreToolUse hook | Warns on first edit if working tree is dirty or BDS submodule is out of sync |
| `.git/hooks/pre-push` | Git pre-push hook | Blocks push if `typecheck` or `build` fails |
| `.git/hooks/pre-commit` | Git pre-commit hook | Runs `git-secrets` to prevent credential leaks |
| `scripts/token-audit.sh` | Manual (run before PRs) | Catches 12 categories of token/component violations |

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
./scripts/token-audit.sh     # Full token + component compliance scan
./scripts/bds-sync.sh        # Safe BDS submodule pull + rebuild
./scripts/db-health.sh       # DB hygiene: orphans, constraints, RLS (--prod, --fix)
./scripts/dev-restart.sh     # Kill and restart dev server (--no-cache clears .next)
./scripts/session-guard.sh   # PreToolUse hook — dirty tree warning (runs automatically)
./scripts/install-hooks.sh   # Install git hooks after clone (pre-push, etc.)
```

**After BDS/token changes:** clear the Next.js cache before restarting — `rm -rf .next && npm run dev`.

## Enforcement

### Pre-commit hooks (automatic)

- Hardcoded hex colors — blocked
- Raw `var(--...)` strings in style props — blocked
- Hardcoded font sizes in px — blocked
- Direct BDS component path imports (not via barrel) — blocked
- Hardcoded rgba/rgb values — blocked

### Manual audit (run before every PR)

```bash
./scripts/token-audit.sh   # Covers: buttons, colors, var(), fontFamily, borderRadius, gap, padding, Badge
npm run lint               # ESLint
npm run typecheck          # TypeScript
npm run build              # Full build — catches what lint misses
```

The audit catches 12 violation categories including native `<button>` elements, raw `<a>` tags, hardcoded borderRadius, and hardcoded gap/padding values. It will report things the pre-commit hook does not — run it explicitly before raising a PR.

## Rules

- Follow global CLAUDE.md (parent directory)
- Always build locally before pushing
- Stage specific files, never `git add -A`
- Never push without user confirmation
- BDS submodule discipline: see Global CLAUDE.md > BDS Ecosystem Rules
