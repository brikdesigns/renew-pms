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

## Findings — 38 open / 42 total across 9 categories

> Batch 1 (`task/bds-cleanup-css-properties`, commit `ce8179c`) resolved Category 8 (4 violations) and 1 of 8 Cat 2b violations. Open count: **38**. Cat 2b: **7 open / 8 total**. See triage table for next batches.

### Category 1 — `<button>` wrapping non-button content (1)

A `<button>` whose children are an entire layout (avatar + name + metadata + trailing badge or action). Bypasses all BDS interaction states; assistive tech flattens the row to a button label.

| # | File | Pattern |
|---|------|---------|
| 1 | [src/components/TrainingCard.tsx:134](../../src/components/TrainingCard.tsx#L134) | Full row: avatar + name + subtitle + progress + tag, all inside one `<button width:100%>`. Screenshot example. |

### Category 2 — Raw `<button>` instead of BDS `Button` / `IconButton` (27)

Most concentrate in three patterns: dropdown menu items, sheet drill-down nav-links, and one-off toggle buttons.

#### 2a. Menu items (6)
| # | File | Pattern |
|---|------|---------|
| 1 | [src/app/(auth)/settings/templates/TemplatesTable.tsx:379](../../src/app/(auth)/settings/templates/TemplatesTable.tsx#L379) | Menu item: icon + label, `flex w-full` |
| 2 | [src/app/(auth)/tasks/TasksClient.tsx:630](../../src/app/(auth)/tasks/TasksClient.tsx#L630) | Add-menu item: icon + div |
| 3 | [src/app/(auth)/requests/MyRequestsList.tsx:104](../../src/app/(auth)/requests/MyRequestsList.tsx#L104) | Category menu item |
| 4 | [src/app/(auth)/requests/RequestsClient.tsx:356](../../src/app/(auth)/requests/RequestsClient.tsx#L356) | Menu item: avatar + label |
| 5 | [src/app/(auth)/requests/RequestsClient.tsx:555](../../src/app/(auth)/requests/RequestsClient.tsx#L555) | Category menu item |
| 6 | [src/components/TaskAssigneeAvatar.tsx:30](../../src/components/TaskAssigneeAvatar.tsx#L30) | Menu item: avatar + label |

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

#### 2c. Toolbar / chrome buttons (icon-only or icon+label) (8)
| # | File | Pattern |
|---|------|---------|
| 15 | [src/app/vendor/[token]/VendorSidebar.tsx:171](../../src/app/vendor/[token]/VendorSidebar.tsx#L171) | Nav icon button |
| 16 | [src/app/vendor/[token]/VendorSidebar.tsx:196](../../src/app/vendor/[token]/VendorSidebar.tsx#L196) | Theme toggle |
| 17 | [src/components/TopUtilityBar.tsx:136](../../src/components/TopUtilityBar.tsx#L136) | User avatar menu toggle |
| 18 | [src/components/AppSidebar.tsx:200](../../src/components/AppSidebar.tsx#L200) | Theme toggle |
| 19 | [src/components/AppSidebar.tsx:211](../../src/components/AppSidebar.tsx#L211) | Help button |
| 20 | [src/components/EditTemplateSheet.tsx:623](../../src/components/EditTemplateSheet.tsx#L623) | "+ Link to inventory" |
| 21 | [src/components/EditTemplateSheet.tsx:633](../../src/components/EditTemplateSheet.tsx#L633) | "Edit link" |
| 22 | [src/components/EditTemplateSheet.tsx:640](../../src/components/EditTemplateSheet.tsx#L640) | "Remove link" |

#### 2d. Tab bar + dev tools (5)
| # | File | Pattern |
|---|------|---------|
| 23 | [src/components/PageHeader.tsx:168](../../src/components/PageHeader.tsx#L168) | Hand-rolled tab buttons (`role="tab"`, `aria-selected`, underline border) |
| 24 | [src/components/EditTemplateSheet.tsx:650](../../src/components/EditTemplateSheet.tsx#L650) | Collapse button |
| 25 | [src/components/DevPersonaSwitcher.tsx:272](../../src/components/DevPersonaSwitcher.tsx#L272) | Tester tab |
| 26 | [src/components/DevPersonaSwitcher.tsx:297](../../src/components/DevPersonaSwitcher.tsx#L297) | Persona row: avatar + name + badge |
| 27 | TrainingCard.tsx duplicate (Category 1) | — |

### Category 3 — `<div onClick>` (clickable divs) (4)

| # | File | Pattern |
|---|------|---------|
| 1 | [src/components/TaskAssigneeAvatar.tsx:145-160](../../src/components/TaskAssigneeAvatar.tsx#L145-L160) | `<div role="button">` wrapping avatar |
| 2 | [src/app/(auth)/requests/RequestsClient.tsx:280-295](../../src/app/(auth)/requests/RequestsClient.tsx#L280-L295) | `<div role="button">` wrapping avatar / unassigned icon |
| 3 | [src/components/ViewTaskSheet.tsx:376-394](../../src/components/ViewTaskSheet.tsx#L376-L394) | Checklist item: checkbox + label, completion state styled by parent |
| 4 | [src/components/ViewInventorySheet.tsx:243-250](../../src/components/ViewInventorySheet.tsx#L243-L250) | Request row: icon + title + metadata |

### Category 4 — Unclassed wrapper divs in BDS-imitating components (0)

No findings. Layout containers in renew-pms use inline styles rather than imitating BDS BEM classes, so the "bare `<div>` masquerading as a BDS slot" failure mode does not occur.

### Category 5 — Naming drift on text-role props (0)

No public component prop drift detected. Internal style-object naming has minor inconsistency (`headingStyle` for non-outline text) — captured under Category 6.

### Category 6 — `font.family.heading` paired with sub-18px size (5)

Per repo CLAUDE.md, `font.family.heading` is for h1–h5 / card names / section titles — minimum size `font.size.heading.tiny` (18px). Smaller sizes should use `font.family.label` or `font.family.body`. Variable name `headingStyle` also drifts: BEM slot is `__title`.

| # | File | Mismatch |
|---|------|---------|
| 1 | [src/app/global-error.tsx:23-25](../../src/app/global-error.tsx#L23-L25) | `headingStyle`: heading family + `size.heading.small` |
| 2 | [src/app/error.tsx:21-24](../../src/app/error.tsx#L21-L24) | `headingStyle`: heading family + `size.heading.small` |
| 3 | [src/app/(auth)/settings/_sheetStyles.ts:10-17](../../src/app/(auth)/settings/_sheetStyles.ts#L10-L17) | `sheetSectionTitle`: heading family + `size.heading.small` |
| 4 | [src/components/ViewContactSheet.tsx:77-79](../../src/components/ViewContactSheet.tsx#L77-L79) | `sheetTitleStyle`: heading family + `size.heading.small` |
| 5 | [src/lib/styles.ts:75-77](../../src/lib/styles.ts#L75-L77) | `sheetHeaderStyle`: heading family + `size.heading.tiny` |

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

The 35 interactive misuses (Categories 1+2+3) collapse into **five reusable patterns**. Three are existing BDS components (straight swaps); two are net-new BDS promotion candidates.

### A. `EntityRow` / `InteractiveListItem` *(new BDS component)*

A clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action. The whole row is the click target.

**Covers:** Category 1 (TrainingCard), 2a #4 + #6 (avatar menu items), 2d #26 (DevPersonaSwitcher persona), 3 #4 (ViewInventorySheet request row), 3 #1 + #2 (clickable avatars).

**Why BDS, not local:** appears in ≥4 surfaces (training, tasks, requests, inventory), each currently rolls its own. Already three similar lines × six places — past the abstraction threshold.

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
| 2 | `task/bds-cleanup-toolbar-buttons-2c` | Pattern D — swap 8 raw `<button>` to `Button` / `IconButton`. | 5 files | Pure swap, no new BDS. |
| 3 | `task/bds-cleanup-font-heading-misuse-6` | Fix the 5 `font.family.heading` + sub-18px style objects. Rename variables from `headingStyle` → `titleStyle` while there. | 5 files | Caught by manual review; not currently in `token-audit.sh`. Opportunity to add an audit rule. |
| 4 | `task/bds-cleanup-menu-items-2a` | Pattern B — confirm BDS `MenuItem` exists, then swap 6 menu items. If absent, promote first. | 6 files | Storybook MCP check before starting. |
| 5 | `task/bds-cleanup-inline-links-2b` | Pattern C — 8 sheet drill-down links. Confirm BDS surface (probably `Button variant=ghost size=sm`) or promote `InlineLink`. | 2 files | Concentrated in `ViewRequestSheet` + `ViewContactSheet`. |
| 6 | `task/bds-cleanup-clickable-divs-3` | Refactor 3 of 4 `<div onClick>` to BDS components (the avatar ones become `IconButton`; the checklist item becomes a proper checkbox-row component). | 4 files | The `ViewTaskSheet` checklist row is the trickiest — likely needs its own BDS pattern. |
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
