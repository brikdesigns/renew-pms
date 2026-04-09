# QA Agent — Renew PMS

Performs a comprehensive code quality review against project standards. Run on changed files before committing or across a directory for broader audits.

## Usage

```
# Review staged changes
/qa

# Review a specific file or directory
/qa src/components/NewFeature.tsx
/qa src/app/(auth)/settings/
```

## Review Checklist

Work through each section. Report findings grouped by severity.

### 1. Token & Style Compliance

Read `CLAUDE.md` section "Token & Style Rules" first.

- ALL colors must trace to BDS tokens via `@/lib/tokens` or `@/lib/styles` — no hex values, no Tailwind default palette
- ALL font sizes, weights, families must use `font.*` from `@/lib/tokens` — never raw px or string values
- ALL spacing must use `space.*` or `gap.*` — never raw rem/px
- ALL border radii must use `border.radius.*`
- No raw `var(--...)` strings in component files — use the token import layer
- Font family token must match element's semantic role (heading for titles, label for badges/buttons, body for paragraphs)
- Heading scale starts at 18px (`font.size.heading.tiny`) — never use body/label sizes on heading elements
- Department colors: use `departmentColor(colorKey)` from `@/lib/tokens`, never `getDepartmentColors(name)` (deprecated)
- Form inputs (TextInput, Select, TextArea, Switch) must use `size="sm"` for consistent label hierarchy

### 2. Component Structure

- One component per file, max ~300 lines
- Server components by default — `'use client'` only when browser APIs, event handlers, or state needed
- No duplicated UI across routes — one shared component with props
- File naming: PascalCase for components, camelCase for utilities/hooks
- No version suffixes (`v2`, `_new`, `_final`)
- Never build raw `<button>` or `<a>` — use BDS `Button` / `IconButton`
- Never export `CSSProperties` objects for interactive elements — use BDS components at call sites
- Shared layout styles in `_shared.ts` are fine; shared button/link styles are not

### 3. Supabase & Auth

- ALL API routes call `requireAuth()` or `requirePracticeAdmin()` before data access
- RLS policies use `get_my_system_role()` — never raw role subqueries on profiles
- RLS policies must never subquery their own table (infinite recursion) — use SECURITY DEFINER functions
- No service role key in client-side code
- Input validated before DB writes
- No string concatenation in Supabase query builders
- Practice scoping via `getPracticeId()` on all multi-tenant queries

### 4. Data Integrity

- Save handlers must cover BOTH create and edit paths — no silent no-ops
- Success toasts must only fire AFTER the API call succeeds (try/catch pattern)
- Async callbacks must be awaited — never fire-and-forget with fake delays
- API routes that create records must return the full record with joins
- DELETE operations must not orphan related records (checklist items, role assignments)
- Task status transitions should be validated (not_started -> in_progress -> completed, etc.)

### 5. Error Handling

- No empty catch blocks — errors must be logged and surfaced
- No swallowed promises (`.catch(() => {})`)
- No silent null returns — explain why data is missing
- No catch blocks that fake success by returning defaults
- Fallbacks must visibly signal degraded state (banner, toast, console.warn)

### 6. Anti-Patterns

- No god-components or prop-drilling beyond 2 levels
- No nested ternaries deeper than 2 levels
- No `any` types (use `unknown` + type narrowing)
- No `// TODO` or stub implementations
- No `dangerouslySetInnerHTML` without sanitization
- No `!important` in CSS
- No inline styles that duplicate what a token or style preset provides
- No `as` type assertions except for Supabase query results where SDK types are loose
- No non-null assertions (`!`) unless value was just null-checked on preceding line

### 7. Accessibility

- Interactive elements have labels (aria-label, aria-labelledby, or visible label)
- Color is not the sole means of conveying information
- Focus management on modals/sheets and dialogs
- Form inputs have associated labels

## Output Format

Group findings by severity, then by file:

```
## Critical (blocks merge)
- [file.tsx:42](src/file.tsx#L42) — Hardcoded hex color `#E35335` in inline style. Use `color.brand.primary` from `@/lib/tokens`.

## Warning (should fix)
- [form.tsx:88](src/components/form.tsx#L88) — Form input missing `size="sm"` prop.

## Info (suggestions)
- [page.tsx:15](src/app/page.tsx#L15) — Could extract repeated card layout into shared component.

## Summary
- X critical, Y warnings, Z info
- Files reviewed: N
```

If no issues found, say so clearly — don't invent problems.
