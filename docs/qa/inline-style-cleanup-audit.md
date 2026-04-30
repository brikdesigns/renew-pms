---
status: in-progress
owner: nick
last-updated: 2026-04-29
canonical-naming-rules: https://design.brikdesigns.com/docs/primitives/naming-conventions
workflow: ./cleanup-workflow.md
related: ./component-cleanup-audit.md
tracking-issue: https://github.com/brikdesigns/renew-pms/issues/101
---

# Inline-style cleanup audit

## Status (2026-04-29)

**Pre-launch must-fix subset:**

| # | Branch / scope | State |
| --- | --- | --- |
| 1a | `task/bds-cleanup-inline-styles-sheets-1a` — ViewUserSheet, ViewTaskSheet | ✅ merged (#115) |
| 1b | `task/bds-cleanup-inline-styles-sheets-1b` — EditUserSheet, EditProfileSheet, ViewInventorySheet, ViewContactSheet | ✅ merged (#116) |
| 3 | `task/bds-cleanup-inline-styles-dashboard` — DashboardClient, ProfileCard, CardSkeleton (chrome only) | ✅ merged (#117) |
| 2 | `task/bds-cleanup-inline-styles-settings-tables` — `_shared.ts` + 7 settings tables | 🚧 **GATED** on BDS decision — see "Deferred items" below |

**Counts:** 619 (original) → **558** as of `6d9d4d3`. 61 markers resolved across 3 PRs.

**To resume:** the next session picks up at PR 2. Read the "Deferred items" section first — PR 2 cannot start without resolving the BDS-side `TableCellText` question.

## Deferred items

These were flagged out-of-scope in the merged PRs and need their own session. Listed in priority order.

### 1. PR 2 BDS gate — `TableCellText` promotion decision

**Status:** blocking PR 2.

The 7 settings tables (ContactsTable, UsersTable, TemplatesTable, TeamsTable, DepartmentsTable, RolesTable, OfficeRoomsTab) share `~50 <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: ... }}>` cell-text elements. The audit's pattern table calls this a **promotion candidate** for a BDS `TableCellText` (or per-cell `Label` variant).

Before starting PR 2, decide:

- **Option A:** open a BDS PR adding `TableCellText` (or extend `Label` with table-cell variant). Publish new BDS version. Bump in renew-pms. Then PR 2 swaps. Sequence: 3 PRs, 2-3 sessions.
- **Option B:** add slot classes via a shared `_settingsTableStyles.css` in renew-pms (precedent: schedule/calendar.css, ProfileCard.css from #117). Single-session PR. Promotes to BDS later.
- **Option C:** check current BDS Storybook MCP for existing primitives that already cover the use (see Storybook MCP section in CLAUDE.md). May be Option A with no new code.

Query Storybook MCP first to confirm coverage state before picking the path.

### 2. `_sheetStyles.ts` final-pass deletion

**Status:** waiting on more sheet conversions.

After 1a + 1b, `_sheetStyles.ts` still has ~20 consumers (TeamsTable, AddEventSheet, VendorResponseClient, EditDepartmentSheet, VendorMessagesTab, AddContactSheet, ViewVendorSheet, EditInventorySheet, SubmitRequestSheet, ViewRoleSheet, EditRoomSheet, EditRoleSheet, EditOrganizationSheet, ViewDepartmentSheet, EditTemplateSheet, EditVendorSheet, ViewRequestSheet, ViewTemplateSheet, AddTaskSheet, ViewRoomSheet). These are spread across post-launch PRs 4–6. Once all are converted, a final-pass PR deletes `_sheetStyles.ts`.

### 3. DashboardClient internal typography (Cat 2 follow-up to #117)

**Status:** flagged in #117, not started.

`#117` swapped only the dashboard card chrome. Internal text typography stayed:

- `cardTitleStyle` — h2 inside the 4 dashboard cards
- `listItemTitleStyle` / `listItemSubStyle` — list items inside Overdue Tasks + Recent Requests
- `DeptBar` — typography spans + bar visual elements
- `ProgressRing` — SVG `<text>` element styling
- Stat blocks (Today's Progress numbers + labels)

Promotion candidates: BDS chart primitives (ProgressRing, DeptBar bar chart), `Stack`/`Cluster` for layout flex wrappers, slot-class CSS for the dashboard text typography. Likely a multi-PR sequence with a BDS chart-primitive PR first.

### 4. ProfileCard interactive button (BDS promotion)

**Status:** flagged in #117, not started.

ProfileCard's outer `<button>` (in user/role/dept/team variants) bypasses BDS Button — it's a custom hover-state composition with avatar + tag + endContent. A future BDS `InteractiveProfileCard` or composable `ListItem` primitive would absorb this. Until then the inner spans use slot classes (#117) but the button itself is still a one-off.

### 5. Post-launch PRs 4–7

Per the original triage table below — vendor-public, page-chrome, small-surfaces, raw-element-lint. Not pre-launch must-fix.

---

Systematic inventory of inline-styled `<div>` / `<span>` / `<p>` elements (and embedded `fontSize:` / `var(--)` markers) in renew-pms `src/`. The previous [component cleanup audit](./component-cleanup-audit.md) closed 2026-04-28 against raw `<button>` / `<a>` and naming drift — this one is about the next layer down: **structural containers and text elements that carry no link back to BDS**. Hovering an element in DevTools today shows `<div style="…">` with no `bds-*` class, no slot name, no semantic role.

> **Methodology:** this audit follows [`cleanup-workflow.md`](./cleanup-workflow.md). Counts and call sites here feed batched cleanup PRs (one branch = one batch of fixes that share the same shape). The goal is not "delete every inline style" — it is **every interactive surface routes through a BDS component, every text role names its slot, every container picks the right family.**

## Batch progress

> **Batch 1a (`task/bds-cleanup-inline-styles-sheets-1a`, this PR):** ViewUserSheet + ViewTaskSheet. Established the sheet skeleton pattern that subsequent batches copy:
> - `<SheetSection heading="...">` replaces `<div style={sheetBodyStyle}><h3 style={sheetSectionTitle}>...` — visual change: section heading goes from heading-family h3 to BDS canonical uppercase `--label-sm` treatment. The cleanup-workflow doc explicitly calls out this kind of "BDS spec produces a different look" trade — documented, not silently changed.
> - `<EmptyState>` replaces inline `<p style={emptyState}>` for tab-level empties (Roles, Departments, Assigned Modules, Checklist Items).
> - `<ProgressBar>` + `<SheetHelperText>` replaces hand-rolled progress bars (training progress, checklist progress). **BDS `<Meter>` was the wrong primitive** — it hardcodes a ` Score` suffix (`bds-meter__value-suffix`) into the value display, fits score gauges only. ProgressBar is documented as "horizontal bar showing completion progress." Tradeoff: ProgressBar has no built-in value/max text — caption goes in adjacent `<SheetHelperText>`.
> - ViewTaskSheet two-line manual title `<div>` (title + templateName) → `<Sheet title>` + `<Sheet description>` props.
> - `<Field>` / `<FieldGrid>` were already adopted before this batch; kept.
> - Both files removed all imports from `_sheetStyles.ts`. The file is kept on disk for Batch 1b consumers (EditUserSheet, EditProfileSheet, ViewInventorySheet, ViewContactSheet) — delete in a final pass once those are migrated.
>
> **26 markers resolved this batch.** Total: 463 → 449 div, 114 → 108 span, 42 → 39 p, 92 → 90 inline fontSize.
>
> **BDS issue surfaced (not blocking):** Meter's hardcoded ` Score` suffix should be configurable (`valueSuffix?: string` or `showSuffix?: boolean`). Worth opening a brik-bds issue.

## Guiding rules (from BDS naming conventions)

Cited verbatim from the [BDS naming conventions doc](https://design.brikdesigns.com/docs/primitives/naming-conventions) so the audit remains usable when the canonical doc rotates:

- **HTML element ≠ class name.** `<h1>`–`<h3>` only for document-outline nodes. Decorative card titles use `<div>` or `<p>`. Same `__title` class, different element by outline position.
- **Title vs heading layer distinction.** `__title` is the BEM slot. `--heading-*` is the typography token. They are not substitutes.
- **`-label` family before inventing terms.** Any text naming a discrete thing → `field-label`, `chip__label`, `button-label`, `tab-label`.
- **Slot is not text.** `__actions` holds buttons; `button-label` is the text on each button. Do not conflate.
- **No unclassed wrappers.** Bare `<div>` adding flex without naming the slot is drift. Acceptable exceptions: `{children}`, fragments, throwaway Storybook helpers.
- **Axes are fixed vocabulary.** `size`, `status`, `variant` (hierarchy), `appearance` (fill: `solid` / `subtle` / `outline`). Never `dark` / `light`.
- **Container choice.** `DataSection` (region of a larger page), `SheetSection` (block in a sheet), `Card` (self-contained unit in a grid). Don't reach for Card when DataSection is right.

In renew-pms terms: when DevTools shows `<div>` with inline styles, that's an unclassed wrapper. Either it should be a BDS primitive (Card, DataSection, SheetSection, Stack, Text, Label) or its container should be — and the inner element should carry a `__slot` BEM class.

## Findings — 558 / originally 619 unclassed inline-styled elements across 4 categories

Scan run 2026-04-29 against `staging` (`ce249a5`).

> **One fix often resolves multiple categories.** Replacing `<div style={cardStyle}><span style={titleStyle}>X</span></div>` with `<Card><Card.Title>X</Card.Title></Card>` resolves both Cat 1 (the wrapping div) and Cat 2 (the inner span) in one swap. Cross-references called out where they apply.

### Category 1 — Unclassed `<div>` containers (423 / originally 463)

`<div style={…}>` with no class name. Splits into two by source-style:
- **1a. Inline literal styles** (114 / originally 119): `<div style={{ display: 'flex', gap: gap.md }}>` — entirely unnamed.
- **1b. Imported style consts** (309 / originally 344): `<div style={cardStyle}>` / `<div style={pageStyle}>` — the const has a name in source, but the rendered DOM still shows an unclassed `<div>`.

Both shapes share the same fix surface: replace the wrapping element with a BDS component (which renders with the proper `bds-*` slot class) when one applies, or attach a named slot class when no BDS primitive is right.

#### 1a — Top files (inline literal `<div style={{…}}>`)

| File | Count |
|---|---|
| `src/app/(auth)/dashboard/DashboardClient.tsx` | 39 |
| `src/components/EditTemplateSheet.tsx` | 23 |
| `src/components/AddTaskSheet.tsx` | 17 |
| `src/app/vendor/[token]/VendorResponseClient.tsx` | 15 |
| `src/app/(auth)/tasks/TasksClient.tsx` | 15 |
| `src/components/SubmitRequestSheet.tsx` | 13 |
| `src/app/(auth)/requests/RequestsClient.tsx` | 13 |
| `src/components/EditVendorSheet.tsx` | 12 |
| `src/app/(auth)/settings/contacts/ContactsTable.tsx` | 12 |
| `src/components/SheetSkeleton.tsx` | 11 |
| ~~`src/components/CardSkeleton.tsx`~~ | ~~10~~ → 8 (3) |
| ~~`src/components/EditUserSheet.tsx`~~ | ~~22~~ → 5 (1b) |
| ~~`src/components/EditProfileSheet.tsx`~~ | ~~16~~ → 4 (1b) |
| ~~`src/components/ViewUserSheet.tsx`~~ | ~~10~~ → 3 (1a) |

Sub-shapes inside these files (representative — full enumeration in the per-batch PRs):

- **Sub-shape A — Layout flex wrappers.** `<div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>` — 84 occurrences across all files.
  - [`DashboardClient.tsx:210`](../../src/app/(auth)/dashboard/DashboardClient.tsx#L210) progress-row layout
  - [`DashboardClient.tsx:330`](../../src/app/(auth)/dashboard/DashboardClient.tsx#L330) card-header row
  - [`DashboardClient.tsx:359`](../../src/app/(auth)/dashboard/DashboardClient.tsx#L359) list-item-left cluster

- **Sub-shape B — Card / panel chrome.** `<div style={{ background, border, borderRadius, padding }}>` with no class.
  - Concentrated in `DashboardClient.tsx` (cards repeat) and the skeleton components (`CardSkeleton`, `SheetSkeleton`, `PageSkeleton`).

- **Sub-shape C — Form rows / groups.** `<div style={{ formRow }}>` patterns inside Edit*Sheet — already share `_shared.ts`-style consts but no BDS form primitive.
  - [`EditTemplateSheet.tsx:402`](../../src/components/EditTemplateSheet.tsx#L402) `sheetFormGroup`
  - [`EditTemplateSheet.tsx:445`](../../src/components/EditTemplateSheet.tsx#L445) `formRowStyle` / `formRowHalf`

#### 1b — Imported style-const wrappers

`grep -rn 'style={[a-z][a-zA-Z]*Style}' src/ --include='*.tsx' | wc -l` → **434**.

These are scattered across every file in 1a plus most of the settings tables and view sheets. Examples from `DashboardClient.tsx`:
- `<div style={pageStyle}>` (L311), `<div style={gridStyle}>` (L323), `<div style={cardStyle}>` (L328), `<div style={cardHeaderStyle}>` (L329), `<div style={listItemLeftStyle}>` (L353)

The fix shape is identical: where the wrapping intent matches a BDS container (`Card`, `DataSection`, `SheetSection`, `PageHeader`), replace the element. Where it's pure layout (`Stack`, `Cluster`, `Inline`), use the BDS layout primitive if one exists, else keep the const but attach a slot class.

### Category 2 — Unclassed `<span>` text elements (100 / originally 114)

`<span style={…}>` carrying typography styles. These are labels, metadata, captions, inline values — exactly the surface the BDS naming-conventions doc calls out (`field-label`, `chip__label`, `button-label`, `tab-label`).

Top files:

| File | Count |
|---|---|
| `src/components/AddTaskSheet.tsx` | 12 |
| `src/app/(auth)/settings/contacts/ContactsTable.tsx` | 9 |
| ~~`src/components/ProfileCard.tsx`~~ | ~~6~~ → 0 (3) |
| `src/app/(auth)/settings/users/UsersTable.tsx` | 6 |
| `src/components/InventoryTable.tsx` | 5 |
| `src/app/(auth)/settings/roles/RolesTable.tsx` | 5 |
| `src/app/(auth)/settings/departments/DepartmentsTable.tsx` | 5 |
| `src/app/(auth)/dashboard/DashboardClient.tsx` | 5 |
| `src/components/EditUserSheet.tsx` | 4 |
| `src/components/ViewTaskSheet.tsx` | 4 |
| `src/components/EditDepartmentSheet.tsx` | 4 |

Representative shapes:

- **Sub-shape A — Field-label / value pairs.** `<span style={previewLabelStyle}>Type</span><span style={previewFieldStyle}>{value}</span>` — 6 pairs in [`AddTaskSheet.tsx:264-282`](../../src/components/AddTaskSheet.tsx#L264-L282). The fix is a BDS `<FieldLabel>` + `<FieldValue>` (or a single `<Field>` with `label` + `value` slots).

- **Sub-shape B — Cell text inside settings tables.** Repeating across the 7 settings tables: `<span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: ... }}>` for each cell. Example: [`ContactsTable.tsx:164-174`](../../src/app/(auth)/settings/contacts/ContactsTable.tsx#L164-L174). Pattern is consistent enough to warrant a BDS `<TableCellText>` or `<Label>` primitive.

- **Sub-shape C — Profile/avatar metadata.** [`ProfileCard.tsx:179-180`](../../src/components/ProfileCard.tsx#L179-L180) `nameStyle` + `subtitleStyle`. The component already exists as a card pattern; the inner spans need named slots (`profile-card__name`, `profile-card__subtitle`).

### Category 3 — Unclassed `<p>` text elements (36 / originally 42)

`<p style={…}>` — same problem as Cat 2 but the element is `<p>`. Most are paragraph-style descriptions or empty-state copy.

Top files:

| File | Count |
|---|---|
| `src/app/reset-password/ResetPasswordClient.tsx` | 4 |
| `src/components/ViewUserSheet.tsx` | 3 |
| `src/components/VendorMessagesTab.tsx` | 3 |
| `src/app/forgot-password/page.tsx` | 3 |
| `src/components/ViewTemplateSheet.tsx` | 2 |
| `src/components/ViewRoleSheet.tsx` | 2 |
| `src/components/ViewDepartmentSheet.tsx` | 2 |
| `src/components/EditUserSheet.tsx` | 2 |
| `src/components/EditDepartmentSheet.tsx` | 2 |
| `src/app/vendor/[token]/VendorResponseClient.tsx` | 2 |

These collapse into the same fix surface as Cat 2 — a BDS text primitive (`Body`, `Description`, etc.) once the right one is identified.

### Category 4 — Inline `fontSize:` in JSX style props (90 / originally 92)

Counts elements where `fontSize:` appears literally inside a JSX `style={{…}}` prop (vs. inside a named const in `_shared.ts`). Examples:

- [`OfficeRoomsTab.tsx:121`](../../src/app/(auth)/settings/organization/OfficeRoomsTab.tsx#L121) `<Icon icon={meta.icon} style={{ fontSize: font.size.body.xs }} />` — Icon size override, may want an `Icon size` prop instead of inline style.
- [`ContactsTable.tsx:140`](../../src/app/(auth)/settings/contacts/ContactsTable.tsx#L140) `<TableCell colSpan={7} style={{ ...bodyCellStyle, textAlign: 'center', fontFamily: font.family.label, fontSize: font.size.label.sm }}>` — empty-state cell composing a const + inline overrides.

This category overlaps significantly with Cat 2 / Cat 3 — most "inline `fontSize:`" hits are inside `<span>` / `<p>` tags already counted there. Calling it out separately because the **fix shape differs**: typography embedded in an element prop signals "this element should have been a typography primitive in the first place."

The remaining ~114 `fontSize:` hits across the codebase are inside named consts (e.g., `headingStyle = { fontFamily: font.family.heading, fontSize: font.size.heading.medium, ... }`) — those are token-correct and stay where they are unless the consuming element gets replaced with a BDS primitive (which would absorb the style).

### Category 5 — RESOLVED-AS-FALSE-POSITIVE: raw `var(--)` strings in `*.tsx`

`grep -rn 'var(--' src/ --include='*.tsx'` → 12 hits, all **inside JS code comments** documenting a future BDS migration:

```
// (.bds-table-cell { background-color: var(--background-primary) }) once the
//  bds-table component lands with cell-background hooks.
```

Found in 12 files (every settings table + 4 sheet components). **No actual style-prop violations.** Closing this category at audit-write time. The pre-commit hook already blocks new `var(--)` in style props, so this is a one-time confirmation that the codebase is clean here.

## Pattern grouping → BDS promotion candidates

Per cleanup-workflow.md decision tree (BDS-cover-it → BDS-class-only → unnamed-primitive → one-off):

| Pattern | Sites | BDS coverage status | Action |
|---|---|---|---|
| Card / panel chrome (background+border+padding wrappers) | ~50 | **Needs MCP query** — likely covered by `Card` and/or `DataSection`. | Per-batch verification; straight swap if covered. |
| Sheet sub-section blocks | ~40 | **Needs MCP query** — likely covered by `SheetSection`. | Per-batch verification. |
| Layout flex/cluster wrappers (`display: flex` + `gap`) | 84 | **Likely no direct primitive.** Would need BDS `Stack` / `Cluster` / `Inline` to land first. | **Promotion candidate** OR keep as named `_shared.ts` consts with slot classes attached. |
| Field-label / field-value text pairs | ~30 | **Needs MCP query** — `FieldLabel`/`FieldValue` may exist. | Per-batch verification. |
| Settings-table cell text spans | ~50 | **Likely no primitive.** Repeating across 7 tables. | **Promotion candidate** — a `<TableCellText>` or per-cell `<Label>` variant. |
| Profile/avatar metadata slots | 6 | `ProfileCard` exists; inner spans need slot classes only. | In-place fix (slot class), no BDS swap. |
| Form-row / form-group wrappers | ~40 | **Needs MCP query** — likely a BDS form primitive. | Per-batch verification. |

> **Per-batch obligation:** before a batch swaps any pattern to a BDS component, query Storybook MCP at `https://main--69b8918cac3056b39424d5d3.chromatic.com/mcp` (`get-documentation`) to confirm the component covers the use. Never invent BDS components from memory.

## Triage — proposed batched PRs

Aligned with [issue #101](https://github.com/brikdesigns/renew-pms/issues/101)'s plan. Ordered by leverage (sheet skeleton pattern propagates) and conflict risk (settings tables share `_shared.ts`).

| # | Branch | Scope | Resolves | Effort |
|---|---|---|---|---|
| 1 | `task/bds-cleanup-inline-styles-sheets` (split into 1a + 1b) | S-tier sheets — ✅ 1a: `ViewUserSheet`, `ViewTaskSheet` (#115). ✅ 1b: `EditUserSheet`, `EditProfileSheet`, `ViewInventorySheet`, `ViewContactSheet`. | Cat 1a/1b/2/3/4 across these 6 files. Defines the "sheet skeleton" pattern for the rest. | 12–16 hr |
| 2 | `task/bds-cleanup-inline-styles-settings-tables` | Settings tables — `_shared.ts` + `ContactsTable`, `UsersTable`, `TemplatesTable`, `TeamsTable`, `DepartmentsTable`, `RolesTable`, `OfficeRoomsTab` | Cat 1b/2/4 across 7 tables sharing `_shared.ts`. Surfaces the table-cell-text promotion candidate. | 6–8 hr |
| 3 | ✅ `task/bds-cleanup-inline-styles-dashboard` | `DashboardClient`, `ProfileCard`, `CardSkeleton` — chrome only (4 dashboard cards + CardSkeleton → BDS `Card`; ProfileCard inner spans → slot classes via new `ProfileCard.css`). DashboardClient internal text typography (cardTitleStyle, listItemTitleStyle, DeptBar spans, ProgressRing SVG text, stat blocks) deferred to a Cat 2 follow-up since no BDS coverage. | Cat 1b (8 sites), Cat 2 (6 ProfileCard spans). First-impression surface. | 6–8 hr |
| 4 | `task/bds-cleanup-inline-styles-vendor-public` | Vendor public — `VendorResponseClient`, `VendorSidebar`, `vendor/[token]/page` | Cat 1a/2/3/4. Pair with a11y review per the compliance profile. | 4–6 hr |
| 5 | `task/bds-cleanup-inline-styles-page-chrome` | `TasksClient`, `RequestsClient`, `MyRequestsList`, `InventoryTable`, `TaskFilterBar` | Cat 1a/2/4 — page header / filter bar chrome. Extracts shared header pattern. | 4–6 hr |
| 6 | `task/bds-cleanup-inline-styles-small-surfaces` | Schedule, Training trio, Organization, Account, `VendorSidebar`, `NotificationBell` | Cat 1a/2 across remaining surfaces. | 3–4 hr |
| 7 | `task/infra-raw-element-lint` | CI raw-element lint pass | Prevents regression. Adds rule to `scripts/token-audit.sh` or new ESLint rule with allowlist for `bds-sheet__nav-link` etc. | 4–8 hr |

**Pre-launch must-fix subset:** PRs 1, 2, 3 (~24–32 hr).

**Post-launch:** PRs 4, 5, 6, 7.

### Cross-repo BDS promotion candidates (handle inside batches)

If during PR 1 we determine a needed primitive is missing (most likely candidates: layout `Stack`/`Cluster`, `TableCellText`, `Field` slot pair), per the workflow:

1. **Open the BDS PR first.** Land the primitive on `brik-bds@main`, publish a new package version.
2. **Bump `@brikdesigns/bds` in renew-pms** in a separate tiny PR.
3. **Then open the renew-pms swap PR** importing the new component.

Do not author renew-pms code that imports a primitive that doesn't exist in the published package yet.

## What this audit does not cover

- **Raw `<button>` / `<a>` interactive elements.** Resolved by [component-cleanup-audit.md](./component-cleanup-audit.md) — closed 2026-04-28. Re-running its grep recipes shows 0 violations as of `ce249a5`.
- **Field-primitive adoption.** Tracked separately in [field-primitive-adoption-audit.md](./field-primitive-adoption-audit.md).
- **Token misuse** (wrong `font.family.*` paired with wrong size, hardcoded hex, raw `var(--)` in style props). The `scripts/token-audit.sh` and pre-commit hook own this surface; this audit assumes those are clean.
- **Storybook BDS source** (`brik/brik-bds/`). Out of scope — this audit is consumer code only.

## Re-running the audit

Counts go stale; the recipes below regenerate them. Run from repo root.

```bash
# Cat 1 — <div style={  (expected: 463 total = 119 inline literal + 344 const)
echo "Cat 1 total:"            && grep -rn  '<div style={'         src/ --include='*.tsx' | wc -l
echo "Cat 1a inline literal:"  && grep -rn  '<div style={{'        src/ --include='*.tsx' | wc -l
echo "Cat 1b imported const:"  && grep -rnE '<div style=\{[a-z]'   src/ --include='*.tsx' | wc -l

# Cat 2 — <span style={  (expected: 114 total = 61 inline literal + 53 const)
echo "Cat 2 total:"            && grep -rn  '<span style={'        src/ --include='*.tsx' | wc -l
echo "Cat 2a inline literal:"  && grep -rn  '<span style={{'       src/ --include='*.tsx' | wc -l
echo "Cat 2b imported const:"  && grep -rnE '<span style=\{[a-z]'  src/ --include='*.tsx' | wc -l

# Cat 3 — <p style={  (expected: 42)
echo "Cat 3 total:"            && grep -rn  '<p style={'           src/ --include='*.tsx' | wc -l

# Cat 4 — inline fontSize: in JSX style={{ (expected: 92)
echo "Cat 4 total:"            && grep -rn  'style={{[^}]*fontSize:' src/ --include='*.tsx' | wc -l

# Cat 5 confirmation — raw var(--) in *.tsx (expected: 0 violations; 12 hits all in comments)
echo "Cat 5 hits (incl. comments):" && grep -rn 'var(--' src/ --include='*.tsx' | wc -l
echo "Cat 5 violations:"            && grep -rn 'var(--' src/ --include='*.tsx' | grep -vE '^[^:]+:[0-9]+:\s*//' | wc -l

# Top 10 files for Cat 1
echo "" && echo "Top 10 — <div style={ per file"
grep -rln '<div style={' src/ --include='*.tsx' | while IFS= read -r f; do
  c=$(grep -c '<div style={' "$f")
  printf '%4d  %s\n' "$c" "$f"
done | sort -rn | head -10
```

## Audit lifecycle

```
trigger: issue #101 + naming-conventions URL the user pointed at on 2026-04-29
  ↓
audit doc authored (this file, status: in-progress)
  ↓
batch PRs land in order. Each PR includes a small audit-doc update commit:
  - Decrement the violation count for the relevant category.
  - Strikethrough resolved file:line entries (don't delete — preserves history).
  - Cross-reference any BDS promotion PRs landed in the batch.
  ↓
when all categories drop to 0 (or the residual is intentional one-offs):
  status: resolved → fold into launch-checklist.md as a closed line item
  ↓
later: status: archived once the underlying primitives have been stable for ≥1 release
```
