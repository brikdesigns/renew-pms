---
status: in-progress
owner: nick
last-updated: 2026-04-27
canonical-naming-rules: https://design.brikdesigns.com/docs/primitives/naming-conventions
workflow: ./cleanup-workflow.md
related: ./launch-checklist.md
---

# Component cleanup audit

Systematic inventory of component-misuse and naming-drift in renew-pms `src/`. Feeds batched cleanup PRs that pre-launch debt does not leak into production. Findings are grouped so each batch lands cleanly without conflicting with feature branches and so BDS gets a clear signal on what to promote.

> **Methodology:** this audit follows [`cleanup-workflow.md`](./cleanup-workflow.md). Read that doc before opening a new audit on a different topic — it captures the audit-first → batched-PR pattern as a reusable standard.

## Why this exists

Two problems compound in pre-launch:

1. **Component misuse** — native `<button>` and `<div onClick>` shipped where BDS `Button` / `IconButton` / a yet-to-be-built `EntityRow` should be. These bypass interaction states (hover/pressed/focus/disabled) and produce inconsistent results across screens.
2. **Naming drift** — slot names (`heading` vs `title`, `headingStyle` for non-outline text) diverge from the BDS naming-conventions doc. Costs are invisible until a client theme assigns distinct typefaces or a screen reader hits an outline node that isn't one.

Both are cheap to fix in batches. Both are expensive once they multiply.

## Guiding rules (from BDS naming conventions)

- **HTML element ≠ class name.** `<h1>`–`<h3>` only for document-outline nodes. Decorative card titles use `<div>` or `<p>`. Same `__title` class, different element by outline position.
- **Title vs heading layer distinction.** `__title` is the BEM slot. `--heading-*` is the typography token. They are not substitutes.
- **`-label` family before inventing terms.** Any text naming a discrete thing → `field-label`, `chip__label`, `button-label`, `tab-label`.
- **Slot is not text.** `__actions` holds buttons; `button-label` is the text on each button. Do not conflate.
- **No unclassed wrappers.** Bare `<div>` adding flex without naming the slot is drift. Acceptable exceptions: `{children}`, fragments, throwaway Storybook helpers.
- **Axes are fixed vocabulary.** `size`, `status`, `variant` (hierarchy), `appearance` (fill: `solid` / `subtle` / `outline`). Never `dark` / `light`.
- **Container choice.** `DataSection` (region of a larger page), `SheetSection` (block in a sheet), `Card` (self-contained unit in a grid). Don't reach for Card when DataSection is right.

In renew-pms terms: every interactive surface routes through a BDS component, every text role names its slot, every container picks the right family.

## Findings — 26 open / 42 originally / 37 verified across 9 categories

> **Batch progress:**
> - Batch 1 (`task/bds-cleanup-css-properties`, `ce8179c`): Cat 8 (4) + 1 of 8 Cat 2b → resolved.
> - Batch 2 (`task/bds-cleanup-toolbar-buttons-2c`, `987adfe`): 3 of 8 Cat 2c → resolved.
> - Batch 3 (`task/bds-cleanup-title-naming`, PR #56): re-scoped Cat 6 from 5 false-positive size violations to 4 naming-drift renames — all resolved. Cat 6 net: -5 false-positives + 4 real-issues = audit total **42 → 41**, but verified-issue total stays **37** since the 5 size violations were never real. Audit-script regression rule (`token-audit.sh` check #14) added in same PR.
> - Batch 4 (`task/bds-cleanup-menu-items-2a`, PR #58): partial Cat 2a — 2 of 6 swapped to BDS `MenuItem` (TaskAssigneeAvatar + RequestsClient AssignMenuItem). 4 add-menu dropdowns deferred to Batch 4b (BDS `MenuItemData.description` promotion, cross-repo).
> - Batch 6 (`task/bds-cleanup-clickable-divs-3`, this PR): partial Cat 3 — 2 of 4 swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). Re-scoped from 4 → 2 after measuring: BDS `IconButton` works for the avatar wrappers (28px UserAvatar centers cleanly inside the 32px sm button), but the checklist row (#3) and inventory request row (#4) need their own BDS patterns — see triage row 6 / row 8 notes.
>
> Open count after Batches 1–4 + 6: **26**.

### Category 1 — `<button>` wrapping non-button content (1)

A `<button>` whose children are an entire layout (avatar + name + metadata + trailing badge or action). Bypasses all BDS interaction states; assistive tech flattens the row to a button label.

| # | File | Pattern |
|---|------|---------|
| 1 | [src/components/TrainingCard.tsx:134](../../src/components/TrainingCard.tsx#L134) | Full row: avatar + name + subtitle + progress + tag, all inside one `<button width:100%>`. Screenshot example. |

### Category 2 — Raw `<button>` instead of BDS `Button` / `IconButton` (27)

Most concentrate in three patterns: dropdown menu items, sheet drill-down nav-links, and one-off toggle buttons.

#### 2a. Menu items — 4 open / 6 total

Original audit framed all 6 as "swap raw `<button>` to BDS Menu" but Batch 4 inspection split them into two distinct shapes:

**Avatar + label (assignee picker)** — fits BDS `MenuItem` directly. Avatar passed via `item.icon` (`ReactNode`).

| # | File | Status |
|---|------|--------|
| 4 | ~~`RequestsClient.tsx:356` AssignMenuItem~~ | ✅ Batch 4 — local component deleted, swapped to BDS `<MenuItem>` with stopPropagation in spread props. (Audit had originally mislabeled this as "FilterPill" — verified it's actually a sibling of #6, same shape.) |
| 6 | ~~`TaskAssigneeAvatar.tsx:30` MenuItem~~ | ✅ Batch 4 — local component deleted, swapped to BDS `<MenuItem>`. |

**Icon + label + description (add-menu category picker)** — BDS `MenuItemData` only exposes `label: string` + `icon?: ReactNode`. The 2-line shape with description is not representable. **Deferred to a future BDS `MenuItemData.description` promotion (cross-repo).**

| # | File | Pattern | Status |
|---|------|---------|--------|
| 1 | [src/app/(auth)/settings/templates/TemplatesTable.tsx:379](../../src/app/(auth)/settings/templates/TemplatesTable.tsx#L379) | Add-template menu — `{label, desc, icon}` | Deferred (BDS gap) |
| 2 | [src/app/(auth)/tasks/TasksClient.tsx:630](../../src/app/(auth)/tasks/TasksClient.tsx#L630) | Add-task menu — same shape | Deferred (BDS gap) |
| 3 | [src/app/(auth)/requests/MyRequestsList.tsx:104](../../src/app/(auth)/requests/MyRequestsList.tsx#L104) | Add-request category menu — same shape | Deferred (BDS gap) |
| 5 | [src/app/(auth)/requests/RequestsClient.tsx:555](../../src/app/(auth)/requests/RequestsClient.tsx#L555) | Add-request category menu (board view) — same shape | Deferred (BDS gap) |

**Note on the deferred 4:** the entire dropdown panel is also hand-rolled (positioned `<div>` with `boxShadow` and `minWidth`), not using BDS `Menu`. A full fix needs both: (1) BDS `MenuItemData.description` (the item shape), and (2) BDS `Menu` adoption for the panel. Until BDS exposes both, swapping piecewise creates inconsistency.

#### 2b. Sheet drill-down nav-links (8)
Inline links inside read-mode sheet data that navigate to another sheet.

| # | File | Pattern |
|---|------|---------|
| 7 | [src/components/ViewContactSheet.tsx:202](../../src/components/ViewContactSheet.tsx#L202) | Activity card link |
| 8 | [src/components/ViewContactSheet.tsx:294](../../src/components/ViewContactSheet.tsx#L294) | Activity card link |
| 9 | [src/components/ViewRequestSheet.tsx:143](../../src/components/ViewRequestSheet.tsx#L143) | "Submitted By" |
| 10 | [src/components/ViewRequestSheet.tsx:153](../../src/components/ViewRequestSheet.tsx#L153) | "Assigned To" |
| 11 | [src/components/ViewRequestSheet.tsx:182](../../src/components/ViewRequestSheet.tsx#L182) | Room |
| 12 | [src/components/ViewRequestSheet.tsx:189](../../src/components/ViewRequestSheet.tsx#L189) | Equipment |
| 13 | [src/components/ViewRequestSheet.tsx:214](../../src/components/ViewRequestSheet.tsx#L214) | Vendor |
| 14 | [src/components/ViewRequestSheet.tsx:221](../../src/components/ViewRequestSheet.tsx#L221) | Vendor contact |

#### 2c. Toolbar / chrome buttons (icon-only or icon+label) — 2 open / 8 total

| # | File | Pattern | Status |
|---|------|---------|--------|
| 15 | [src/app/vendor/[token]/VendorSidebar.tsx:171](../../src/app/vendor/[token]/VendorSidebar.tsx#L171) | Nav icon button | Deferred — visual parity with `AppSidebar`'s `<Link>`-based nav. Belongs in BDS NavItem promotion (cross-repo). |
| 16 | ~~`VendorSidebar.tsx:196` Theme toggle~~ | — | ✅ Batch 2 — `IconButton variant=secondary size=sm` |
| 17 | [src/components/TopUtilityBar.tsx:136](../../src/components/TopUtilityBar.tsx#L136) | User avatar menu toggle | Deferred to Batch 6 — same pattern as Cat 3 clickable avatars. |
| 18 | ~~`AppSidebar.tsx:200` Theme toggle~~ | — | ✅ Batch 2 — `IconButton variant=secondary size=sm` |
| 19 | ~~`AppSidebar.tsx:211` Help button~~ | — | ✅ Batch 2 — `IconButton variant=secondary size=sm` |
| 20 | ~~`EditTemplateSheet.tsx:623` "+ Link to inventory"~~ | — | ✅ Batch 1 |
| 21 | ~~`EditTemplateSheet.tsx:633` "Edit link"~~ | — | ✅ Batch 1 |
| 22 | ~~`EditTemplateSheet.tsx:640` "Remove link"~~ | — | ✅ Batch 1 (`danger-ghost`) |

#### 2d. Tab bar + dev tools (5)
| # | File | Pattern |
|---|------|---------|
| 23 | [src/components/PageHeader.tsx:168](../../src/components/PageHeader.tsx#L168) | Hand-rolled tab buttons (`role="tab"`, `aria-selected`, underline border) |
| 24 | [src/components/EditTemplateSheet.tsx:650](../../src/components/EditTemplateSheet.tsx#L650) | Collapse button |
| 25 | [src/components/DevPersonaSwitcher.tsx:272](../../src/components/DevPersonaSwitcher.tsx#L272) | Tester tab |
| 26 | [src/components/DevPersonaSwitcher.tsx:297](../../src/components/DevPersonaSwitcher.tsx#L297) | Persona row: avatar + name + badge |
| 27 | TrainingCard.tsx duplicate (Category 1) | — |

### Category 3 — `<div onClick>` (clickable divs) — 2 open / 4 total

| # | File | Pattern | Status |
|---|------|---------|--------|
| 1 | ~~`TaskAssigneeAvatar.tsx:117-132` `<div role="button">` wrapping avatar~~ | — | ✅ Batch 6 — `IconButton variant=ghost size=sm` with the avatar passed as `icon`. The `.bds-icon-button__icon` span (16×16 logical) flex-centers a 28×28 UserAvatar inside the 32×32 button; visually clean, hover/focus states now BDS-themed. `aria-label` set to assignee name (or `"Assign to"` when unassigned). |
| 2 | ~~`RequestsClient.tsx:280-295` `<div role="button">` wrapping avatar / unassigned icon~~ | — | ✅ Batch 6 — same swap as #1. |
| 3 | [src/components/ViewTaskSheet.tsx:376-394](../../src/components/ViewTaskSheet.tsx#L376-L394) | Checklist item: checkbox + label, completion state styled by parent | Deferred — BDS `Checkbox` is an inline `<label>`-wrapped input with no row-level chrome (background, padding, completion-state styling). Current row is a clickable surface with three concerns (toggle target, completion bg, opacity-while-toggling). Needs either: (a) row-styling around BDS `Checkbox`, (b) a BDS `ChecklistItem` promotion. Pattern decision required. |
| 4 | [src/components/ViewInventorySheet.tsx:243-277](../../src/components/ViewInventorySheet.tsx#L243-L277) | Request row: icon + title + metadata + caret | Deferred — Pattern A (`InteractiveListItem` BDS promotion, triage row 8). Same shape as the inventory-row class in the pattern grouping. |

**Note for follow-up:** The IconButton-with-avatar pattern from #1+#2 is now proven and reusable. Cat 2c #17 (`TopUtilityBar.tsx:136` user avatar menu toggle) was deferred to Batch 6 with the same shape — it can be picked up in a small follow-up batch (`task/bds-cleanup-utility-bar-avatar`) without further design input.

### Category 4 — Unclassed wrapper divs in BDS-imitating components (0)

No findings. Layout containers in renew-pms use inline styles rather than imitating BDS BEM classes, so the "bare `<div>` masquerading as a BDS slot" failure mode does not occur.

### Category 5 — Naming drift on text-role props (0)

No public component prop drift detected. Internal style-object naming has minor inconsistency (`headingStyle` for non-outline text) — captured under Category 6.

### Category 6 — RESOLVED + RE-SCOPED (was 5 false-positives → 4 naming-drift renames)

**Original framing was wrong.** The audit assumed `font.size.heading.small` was below the 18px floor. Verified actual token values:

| Token | Value |
|-------|-------|
| `font.size.heading.tiny` | 18px (floor per CLAUDE.md) |
| `font.size.heading.small` | 20px |
| `font.size.heading.medium` | 22.5px |

All 5 originally-flagged style objects pair `font.family.heading` with values ≥ 18px — none violate the size rule. The `tokens.ts` file even comments: *"18px (font-size/200) — smallest heading; do NOT use font-size/100 (16px) for headings"*. The token scale is consistent; the original audit logic was the bug.

**Re-scoped to BEM slot naming consistency.** Per the [BDS naming-conventions doc](https://design.brikdesigns.com/docs/primitives/naming-conventions): *"title and heading refer to the same typographic role at different layers"* — BEM slot is `__title`, typography token is `heading`. Variables holding the **styles for a title-role text element** should be named `titleStyle`, not `headingStyle`.

Renamed in `task/bds-cleanup-title-naming`:

| # | File | Before → After |
|---|------|----------------|
| 1 | [src/app/global-error.tsx:23](../../src/app/global-error.tsx#L23) | `headingStyle` → `titleStyle` |
| 2 | [src/app/error.tsx:21](../../src/app/error.tsx#L21) | `headingStyle` → `titleStyle` |
| 3 | [src/app/(auth)/analytics/page.tsx:23](../../src/app/(auth)/analytics/page.tsx#L23) | `headingStyle` → `titleStyle` |
| 4 | [src/app/(auth)/documents/page.tsx:23](../../src/app/(auth)/documents/page.tsx#L23) | `headingStyle` → `titleStyle` |

The 2 originally-listed `sheetSectionTitle` / `sheetTitleStyle` variables already used the correct `Title` naming and needed no rename. The originally-listed `src/lib/styles.ts` `heading` export is the **typography group** (parallels the token name `heading.*`), not a slot — leaving as `heading` for consistency with the token family is correct.

**Regression prevention — rule landed in same PR.** Added check #14 to [`scripts/token-audit.sh`](../../scripts/token-audit.sh) flagging any `const \w*headingStyle` declaration in `src/`. Tested: clean codebase reports clean; planted regression (`const headingStyle: React.CSSProperties = …`) is caught and exits with non-zero. Future `headingStyle` reintroductions get blocked by the same audit run pre-PR. CLAUDE.md "12 categories" claim updated to "14".

**Out of scope (deliberately deferred):**
- `src/components/DevPersonaSwitcher.tsx:98` — `headerStyle` *holding text styles* (uppercase 11px section label). Renaming target would be `categoryLabelStyle` per the BDS `-label` family. Dev-only tool, not user-facing — deferred to avoid scope creep.

### Category 7 — Hand-built segmented controls / chip rows / tab bars (1)

| # | File | Pattern |
|---|------|---------|
| 1 | [src/components/PageHeader.tsx:165-179](../../src/components/PageHeader.tsx#L165-L179) | Hand-rolled tab bar. Same finding as Category 2d/#23. |

`SegmentedControl` is already adopted in `ContactsTable`, `TemplatesTable`, `TasksClient` — `PageHeader` is the lone exception and needs a BDS `TabBar`.

### Category 8 — RESOLVED (was 4 violations)

CLAUDE.md: "Never export `CSSProperties` objects for interactive elements — they bypass the component system and lose all interaction states."

Landed in `task/bds-cleanup-css-properties` (commit `ce8179c`).

| # | File | Resolution |
|---|------|------------|
| 1 | ~~`_sheetStyles.ts:35-49` `cancelBtnStyle`~~ | Deleted (dead export, never imported). |
| 2 | ~~`_sheetStyles.ts:51-65` `saveBtnStyle`~~ | Deleted (dead export, never imported). |
| 3 | ~~`EditTemplateSheet.tsx:214-224` `linkContextBtnStyle`~~ | Replaced 4 call sites with `Button variant=ghost/danger-ghost size=tiny`. |
| 4 | ~~`ViewContactSheet.tsx:95-105` `linkStyle`~~ | Replaced with `Button variant=ghost size=sm`. Also closes 1 of 8 Cat 2b violations. |

### Category 9 — `__heading` BEM class drift (0)

No `__heading` class names in renew-pms code. (Existing `__subtitle` references are inside `@brikdesigns/bds`.)

## Pattern grouping → BDS promotion candidates

The originally-identified interactive misuses (Categories 1+2+3) collapsed into **five reusable patterns**. Three are existing BDS components (straight swaps); two are net-new BDS promotion candidates.

### A. `EntityRow` / `InteractiveListItem` *(new BDS component)*

A clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action. The whole row is the click target.

**Covers (post-Batch 6 scope):** Category 1 (TrainingCard), 2d #26 (DevPersonaSwitcher persona), 3 #4 (ViewInventorySheet request row). Original scope also listed 2a #4 + #6 and 3 #1 + #2 — those four resolved via BDS `MenuItem` (Batch 4) and BDS `IconButton` (Batch 6) instead. The remaining three are still the strongest case for an `InteractiveListItem` promotion (full row click target with leading visual + title + subtitle + trailing).

**Why BDS, not local:** appears in ≥3 surfaces (training, settings/dev, inventory) each currently rolls its own. Past the abstraction threshold.

**Proposed API:**
```tsx
<InteractiveListItem
  leading={<UserAvatar … />}
  title="Emily Rivera"
  subtitle="Hygienist · 2 years"
  trailing={<Badge status="info">New hire</Badge>}
  onClick={…}
/>
```

### B. `MenuItem` *(verify BDS coverage; if missing, promote)*

Dropdown menu items: leading icon-or-avatar + label, full-width inside a menu.

**Covers:** Category 2a #1, #2, #3, #5.

**Action:** check Storybook MCP for an existing `MenuItem` / `DropdownItem` / `Menu.Item` before promoting. If BDS already exposes one, this is a swap-only batch.

### C. `InlineLink` *(verify BDS coverage; likely Button variant=ghost size=sm)*

Inline drill-down navigation inside read-mode data: short text-as-link that opens another sheet ("Emily Rivera", "Operatory 3", "Acme Dental Supply").

**Covers:** Category 2b #7–#14 (ViewRequestSheet + ViewContactSheet, 8 of 27).

**Action:** confirm whether this is a `Button variant=ghost` use case or whether BDS exposes a dedicated `InlineLink` / `EntityLink`. The current implementations all hand-roll the same underlined-on-hover style, which is a hint we need a named primitive.

### D. `IconButton` / `Button` *(straight swap)*

Toolbar / chrome buttons. BDS already covers these.

**Covers:** Category 2c #15–#22 (8 buttons across VendorSidebar, AppSidebar, TopUtilityBar, EditTemplateSheet).

### E. `TabBar` *(verify BDS coverage)*

Page-level tab strip with active-state underline.

**Covers:** Category 2d #23 + Category 7. Used by `PageHeader`, which is rendered above many product surfaces.

**Action:** Storybook MCP query for `TabBar`. If absent, this is the second BDS promotion (alongside `InteractiveListItem`).

## Triage — proposed batched PRs

Each row is a separate `task/bds-cleanup-*` branch off `staging`. Order is from highest leverage and lowest conflict risk to highest.

| # | Branch | Scope | Files touched | Notes |
|---|--------|-------|---------------|-------|
| 1 | `task/bds-cleanup-css-properties` ✅ | Remove the 4 interactive `CSSProperties` exports (Category 8). Replace each call site with BDS `Button`. | 4 files | **Landed (commit `ce8179c`).** Visual change: ViewContactSheet vendor link rendered in BDS ghost text color rather than prior brand-purple. Inline-link affordance refinement deferred to Batch 5. |
| 2 | `task/bds-cleanup-toolbar-buttons-2c` ✅ | Pattern D — swap sidebar bottom buttons (theme + help) to `IconButton`. | 2 files | **Landed (this PR).** Resolves 3 of 8 Cat 2c (#16, #18, #19). Cat 2c remainder: #20–#22 already done in Batch 1; #15 deferred to BDS NavItem promotion; #17 deferred to Batch 6 (clickable-avatar pattern). |
| 3 | `task/bds-cleanup-title-naming` ✅ | Rename `headingStyle` style-object variables to `titleStyle` per BDS `__title` BEM slot convention. | 4 files | **Landed (this PR).** Original Cat 6 framing (heading family + sub-18px) was a false-positive — `heading.tiny` is the 18px floor, `heading.small` is 20px. Re-scoped to naming-consistency only. Follow-up: add an ESLint/audit rule so new `headingStyle` declarations are flagged. |
| 4 | `task/bds-cleanup-menu-items-2a` ✅ | Partial Cat 2a — swap 2 of 6 to BDS `MenuItem` (TaskAssigneeAvatar + RequestsClient AssignMenuItem). | 2 files | **Landed (PR #58).** Storybook MCP check found BDS `MenuItem` exists and exports cleanly via barrel. The other 4 (add-menu category pickers) need a 2-line `{label, desc, icon}` shape that BDS `MenuItemData` doesn't expose — deferred to Batch 4b. |
| 4b | `bds-promotion: MenuItemData.description` | Add `description?: string` to BDS `MenuItemData` + render the second line. Then swap the 4 add-menu category dropdowns (TemplatesTable, TasksClient, MyRequestsList, RequestsClient #5) to BDS `Menu`. | BDS PR + 4 files in renew-pms | Cross-repo. Confirm shape with design before promoting (Figma spec for "menu item with description" — the 2-line variant). The hand-rolled dropdown panels in those 4 files also need to adopt BDS `Menu`, not just the items. |
| 5 | `task/bds-cleanup-inline-links-2b` | Pattern C — 8 sheet drill-down links. Confirm BDS surface (probably `Button variant=ghost size=sm`) or promote `InlineLink`. | 2 files | Concentrated in `ViewRequestSheet` + `ViewContactSheet`. |
| 6 | `task/bds-cleanup-clickable-divs-3` ✅ | Partial Cat 3 — 2 of 4 `<div role="button">` swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). | 2 files | **Landed (this PR).** Re-scoped from 4 → 2 after measuring BDS coverage: `IconButton` accepts a `ReactNode` icon and centers a 28×28 `UserAvatar` cleanly inside the 32×32 button. Cat 3 #3 (checklist row) and #4 (inventory request row) need pattern decisions and deferred — see Cat 3 status table. Follow-up: Cat 2c #17 (TopUtilityBar avatar) is the same shape as Batch 6 and can be picked up in a small follow-up. |
| 7 | `bds-promotion: TabBar` | Promote tab bar to BDS, then swap `PageHeader` (Category 2d #23 / Category 7). | BDS PR + 1 file in renew-pms | Cross-repo. Coordinate with BDS owner. |
| 8 | `bds-promotion: InteractiveListItem` | Promote the EntityRow pattern. Then swap 6 call sites (Categories 1, 2a-avatar, 2d-persona, 3-#4). | BDS PR + 5 files in renew-pms | Cross-repo. Highest design surface area — pair with Figma spec before building. |

**Sequencing rationale:** Batches 1–3 are pure cleanup with no design decisions and no BDS PR — they can run in parallel with feature work. Batches 4–6 require Storybook MCP checks first. Batches 7–8 are cross-repo BDS promotions and need design alignment before code.

## What this audit does not cover

- Color / token violations — already handled by `./scripts/token-audit.sh`.
- Accessibility audit beyond semantic-element choice (focus order, ARIA roles, keyboard handlers) — separate launch-checklist line item.
- Per-component prop API review (e.g., are we passing the right `size`/`variant`/`appearance` axes everywhere) — needs Storybook MCP cross-check, deferred until Batches 4–6.

## Re-running the audit

The numeric counts above will go stale as cleanup batches land. The grep recipes used to find them:

```bash
# Category 2 — raw <button>
rg -n '<button[^A-Za-z]' src/

# Category 3 — div onClick (incl. role="button")
rg -n '<div[^>]*\b(onClick|role="button")' src/

# Category 6 — heading family with non-heading sizes
rg -nA1 'font\.family\.heading' src/ | rg 'size\.(label|body|subtitle|heading\.(tiny|small))'

# Category 8 — CSSProperties exports for interactive elements
rg -n 'CSSProperties.*=.*\{' src/ | rg -i '(btn|button|link|click|action)'
```

Update the counts and the triage table at the top of each cleanup batch PR. When all categories drop to 0, fold this doc into the launch-checklist as a closed line item.
