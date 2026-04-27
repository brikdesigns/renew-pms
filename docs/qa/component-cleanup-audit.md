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

## Findings — 19 open / 42 originally / 38 verified across 9 categories

> **Batch progress:**
> - Batch 1 (`task/bds-cleanup-css-properties`, `ce8179c`): Cat 8 (4) + 1 of 8 Cat 2b → resolved.
> - Batch 2 (`task/bds-cleanup-toolbar-buttons-2c`, `987adfe`): 3 of 8 Cat 2c → resolved.
> - Batch 3 (`task/bds-cleanup-title-naming`, PR #56): re-scoped Cat 6 from 5 false-positive size violations to 5 naming-drift renames (4 user-facing + 1 dev-only) — 4 of 5 resolved in PR #56; 1 promoted to Triage Batch 3b. Cat 6 net: -5 false-positives + 5 real-issues = audit total **42 → 42**, verified-issue total **37 → 38**. Audit-script regression rule (`token-audit.sh` check #14) added in same PR.
> - Batch 3b (`task/bds-cleanup-devpersona-headerstyle`, PR #66): final Cat 6 — `DevPersonaSwitcher.tsx:98` `headerStyle` → `categoryLabelStyle`. Audit rule extended in same PR (new check #15 flags `\w*headerStyle` declarations holding text styles; chrome `headerStyle` containers remain valid). **Cat 6 closes at 0 open.**
> - Batch 4 (`task/bds-cleanup-menu-items-2a`, PR #58): partial Cat 2a — 2 of 6 swapped to BDS `MenuItem` (TaskAssigneeAvatar + RequestsClient AssignMenuItem). 4 add-menu dropdowns deferred to Batch 4b (BDS `MenuItemData.description` promotion, cross-repo).
> - Batch 5 (`task/bds-cleanup-sheet-navlink-whitelist`, this PR): Cat 2b split — 6 `ViewRequestSheet` sites consume `bds-sheet__nav-link` (BDS-provided class in `Sheet.css`) and were already whitelisted by `token-audit.sh` rule #3; **marked resolved-as-acceptable**. The 2 `ViewContactSheet` activity-card sites (#7 + #8) are a different pattern (full-row card button) and **moved to Batch 8 / `InteractiveListItem`** scope. Doc-only PR, no code change. **Cat 2b closes at 0 open.**
> - Batch 6 (`task/bds-cleanup-clickable-divs-3`, PR #60): partial Cat 3 — 2 of 4 swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). Re-scoped from 4 → 2 after measuring: BDS `IconButton` works for the avatar wrappers (28px UserAvatar centers cleanly inside the 32px sm button), but the checklist row (#3) and inventory request row (#4) need their own BDS patterns — see triage row 6 / row 8 notes.
> - Batch 6b (`task/bds-cleanup-utility-bar-avatar`, PR #61): final Cat 2c — #17 (TopUtilityBar user-avatar menu toggle) swapped to BDS `IconButton size=md` with the 40px UserAvatar as `icon`. Same pattern as Batch 6 at md size. Cat 2c open: 2 → 1 (only #15 VendorSidebar nav remains, blocked by the BDS `NavItem` promotion — that finding never belonged under "toolbar buttons", it's a navigation pattern).
>
> Open count after Batches 1–4 + 5 + 6 + 6b + 3b: **19**. (-6 ViewRequestSheet sites resolved-as-acceptable; +0 net for the 2 ViewContactSheet sites since they were already counted under Cat 2b and now flow into Batch 8 scope.)

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

#### 2b. Sheet drill-down nav-links — split into 2b-A (resolved) + 2b-B (moved to Batch 8)

The original framing assumed all 8 sites were the same hand-rolled inline-link pattern. Pre-work for Batch 5 (PR #67) found two distinct patterns.

##### 2b-A. Inline drill-down nav-link in `ReadOnlyField` value — RESOLVED (6)

`ViewRequestSheet` uses `<button type="button" className="bds-sheet__nav-link">` to render a JS-callback drill-down link inline with field text.

**Surprise:** `bds-sheet__nav-link` is a **BDS-provided class** defined in [`brik-bds/components/ui/Sheet/Sheet.css`](../../../brik/brik-bds/components/ui/Sheet/Sheet.css). The pattern is "raw `<button>` consuming a BDS-sanctioned class" — legitimate consumption of BDS styling without a wrapping component. BDS does have a `TextLink`, but it's `<a href>`-based — wrong for sheet-stack JS-callback navigation.

Audit-script status: rule #3 (raw `<button>`) already whitelists `bds-sheet__nav-link` (`token-audit.sh` lines 76, 82). These 6 sites pass the script clean.

**Decision (PR #67):** mark resolved-as-acceptable. Keep the pattern. Documented in `cleanup-workflow.md` as the "BDS-sanctioned class via raw element" exception.

| # | File | Pattern | Status |
|---|------|---------|--------|
| 9 | ~~`ViewRequestSheet.tsx:143` "Submitted By"~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |
| 10 | ~~`ViewRequestSheet.tsx:153` "Assigned To"~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |
| 11 | ~~`ViewRequestSheet.tsx:182` Room~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |
| 12 | ~~`ViewRequestSheet.tsx:189` Equipment~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |
| 13 | ~~`ViewRequestSheet.tsx:214` Vendor~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |
| 14 | ~~`ViewRequestSheet.tsx:221` Vendor contact~~ | `bds-sheet__nav-link` | ✅ Consumes BDS class |

##### 2b-B. Activity-card row — MOVED to Batch 8

`ViewContactSheet` activity entries (originally at lines 202 + 294) are not inline links — they're full-row buttons wrapping icon + title + meta + `StatusBadge`. Same shape as the `InteractiveListItem` row pattern in Batch 8.

| # | File | Pattern | Tracked in |
|---|------|---------|------------|
| 7 | [src/components/ViewContactSheet.tsx:202](../../src/components/ViewContactSheet.tsx#L202) | Activity card row (icon + title + meta + status) | → Batch 8 / Pattern A `InteractiveListItem` |
| 8 | [src/components/ViewContactSheet.tsx:294](../../src/components/ViewContactSheet.tsx#L294) | Activity card row | → Batch 8 / Pattern A `InteractiveListItem` |

> **Audit-script blind spot found during pre-work:** rule #3's raw-button regex (`<button[ >]`) is line-based and misses multi-line declarations like `<button\n  type="button"\n  style=…>`. Both ViewContactSheet sites use this multi-line shape and silently pass the audit. Tracked as a separate followup; not blocking the Cat 2b close-out.

#### 2c. Toolbar / chrome buttons (icon-only or icon+label) — 1 open / 8 total

| # | File | Pattern | Status |
|---|------|---------|--------|
| 15 | [src/app/vendor/[token]/VendorSidebar.tsx:171](../../src/app/vendor/[token]/VendorSidebar.tsx#L171) | Nav icon button | Deferred — visual parity with `AppSidebar`'s `<Link>`-based nav. Belongs in BDS NavItem promotion (cross-repo). |
| 16 | ~~`VendorSidebar.tsx:196` Theme toggle~~ | — | ✅ Batch 2 — `IconButton variant=secondary size=sm` |
| 17 | ~~`TopUtilityBar.tsx:136` User avatar menu toggle~~ | — | ✅ Batch 6b — `IconButton variant=ghost size=md` with the 40px UserAvatar passed as `icon`. Same pattern as Batch 6, just at md size to preserve the existing 40px avatar visual. |
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

**Note for follow-up:** The IconButton-with-avatar pattern from #1+#2 was applied to Cat 2c #17 (TopUtilityBar) in Batch 6b — see Cat 2c table.

### Category 4 — Unclassed wrapper divs in BDS-imitating components (0)

No findings. Layout containers in renew-pms use inline styles rather than imitating BDS BEM classes, so the "bare `<div>` masquerading as a BDS slot" failure mode does not occur.

### Category 5 — Naming drift on text-role props (0)

No public component prop drift detected. Internal style-object naming has minor inconsistency (`headingStyle` for non-outline text) — captured under Category 6.

### Category 6 — RE-SCOPED (was 5 false-positives → 4 user-facing renames + 1 dev-only deferred)

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

**Resolved in `task/bds-cleanup-devpersona-headerstyle` (Triage Batch 3b):**

| # | File | Before → After |
|---|------|----------------|
| 5 | [src/components/DevPersonaSwitcher.tsx:98](../../src/components/DevPersonaSwitcher.tsx#L98) | `headerStyle` → `categoryLabelStyle`. Variable held text styles (uppercase 11px section label) — BDS `-label` family is the right home, not `-header`. |

**Regression prevention — rule landed in same PR.** Added check #15 to [`scripts/token-audit.sh`](../../scripts/token-audit.sh) flagging any `const \w*headerStyle` declaration whose body contains text-style properties (`fontSize`, `fontFamily`, `fontWeight`, `letterSpacing`, `lineHeight`, `textTransform`, `textDecoration`). Chrome `headerStyle` (flex containers, padding, alignment only) are not flagged. Tested: clean codebase reports clean; planted regression (`const fakeHeaderStyle: CSSProperties = { fontSize: '11px', … }`) is caught and exits with non-zero. Existing chrome `headerStyle`/`subHeaderStyle`/`cardHeaderStyle` declarations across the codebase remain valid.

**Cat 6 closes at 0 open.** The category 6 lifecycle: 5 originally-flagged size violations → re-scoped to BEM naming drift in PR #56 (4 resolved + audit rule #14 added) → 1 dev-only finding (DevPersonaSwitcher `headerStyle`) tracked as Triage 3b → resolved here, audit rule #15 added.

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

**Covers (post-Batch 6 + post-Batch 5 scope):** Category 1 (TrainingCard), 2d #26 (DevPersonaSwitcher persona), 3 #4 (ViewInventorySheet request row), and **Cat 2b-B #7 + #8 (ViewContactSheet activity-card rows, moved here from Batch 5 in PR #67)**. Original scope also listed 2a #4 + #6 and 3 #1 + #2 — those four resolved via BDS `MenuItem` (Batch 4) and BDS `IconButton` (Batch 6) instead. The remaining five are still the strongest case for an `InteractiveListItem` promotion (full row click target with leading visual + title + subtitle + trailing).

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
| 3 | `task/bds-cleanup-title-naming` ✅ | Rename `headingStyle` style-object variables to `titleStyle` per BDS `__title` BEM slot convention. | 4 files | **Landed (PR #56).** Original Cat 6 framing (heading family + sub-18px) was a false-positive — `heading.tiny` is the 18px floor, `heading.small` is 20px. Re-scoped to naming-consistency only. Audit rule (`token-audit.sh` check #14) added in same PR. |
| 3b | `task/bds-cleanup-devpersona-headerstyle` ✅ | Rename `headerStyle` → `categoryLabelStyle` in `DevPersonaSwitcher.tsx:98`. The variable holds text styles for an uppercase 11px section label, so the BDS `-label` family is the right home, not `header*`. | 1 file + audit script + audit doc | **Landed (this PR).** Closes Cat 6 (0 open). Audit rule extended in same PR — new check #15 in `token-audit.sh` flags any `\w*headerStyle` declaration whose body contains text-style properties (chrome `headerStyle` containers remain valid). |
| 4 | `task/bds-cleanup-menu-items-2a` ✅ | Partial Cat 2a — swap 2 of 6 to BDS `MenuItem` (TaskAssigneeAvatar + RequestsClient AssignMenuItem). | 2 files | **Landed (PR #58).** Storybook MCP check found BDS `MenuItem` exists and exports cleanly via barrel. The other 4 (add-menu category pickers) need a 2-line `{label, desc, icon}` shape that BDS `MenuItemData` doesn't expose — deferred to Batch 4b. |
| 4b | `bds-promotion: MenuItemData.description` | Add `description?: string` to BDS `MenuItemData` + render the second line. Then swap the 4 add-menu category dropdowns (TemplatesTable, TasksClient, MyRequestsList, RequestsClient #5) to BDS `Menu`. | BDS PR + 4 files in renew-pms | Cross-repo. Confirm shape with design before promoting (Figma spec for "menu item with description" — the 2-line variant). The hand-rolled dropdown panels in those 4 files also need to adopt BDS `Menu`, not just the items. |
| 5 | `task/bds-cleanup-sheet-navlink-whitelist` ✅ | Cat 2b split: 6 `ViewRequestSheet` sites consume `bds-sheet__nav-link` (BDS-provided class) — marked resolved-as-acceptable; 2 `ViewContactSheet` activity-card sites moved to Batch 8 (`InteractiveListItem` row pattern). | doc-only | **Landed (PR #67).** Pre-work uncovered the BDS class already shipped in `Sheet.css` and the audit-script whitelist was already in place — no code change needed. Audit-script blind spot (multi-line `<button>` declaration regex) flagged as separate followup. |
| 6 | `task/bds-cleanup-clickable-divs-3` ✅ | Partial Cat 3 — 2 of 4 `<div role="button">` swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). | 2 files | **Landed (PR #60).** Re-scoped from 4 → 2 after measuring BDS coverage: `IconButton` accepts a `ReactNode` icon and centers a 28×28 `UserAvatar` cleanly inside the 32×32 button. Cat 3 #3 (checklist row) and #4 (inventory request row) need pattern decisions and deferred — see Cat 3 status table. |
| 6b | `task/bds-cleanup-utility-bar-avatar` ✅ | Final Cat 2c — #17 TopUtilityBar user-avatar menu toggle swapped to BDS `IconButton size=md`. | 1 file | **Landed (this PR).** Reuses the Batch 6 pattern at md size (40px UserAvatar, 40×40 button — exact alignment, no overflow). Cat 2c is now fully resolved except #15 (VendorSidebar nav), which always belonged under "BDS NavItem promotion" rather than "toolbar buttons". |
| 7 | `bds-promotion: TabBar` | Promote tab bar to BDS, then swap `PageHeader` (Category 2d #23 / Category 7). | BDS PR + 1 file in renew-pms | Cross-repo. Coordinate with BDS owner. |
| 8 | `bds-promotion: InteractiveListItem` | Promote the EntityRow pattern. Then swap 5 call sites: Cat 1 (TrainingCard), Cat 2d #26 (DevPersonaSwitcher persona), Cat 3 #4 (ViewInventorySheet request row), Cat 2b-B #7 + #8 (ViewContactSheet activity cards — moved from Batch 5). | BDS PR + 4 files in renew-pms | Cross-repo. Highest design surface area — pair with Figma spec before building. |

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
