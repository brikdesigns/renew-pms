---
status: resolved
owner: nick
last-updated: 2026-04-29
resolved: 2026-04-29
canonical-rules: https://design.brikdesigns.com/docs/primitives/naming-conventions
workflow: ./cleanup-workflow.md
related: ./component-cleanup-audit.md, ./launch-checklist.md
---

# Field primitive adoption audit

## Resolved 2026-04-29 — closing summary

**All four categories closed in a single batch (`task/renew-sheets-cleanup`, PR pending).**

| Cat | Pattern | Before | After | Status |
|-----|---------|--------|-------|--------|
| 1 | `ReadOnlyField` callsites | 114 in 14 files | 0 | ✓ migrated to BDS `Field` |
| 2 | Ad-hoc field-label `<span>` (sheets only) | ~14 in-scope | 0 | ✓ migrated to BDS `Field` |
| 3 | `fieldRow` / `fieldHalf` flex helpers | 5 sheet files (+ `rowStyle` in `_shared.ts`) | 0 | ✓ migrated to BDS `FieldGrid` |
| 4 | Dead-code deletions | 1 file + 6 exports | 0 | ✓ deleted |

Verified: `grep -rE "<ReadOnlyField " src/ --include="*.tsx"` returns 0. Typecheck + token-audit clean.

**Empty-state convention adopted:** `empty="—"` on every Field, preserving the renew em-dash convention from the prior `ReadOnlyField` behavior.

**Out-of-scope items confirmed during the sweep:**
- `EditUserSheet.tsx:280, 283, 310` — entity-row name + subtitle text inside associated-roles / associated-departments lists. NOT field labels. Belongs to the InteractiveListItem family (already covered in `component-cleanup-audit.md`).
- `EditDepartmentSheet.tsx:175, 178, 210, 213` — same pattern (associated-roles / associated-users lists). Same disposition.
- ~30 ad-hoc field-label-shaped `<span>`s inside `bds-table` body cells across `ContactsTable`, `UsersTable`, `RolesTable`, `TemplatesTable`, `TeamsTable`, `DepartmentsTable`, `OfficeRoomsTab`, `VendorMessagesTab`, `VendorResponseClient`, `OrganizationSettingsClient`, `AccountSettingsClient`, `RequestsClient`. Different concern — table cell typography drift, not label-value pairs. Catalog separately if recurring.

Per `cleanup-workflow.md` lifecycle, status is now `resolved`. Will transition to `archived` once BDS Field / FieldGrid have been stable for ≥1 release in renew-pms.

---

# Field primitive adoption audit

Systematic inventory of label-value display patterns in renew-pms `src/` that should consume the existing BDS `<Field>` and `<FieldGrid>` primitives instead of the renew-local `ReadOnlyField`, ad-hoc `<span>` field labels, and per-sheet `fieldRow` / `fieldHalf` flex helpers.

> **Methodology:** this audit follows [`cleanup-workflow.md`](./cleanup-workflow.md). The closely-related [`component-cleanup-audit.md`](./component-cleanup-audit.md) (resolved 2026-04-28) covered raw-button / clickable-div / tab-bar / heading-naming patterns; **this audit covers field-display patterns specifically** and does not re-litigate that ground.

## Why this exists

Three independent patterns in renew-pms today display a label + value pair in read-mode sheets. They visually converge on the same shape but ship different code:

1. **`@/components/ReadOnlyField`** (renew-local, 114 callsites across 14 files) — owns its own typography via `_shared.ts` `labelStyle` / `valueStyle` exports. Empty handling: `value ?? '—'` for strings, no empty handling for ReactNode children.
2. **Ad-hoc `<span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>…</span>` blocks** — used inside sheets to label content that isn't a string (Tags, Badges, custom widgets like `DaysOfWeekPicker`). 14–20 occurrences inside sheet bodies, plus more inside *table cells* (out of scope here — different use case).
3. **Per-sheet `fieldRow` / `fieldHalf` `CSSProperties` exports** for the 2-column field-row layout. Duplicated in 5 sheet files (`ViewUserSheet`, `ViewRoleSheet`, `ViewDepartmentSheet`, `ViewContactSheet`, `ViewRoomSheet`).

BDS already ships `<Field>` (label + ReactNode value, themed typography, configurable empty state) and `<FieldGrid>` (equal-column grid for laying out Fields side by side). The Field docstring is explicit: *"The single biggest win over ad-hoc markup: one API covers text, tags, URLs, bullet lists, and empty states."* Neither primitive is currently imported anywhere in renew-pms (`grep -E "<Field |<FieldGrid" src/` returns 0).

The cost of leaving this is invisible until a client theme assigns distinct typography for `bds-field__label`: the renew-local labels won't pick it up. The renew-local empty treatment (`'—'`) and the BDS empty treatment (`'Not set'`) also drift further every time a new sheet ships.

## Guiding rules

From BDS source (`components/ui/Field/Field.tsx` + `components/ui/FieldGrid/FieldGrid.tsx`):

- **`<Field label="…">` is the canonical read-mode label-value pair inside a sheet.** Children may be a string, a Tag, a Badge, an `<a>`, a `<BulletList>`, or any ReactNode.
- **`<FieldGrid columns={2|3|4} gap="md|lg|xl">` lays Fields out side by side.** Default `columns={2}` matches the existing 2-col sheet layout.
- **Empty state is a Field prop, not consumer logic.** Pass `empty="—"` to preserve the renew em-dash convention; default is `"Not set"`. Picking either is a one-time decision applied uniformly — do not mix.
- **Layout `stacked` (default) puts label above value; `inline` puts them on one row.** Renew read-mode sheets currently render stacked exclusively.

From CLAUDE.md:

- **BDS first, always.** Query Storybook MCP for the component before writing JSX. Never hand-roll a label-value pair.
- **No speculative abstractions.** `ReadOnlyField` was a renew-local primitive that pre-dated BDS Field; once BDS shipped its equivalent, the renew-local one became redundant.

## Findings — 175 violations across 4 categories

> Counts as of 2026-04-29 against `staging` (commit `22e03fa`). Recipes for refresh below.

### Category 1 — `ReadOnlyField` callsites (114 across 14 files)

Migrate to `<Field label={…} empty="—">{value}</Field>`.

| File | Count |
|------|-------|
| `src/components/ViewTemplateSheet.tsx` | 15 |
| `src/components/ViewRequestSheet.tsx` | 13 |
| `src/app/(auth)/settings/account/AccountSettingsClient.tsx` | 13 |
| `src/app/vendor/[token]/VendorResponseClient.tsx` | 12 |
| `src/app/(auth)/settings/organization/OrganizationSettingsClient.tsx` | 11 |
| `src/components/ViewUserSheet.tsx` | 10 |
| `src/components/ViewVendorSheet.tsx` | 8 |
| `src/components/ViewTaskSheet.tsx` | 6 |
| `src/components/ViewInventorySheet.tsx` | 6 |
| `src/components/ViewContactSheet.tsx` | 6 |
| `src/components/ViewRoomSheet.tsx` | 4 |
| `src/components/ViewRoleSheet.tsx` | 4 |
| `src/app/(auth)/settings/teams/TeamsTable.tsx` | 4 |
| `src/components/ViewDepartmentSheet.tsx` | 2 |

### Category 2 — Ad-hoc `<span>` field-label patterns inside sheets (~14, capped at 30)

Migrate to `<Field label="…">{children}</Field>` where `children` is the Tag / Badge / widget that previously sat below the span.

Pattern shape (every occurrence):
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
    Label Text
  </span>
  <Tag … /> | <Badge … /> | <DaysOfWeekPicker … />
</div>
```

In-scope sheets (replace with `<Field>`):
- [`src/components/ViewUserSheet.tsx`](../../src/components/ViewUserSheet.tsx) — 4 occurrences (lines 165, 177, 189, 256)
- [`src/components/ViewTaskSheet.tsx`](../../src/components/ViewTaskSheet.tsx) — 5 occurrences
- [`src/components/EditUserSheet.tsx`](../../src/components/EditUserSheet.tsx) — 3 occurrences (associated-roles / associated-departments inline name + dept labels — confirm these aren't a different pattern before swapping)
- [`src/components/ViewInventorySheet.tsx`](../../src/components/ViewInventorySheet.tsx) — 2 occurrences
- [`src/components/ViewTemplateSheet.tsx`](../../src/components/ViewTemplateSheet.tsx) — 2 occurrences
- [`src/components/ViewDepartmentSheet.tsx`](../../src/components/ViewDepartmentSheet.tsx) — 2 occurrences
- [`src/components/EditDepartmentSheet.tsx`](../../src/components/EditDepartmentSheet.tsx) — 4 occurrences (verify — Edit* sheets may use this for write-mode field labels above inputs, which is a different concern)
- [`src/components/ViewRoomSheet.tsx`](../../src/components/ViewRoomSheet.tsx) — 1 occurrence
- [`src/components/ViewRoleSheet.tsx`](../../src/components/ViewRoleSheet.tsx) — 1 occurrence

**Out of scope for this audit** (different use case — styled text inside table cells, not a label-value pair):
- ContactsTable (8), UsersTable (5), RolesTable (4), TemplatesTable (3), TeamsTable (3), DepartmentsTable (3), OfficeRoomsTab (2), VendorMessagesTab (1), VendorResponseClient (1), OrganizationSettingsClient (1), AccountSettingsClient (1), RequestsClient (1) — these are body-cell content within `bds-table` rows. Catalog them in a follow-up audit (`tables-typography-audit`?) if recurring drift surfaces.

### Category 3 — Per-sheet `fieldRow` / `fieldHalf` exports (5 files)

Replace with `<FieldGrid columns={2}>` and delete the local `CSSProperties` exports.

| File | Lines |
|------|-------|
| [`src/components/ViewUserSheet.tsx`](../../src/components/ViewUserSheet.tsx) | 60–61 |
| [`src/components/ViewRoleSheet.tsx`](../../src/components/ViewRoleSheet.tsx) | 47–48 |
| [`src/components/ViewDepartmentSheet.tsx`](../../src/components/ViewDepartmentSheet.tsx) | 73–74 |
| [`src/components/ViewContactSheet.tsx`](../../src/components/ViewContactSheet.tsx) | 92–93 |
| [`src/components/ViewRoomSheet.tsx`](../../src/components/ViewRoomSheet.tsx) | 10–11 |

### Category 4 — Dead-code deletions after Cat 1–3 land

- [`src/components/ReadOnlyField.tsx`](../../src/components/ReadOnlyField.tsx) — `ReadOnlyField` and `EmptyField` exports become unused after Cat 1.
- [`src/app/(auth)/settings/_shared.ts`](../../src/app/(auth)/settings/_shared.ts) lines 46–80 — `fieldStyle`, `labelStyle`, `valueStyle`, `emptyFieldStyle` exports are consumed only by `ReadOnlyField`. Confirm no other importers via final grep, then delete.

## Pattern grouping → BDS coverage

All four categories collapse onto two existing BDS primitives — **straight swap, no promotion required**:

| Pattern | BDS coverage | Action |
|---------|--------------|--------|
| `ReadOnlyField` (Cat 1) | `<Field>` exists in BDS | Straight swap with `empty="—"` to preserve renew em-dash convention |
| Ad-hoc field-label span (Cat 2) | `<Field>` exists in BDS | Straight swap |
| `fieldRow` + `fieldHalf` flex (Cat 3) | `<FieldGrid>` exists in BDS | Straight swap; FieldGrid CSS docstring explicitly cites this pattern as its target |
| Dead-code deletions (Cat 4) | n/a | Delete after Cat 1–3 land |

No new BDS primitive needed. No design decision needed (empty-state convention is `"—"` per renew precedent — uniform across the migration, not per-call).

## Triage — proposed batched PRs

**One PR.** All four categories share a single fix shape (consume existing BDS primitive, delete renew-local equivalent). Per `cleanup-workflow.md` "Do bundle multiple call sites of the same fix shape — that's the whole point of batching." Splitting Cat 1 from Cat 2/3/4 would leave the codebase in a half-migrated state.

| PR | Branch | Categories | Effort | Risk |
|----|--------|------------|--------|------|
| 1 | `task/renew-sheets-cleanup` (this branch) | 1, 2, 3, 4 | 8–14 hr | Visual diff per call site (114 + 14 + 5 = 133 sites) — verify in dev server per touched surface |

### Visual verification plan

Per `cleanup-workflow.md` "Visual verification" section. Touched surfaces to walk through in browser:

- `/dashboard` (no direct touches but transitively uses `ProfileCard` which is unaffected)
- `/tasks` → ViewTaskSheet (open any task)
- `/training` → no touches
- `/schedule` → no touches
- `/requests` → ViewRequestSheet (open any request)
- `/settings/users` → UsersTable (out of scope) + ViewUserSheet + EditUserSheet (open any user)
- `/settings/templates` → ViewTemplateSheet (open any template)
- `/settings/roles` → ViewRoleSheet
- `/settings/departments` → ViewDepartmentSheet + EditDepartmentSheet
- `/settings/teams` → TeamsTable
- `/settings/contacts` → ViewContactSheet (open any contact)
- `/settings/account` → AccountSettingsClient
- `/settings/organization` → OrganizationSettingsClient + ViewRoomSheet (open any room)
- `/settings/inventory` → InventoryTable + ViewInventorySheet (open any item)
- `/vendor/[token]` → VendorResponseClient (public surface — verify in incognito)

Visual diff expectations:
- Field label typography: should be identical (both use `font.family.label` / `font.size.label.sm` / `font.weight.medium` / `color.text.primary` — BDS Field's CSS uses the same tokens).
- Field value spacing: `bds-field__value` may add a small top margin vs the renew `valueStyle`. Note any differences per surface in the PR description.
- Empty state: `"—"` everywhere (passing `empty="—"` to BDS Field). Confirm no callsite accidentally inherits `"Not set"`.
- 2-col field grid: `<FieldGrid columns={2}>` defaults to `gap="xl"`. The renew `fieldRow` used `gap.lg`. Pass `gap="lg"` in the FieldGrid swap to match the prior visual.

## What this audit does not cover

- **Table cell typography drift.** The `<span style={{ font.family.label, ... }}>` pattern inside `bds-table` body cells (~30 occurrences across ContactsTable, UsersTable, etc.). Different concern — table cells aren't field-value pairs. Catalog separately if recurring.
- **Write-mode form field components.** TextInput / Select / TextArea / Switch wrappers. BDS provides those primitives directly; renew already consumes them at most callsites.
- **`profileCardGrid` / `ProfileCard`.** ProfileCard composes its own internal label-value layout; not a Field consumer. Out of scope.
- **Sheet-level styling** (`sheetBodyStyle`, `sheetSectionTitle` from `_sheetStyles.ts`). These are sanctioned shared layout helpers; not in scope for this audit.
- **The 3 known-out-of-scope items from `component-cleanup-audit.md`** (VendorSidebar nav, EditTemplateSheet collapse, DevPersonaSwitcher tester tab). Tracked elsewhere.

## Re-running the audit

```bash
# Cat 1 — ReadOnlyField callsites
grep -rE "<ReadOnlyField " src/ --include="*.tsx" | wc -l

# Cat 1 — by file
grep -rEl "<ReadOnlyField " src/ --include="*.tsx" | while read f; do
  c=$(grep -cE "<ReadOnlyField " "$f"); printf "%4d  %s\n" "$c" "$f"
done | sort -rn

# Cat 2 — ad-hoc field-label span pattern (all callsites — separate sheet from non-sheet manually)
grep -rE "<span style=\{\{[^}]*fontFamily: font\.family\.label" src/ --include="*.tsx" | wc -l

# Cat 3 — fieldRow / fieldHalf local helpers
grep -rEn "^const (fieldRow|fieldHalf)" src/ --include="*.tsx"

# Verify no <Field /<FieldGrid yet (should drop to 0 → many after migration)
grep -rE "<Field |<FieldGrid" src/ --include="*.tsx" | wc -l
```
