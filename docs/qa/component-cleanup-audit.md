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

## Findings — 11 open / 42 originally / 38 verified across 9 categories

> **Batch progress:**
> - Batch 1 (`task/bds-cleanup-css-properties`, `ce8179c`): Cat 8 (4) + 1 of 8 Cat 2b → resolved.
> - Batch 2 (`task/bds-cleanup-toolbar-buttons-2c`, `987adfe`): 3 of 8 Cat 2c → resolved.
> - Batch 3 (`task/bds-cleanup-title-naming`, PR #56): re-scoped Cat 6 from 5 false-positive size violations to 5 naming-drift renames (4 user-facing + 1 dev-only) — 4 of 5 resolved in PR #56; 1 promoted to Triage Batch 3b. Cat 6 net: -5 false-positives + 5 real-issues = audit total **42 → 42**, verified-issue total **37 → 38**. Audit-script regression rule (`token-audit.sh` check #14) added in same PR.
> - Batch 3b (`task/bds-cleanup-devpersona-headerstyle`, PR #66): final Cat 6 — `DevPersonaSwitcher.tsx:98` `headerStyle` → `categoryLabelStyle`. Audit rule extended in same PR (new check #15 flags `\w*headerStyle` declarations holding text styles; chrome `headerStyle` containers remain valid). **Cat 6 closes at 0 open.**
> - Batch 4 (`task/bds-cleanup-menu-items-2a`, PR #58): partial Cat 2a — 2 of 6 swapped to BDS `MenuItem` (TaskAssigneeAvatar + RequestsClient AssignMenuItem). 4 add-menu dropdowns deferred to Batch 4b (BDS `MenuItemData.description` promotion, cross-repo).
> - Batch 5 (`task/bds-cleanup-sheet-navlink-whitelist`, PR #67): Cat 2b split — 6 `ViewRequestSheet` sites consume `bds-sheet__nav-link` (BDS-provided class in `Sheet.css`) and were already whitelisted by `token-audit.sh` rule #3; **marked resolved-as-acceptable**. The 2 `ViewContactSheet` activity-card sites (#7 + #8) are a different pattern (full-row card button) and **moved to Batch 8 / `InteractiveListItem`** scope. Doc-only PR, no code change. **Cat 2b closes at 0 open.**
> - Batch 6 (`task/bds-cleanup-clickable-divs-3`, landed via stack PR #63): partial Cat 3 — 2 of 4 swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). Re-scoped from 4 → 2 after measuring: BDS `IconButton` works for the avatar wrappers (28px UserAvatar centers cleanly inside the 32px sm button), but the checklist row (#3) and inventory request row (#4) need their own BDS patterns — see triage row 6 / row 8 notes.
> - Batch 6b (`task/bds-cleanup-utility-bar-avatar`, landed via stack PR #63): final Cat 2c — #17 (TopUtilityBar user-avatar menu toggle) swapped to BDS `IconButton size=md` with the 40px UserAvatar as `icon`. Same pattern as Batch 6 at md size. Cat 2c open: 2 → 1 (only #15 VendorSidebar nav remains, blocked by the BDS `NavItem` promotion — that finding never belonged under "toolbar buttons", it's a navigation pattern).
> - Batch C3#3 (`task/bds-cleanup-checklist-item-3`, PR #69): Cat 3 #3 — `ViewTaskSheet.tsx:376-394` checklist row swapped to BDS `<ChecklistItem>` (cross-repo BDS promotion in PR brik-bds#297, v0.43.0). Pre-work uncovered the **completion-state primitive** as a distinct concept from `<Checkbox>` (selection vs. completion; circle vs. square). New BDS exports: `<CompletionToggle>` (atomic circular `<button>`) + `<ChecklistItem>` (row composition with native `<label>` + hidden `<input type="checkbox">`); `<BoardCard>` internally consumes `<CompletionToggle>` so the circle visual is single-sourced. End-to-end visually verified (light + dark, toggle round-trip, progress counter advances). Cat 3 open: 2 → 1 (only #4 ViewInventorySheet remains, deferred to Batch 8).
> - Batch 9 (`task/bds-cleanup-edittemplate-addable`, PR #74): EditTemplateSheet authoring tab adopted BDS `<AddableFieldRowList>` (per ADR-005 — canonical multi-field row primitive with render-prop children). UX shift: top "type-and-press-Enter" Add input replaced by bottom "Add Checklist Item" button + inline-editable label TextInput per row (matches BDS Addable conventions); per-item collapsible context panel preserved via `gridColumn: '1 / -1'` inside the render-prop. Drops `newItem` state + `addItem`/`removeItem` handlers + 4 layout style exports + 2 orphaned imports (`Icon`, `icon`). End-to-end browser-verified: add, inline label edit, expand → 3 Selects render, link to inventory, collapse, remove.
> - Batch 7 (`task/bds-pageheader-tabbar`, PR #75): PageHeader hand-rolled tab bar swapped to BDS `<TabBar variant="text">`. Pre-work re-scoped: BDS `TabBar` already exists with three variants (`text`/`tab`/`box`) — no BDS PR needed. None of the variants exactly matched PageHeader's hand-rolled hybrid (brand-active color **+** active underline); chose `text` variant to preserve brand-active color, accept loss of underline. **Cat 7 closes at 0 open**; Cat 2d #23 also resolved (same site). BDS variant gap (text + underline) flagged as followup. Single call site swap (only `OrganizationSettingsClient` passes `tabs` to PageHeader).
> - Batch 4b (`task/bds-cleanup-add-menu-4b`, this PR): final Cat 2a — 4 add-menu sites adopted BDS `<Menu>` after cross-repo extension (`brik-bds#303`, v0.44.0) added `description?: string` to `MenuItemData`. Sites: TemplatesTable (Add Template), TasksClient (Add Task), MyRequestsList (New Request), RequestsClient (Add Request, board view). Each swap dropped a hand-rolled `<div>` panel + raw `<button>` items + (in TasksClient) the click-outside `useEffect` and `addBtnRef`. End-to-end browser-verified across all four surfaces — icons, 2-line label+description, click → trigger handler. **Cat 2a closes at 0 open.**
>
> Open count after Batches 1–4 + 4b + 5 + 6 + 6b + 3b + C3#3 + 9 + 7: **11**. Cat 2a + Cat 7 + Cat 2d #23 close.

### Category 1 — `<button>` wrapping non-button content (1)

A `<button>` whose children are an entire layout (avatar + name + metadata + trailing badge or action). Bypasses all BDS interaction states; assistive tech flattens the row to a button label.

| # | File | Pattern |
|---|------|---------|
| 1 | [src/components/TrainingCard.tsx:134](../../src/components/TrainingCard.tsx#L134) | Full row: avatar + name + subtitle + progress + tag, all inside one `<button width:100%>`. Screenshot example. |

### Category 2 — Raw `<button>` instead of BDS `Button` / `IconButton` (27)

Most concentrate in three patterns: dropdown menu items, sheet drill-down nav-links, and one-off toggle buttons.

#### 2a. Menu items — RESOLVED (was 6 violations)

Original audit framed all 6 as "swap raw `<button>` to BDS Menu" but Batch 4 inspection split them into two distinct shapes:

**Avatar + label (assignee picker)** — fits BDS `MenuItem` directly. Avatar passed via `item.icon` (`ReactNode`).

| # | File | Status |
|---|------|--------|
| 4 | ~~`RequestsClient.tsx:356` AssignMenuItem~~ | ✅ Batch 4 — local component deleted, swapped to BDS `<MenuItem>` with stopPropagation in spread props. |
| 6 | ~~`TaskAssigneeAvatar.tsx:30` MenuItem~~ | ✅ Batch 4 — local component deleted, swapped to BDS `<MenuItem>`. |

**Icon + label + description (add-menu category picker)** — needed `MenuItemData.description` to support the 2-line shape. Closed in Batch 4b via cross-repo BDS extension (brik-bds#303 → 0.44.0).

| # | File | Status |
|---|------|--------|
| 1 | ~~`TemplatesTable.tsx:379` Add Template menu~~ | ✅ Batch 4b — adopted BDS `<Menu>` with `description` per item. Hand-rolled `<div>` panel + raw `<button>` items dropped. |
| 2 | ~~`TasksClient.tsx:630` Add Task menu~~ | ✅ Batch 4b — same swap. Click-outside `useEffect` + `addBtnRef` removed (BDS `<Menu>` owns outside-click handling). |
| 3 | ~~`MyRequestsList.tsx:104` New Request menu~~ | ✅ Batch 4b — same swap. |
| 5 | ~~`RequestsClient.tsx:555` Add Request menu (board view)~~ | ✅ Batch 4b — same swap. |

**Cross-repo work**: `brik-bds#303` (v0.44.0) added `description?: string` to `MenuItemData`, plus a `bds-menu__item--with-description` modifier and new `bds-menu__text` / `bds-menu__label` / `bds-menu__description` slots for per-line styling. Single-line items unchanged (additive, non-breaking).

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

#### 2d. Tab bar + dev tools — 4 open / 5 total
| # | File | Pattern | Status |
|---|------|---------|--------|
| 23 | ~~`PageHeader.tsx:168` Hand-rolled tab buttons~~ | — | ✅ Batch 7 — swapped to BDS `<TabBar variant="text">`. |
| 24 | [src/components/EditTemplateSheet.tsx:650](../../src/components/EditTemplateSheet.tsx#L650) | Collapse button | Open |
| 25 | [src/components/DevPersonaSwitcher.tsx:272](../../src/components/DevPersonaSwitcher.tsx#L272) | Tester tab | Open |
| 26 | [src/components/DevPersonaSwitcher.tsx:297](../../src/components/DevPersonaSwitcher.tsx#L297) | Persona row: avatar + name + badge | Open — Batch 8 (`InteractiveListItem`) |
| 27 | TrainingCard.tsx duplicate (Category 1) | — | Open — Batch 8 (`InteractiveListItem`) |

### Category 3 — `<div onClick>` (clickable divs) — 1 open / 4 total

| # | File | Pattern | Status |
|---|------|---------|--------|
| 1 | ~~`TaskAssigneeAvatar.tsx:117-132` `<div role="button">` wrapping avatar~~ | — | ✅ Batch 6 — `IconButton variant=ghost size=sm` with the avatar passed as `icon`. The `.bds-icon-button__icon` span (16×16 logical) flex-centers a 28×28 UserAvatar inside the 32×32 button; visually clean, hover/focus states now BDS-themed. `aria-label` set to assignee name (or `"Assign to"` when unassigned). |
| 2 | ~~`RequestsClient.tsx:280-295` `<div role="button">` wrapping avatar / unassigned icon~~ | — | ✅ Batch 6 — same swap as #1. |
| 3 | ~~`ViewTaskSheet.tsx:376-394` Checklist row~~ | — | ✅ **Batch C3#3 (this PR)** — swapped to BDS `<ChecklistItem>` (promoted alongside `<CompletionToggle>` in BDS PR #297, v0.43.0). Re-framed during pre-work as a **completion-state primitive** (circular, distinct from `<Checkbox>` which stays for form selections — "I agree to terms"). The new row uses native `<label>` + `<input type="checkbox">` (entire row is the click target, native `Space`/`Enter` toggle, better a11y than the prior `role="button"` + manual `onKeyDown`). Dropped 30+ lines of local styles (`checklistItemStyle`, `checkboxStyle`, `checklistLabelStyle`) and 2 orphaned imports (`Icon` from iconify, `icon` from `@/lib/icons`). Visually verified end-to-end (browser): completion bg + strikethrough, progress counter advances on toggle, dark-mode themed correctly. |
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

### Category 7 — Hand-built segmented controls / chip rows / tab bars — RESOLVED (was 1 violation)

| # | File | Resolution |
|---|------|------------|
| 1 | ~~`PageHeader.tsx:165-179` Hand-rolled tab bar~~ | ✅ Batch 7 — swapped to BDS `<TabBar variant="text">`. Same finding closed Category 2d/#23 in one move. |

`SegmentedControl` was already adopted in `ContactsTable`, `TemplatesTable`, `TasksClient`. `PageHeader` was the lone exception. Resolved via BDS `<TabBar>` (which already shipped — no BDS PR needed for Batch 7).

> **BDS variant gap flagged during Batch 7** — the existing PageHeader visual was a hybrid (`text` variant's brand-active color **+** `tab` variant's underline). No BDS variant currently combines both. Adopted `text` variant (brand-active color, no underline) per design call; the underline is lost. If we want this combination as a first-class pattern, propose a BDS extension: either a 4th variant (`text-underline`) or a prop on `text` that opts into an active underline. Tracked in handoff as a followup, not in this PR scope.

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
| 4b | `task/bds-cleanup-add-menu-4b` ✅ | Add `description?: string` to BDS `MenuItemData` + render the second line. Then swap the 4 add-menu category dropdowns (TemplatesTable, TasksClient, MyRequestsList, RequestsClient #5) to BDS `Menu`. | BDS PR (brik-bds#303 → 0.44.0) + 4 renew-pms files | **Landed (this PR + brik-bds#303).** BDS extension was additive: new optional `description` field on `MenuItemData`, new `bds-menu__item--with-description` modifier + nested `bds-menu__text` / `bds-menu__label` / `bds-menu__description` slots. Renew-pms swap dropped 4 hand-rolled `<div>` panels, 4 raw `<button>` item lists, 1 click-outside `useEffect` + `addBtnRef`, and a few orphaned imports. End-to-end verified in browser (5 task types in Tasks; 3 categories in Requests / MyRequestsList; filtered list in Templates). **Cat 2a closes at 0 open.** |
| 5 | `task/bds-cleanup-sheet-navlink-whitelist` ✅ | Cat 2b split: 6 `ViewRequestSheet` sites consume `bds-sheet__nav-link` (BDS-provided class) — marked resolved-as-acceptable; 2 `ViewContactSheet` activity-card sites moved to Batch 8 (`InteractiveListItem` row pattern). | doc-only | **Landed (PR #67).** Pre-work uncovered the BDS class already shipped in `Sheet.css` and the audit-script whitelist was already in place — no code change needed. Audit-script blind spot (multi-line `<button>` declaration regex) flagged as separate followup. |
| 6 | `task/bds-cleanup-clickable-divs-3` ✅ | Partial Cat 3 — 2 of 4 `<div role="button">` swapped to BDS `IconButton` (TaskAssigneeAvatar + RequestsClient AssigneeAvatar). | 2 files | **Landed (via stack PR #63).** Re-scoped from 4 → 2 after measuring BDS coverage: `IconButton` accepts a `ReactNode` icon and centers a 28×28 `UserAvatar` cleanly inside the 32×32 button. Cat 3 #3 (checklist row) and #4 (inventory request row) need pattern decisions and deferred — see Cat 3 status table. |
| 6b | `task/bds-cleanup-utility-bar-avatar` ✅ | Final Cat 2c — #17 TopUtilityBar user-avatar menu toggle swapped to BDS `IconButton size=md`. | 1 file | **Landed (via stack PR #63).** Reuses the Batch 6 pattern at md size (40px UserAvatar, 40×40 button — exact alignment, no overflow). Cat 2c is now fully resolved except #15 (VendorSidebar nav), which always belonged under "BDS NavItem promotion" rather than "toolbar buttons". |
| 7 | `task/bds-pageheader-tabbar` ✅ | Swap `PageHeader` to BDS `<TabBar variant="text">` (Category 2d #23 / Category 7). | 1 renew-pms file (no BDS PR — TabBar already shipped) | **Landed (this PR).** Pre-work re-scoped: BDS `TabBar` already exists with `text`/`tab`/`box` variants. None exactly matched PageHeader's hand-rolled hybrid (brand-active color **+** active underline). Adopted `text` variant — preserves brand-active color, drops the underline. BDS variant gap flagged as a followup (could add `text-underline` variant or `underline` prop on `text`). Single call site (`OrganizationSettingsClient`); other PageHeader users don't pass `tabs`. |
| 8 | `bds-promotion: InteractiveListItem` | Promote the EntityRow pattern. Then swap 5 call sites: Cat 1 (TrainingCard), Cat 2d #26 (DevPersonaSwitcher persona), Cat 3 #4 (ViewInventorySheet request row), Cat 2b-B #7 + #8 (ViewContactSheet activity cards — moved from Batch 5). | BDS PR + 4 files in renew-pms | Cross-repo. Highest design surface area — pair with Figma spec before building. |
| 9 | `task/bds-cleanup-edittemplate-addable` ✅ | Adopt BDS `<AddableFieldRowList>` for the EditTemplateSheet checklist authoring tab. | 1 renew-pms file (no BDS PR needed) | **Landed (this PR).** Pre-work re-scoped: BDS already has the right primitive — `AddableFieldRowList` (per ADR-005) is the canonical multi-field row collection with a render-prop children API that lets the consumer own per-row markup. No `AddableEntryList` extension or drawer redesign needed. Design call A2 chosen: embrace BDS conventions — labels become inline-editable, Add button moves to the bottom (was top "type-and-press-Enter"), the per-item collapsible context panel renders inline below the row via `gridColumn: '1 / -1'`. Net effect on EditTemplateSheet: drops `newItem` state + `addItem`/`removeItem` handlers + 4 layout style exports + 2 orphaned imports (`Icon`, `icon`). End-to-end browser-verified: add, inline label edit, expand, link to inventory, collapse, remove. |
| C3#3 | `task/bds-cleanup-checklist-item-3` ✅ | Cat 3 #3 — `ViewTaskSheet.tsx` checklist row swapped to BDS `<ChecklistItem>` (cross-repo: BDS PR brik-bds#297 promoted `<CompletionToggle>` + `<ChecklistItem>` and refactored BoardCard to consume the atom). | BDS PR + 1 renew-pms file (+ audit doc + handoff) | **Landed (this PR).** Pattern decision: completion-state primitive distinct from `<Checkbox>` (selection vs. completion; circle vs. square); single-sourced visual via `<CompletionToggle>` reused inside both `<ChecklistItem>` (row) and `<BoardCard>` (card chrome). End-to-end visually verified in browser (light + dark, toggle round-trip, progress counter advances). |

**Sequencing rationale:** Batches 1–3 are pure cleanup with no design decisions and no BDS PR — they can run in parallel with feature work. Batches 4–6 require Storybook MCP checks first. Batches 7–8 are cross-repo BDS promotions and need design alignment before code. Batch 9 turned out to be a renew-pms-only adoption of an already-shipped BDS primitive (`AddableFieldRowList`).

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
