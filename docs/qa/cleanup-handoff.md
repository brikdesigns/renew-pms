---
status: snapshot
owner: nick
last-updated: 2026-04-28
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-28 (Batch 8 — `<InteractiveListItem>` BDS promotion + 5-site swap). Audit state after this PR + #75 + #76 land: **3 open / 42 originally / 38 verified.** Cat 1, Cat 2a, Cat 2b, Cat 3, Cat 6, Cat 7, Cat 8 all closed at 0. **The audit's pattern-promotion goal is met.** The 3 remaining items don't belong to a ≥3-site reusable pattern (they're own-pattern one-offs or out-of-scope) — see "What's left and why" below.

## In-flight PRs

| PR | Status | Notes |
|----|--------|-------|
| `brik-bds#304` ✅ MERGED | published 0.45.0 | Adds `<InteractiveListItem>` |
| this | open | Renew-pms swap of 5 sites; bumps `@brikdesigns/bds` 0.43 → 0.45 |
| `#75` | open | Batch 7 (PageHeader → TabBar text) |
| `#76` | open | Batch 4b (4 add-menu sites → BDS Menu) |

When all three open PRs merge, audit-doc count edits will need reconciling — each PR independently updates the count + batch-progress lines. Resolve by summing the deltas:
- staging baseline: 17
- −2 from #75 (Cat 7 + Cat 2d #23 close)
- −4 from #76 (Cat 2a four sites close)
- −8 from this PR (Cat 1 + Cat 2b-B ×2 + Cat 2d #26 + #27 + Cat 3 #4)
- = **3 open** after all three land

## Pattern + naming decisions documented in this batch

- **`<InteractiveListItem>` is the canonical "drill-down row" primitive.** Whole row is a `<button>`; slots are `leading: ReactNode + title: string + subtitle?: ReactNode + trailing?: ReactNode + disabled?`. Use for: training member cards, activity feeds, persona switchers, inventory request rows — anywhere clicking the row opens a sheet, drawer, or detail page.
- **Distinct from `CardControl` / `Card preset="control"`.** CardControl's trailing **action** (Switch / Button) is the click target; the card itself is decorative. InteractiveListItem inverts that — the **row** is interactive, trailing is decorative (Tag, Badge, progress block, caret).
- **Distinct from `ChecklistItem`.** ChecklistItem represents *completion state* on a unit of work. InteractiveListItem represents a *drill-down* — no toggle, no completion semantics.
- **`subtitle: ReactNode` is load-bearing.** Pre-work for Batch 8 cataloged the 5 sites and found the audit's "subtitle: string" assumption was too narrow. ViewInventorySheet has multi-line subtitle (text + StatusBadge + PriorityBadge inline); TrainingCard has structured trailing (Tag + progress block). The ReactNode types let consumers compose freely while BDS owns the row chrome (padding, hover, focus, disabled).

## What's left and why

3 items remain open after Batches 1–9 + 4b + 7 + 8 + C3#3 + 3b. None are within the audit's pattern-promotion goals:

| # | Item | Why open |
|---|------|----------|
| Cat 2c #15 | `VendorSidebar.tsx:171` nav icon button | Out of audit scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Tracked but not under this audit. |
| Cat 2d #24 | `EditTemplateSheet.tsx:650` collapse button | Own one-off pattern. No `≥3 sites` to promote against. Best left as-is or fixed in place when next touched. |
| Cat 2d #25 | `DevPersonaSwitcher.tsx:272` tester tab (parent navigator) | Dev-only tool. Sibling of #26 but at parent navigator level (above the persona row), not row-style. Own pattern. Out of scope. |

Per `cleanup-workflow.md`: when remaining items don't form a reusable pattern, **fold the audit into `launch-checklist.md`** rather than continue chasing one-off items. Recommend doing so — the cleanup audit has served its purpose.

## Next sessions — followups (not audit batches)

### Fold audit into launch-checklist + close the audit doc

> Per `cleanup-workflow.md` lifecycle: when all reusable patterns have closed (Cat 1, 2a, 2b, 3, 6, 7, 8 all at 0), the audit's purpose is served. Move the 3 remaining out-of-scope items to `launch-checklist.md` (or a separate "deferred BDS work" doc), then archive `component-cleanup-audit.md`. Doc-only PR.

### Followup: BDS TabBar variant gap *(small)*

> BDS `<TabBar>` has three variants (`text`/`tab`/`box`); none combines `text` variant's brand-active color with `tab` variant's underline. PageHeader (Batch 7) chose `text` and lost the underline. If the combo turns out to be load-bearing for other surfaces, propose extending BDS — either a `text-underline` variant or a `underline?: boolean` prop on `text`.

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex. Misses multi-line declarations.

### Followup: BDS publish workflow automation

> Today BDS publishing to GitHub Packages is manual. A small `release.yml` GitHub Action that triggers `npm publish` on tag push or `main` merge with a version bump would close this drift class. Tracked in BDS infra backlog.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-interactive-list-item-8
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees from in-flight cleanup PRs (will prune after their PRs merge):

```
bds-cleanup-add-menu-4b   # PR #76
bds-pageheader-tabbar     # PR #75
docs-llm-stack-pointer    # unrelated
infra-tier1-shift-tasks   # unrelated
```

## Audit status by category

After this PR + PR #75 + PR #76 all land:

| Cat | Status |
|---|---|
| 1 — `<button>` wrapping non-button content | 0 — RESOLVED (this PR via `<InteractiveListItem>`) |
| 2a — Menu items | 0 — RESOLVED (PR #76 final) |
| 2b — Sheet drill-down nav-links | 0 — RESOLVED (PR #67; 2b-B closed via this PR's ViewContactSheet swap) |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — out of audit scope (BDS NavItem promotion) |
| 2d — Tab bar + dev tools | 2 open (#24 EditTemplateSheet collapse, #25 DevPersonaSwitcher tester tab — own one-off patterns) |
| 3 — `<div onClick>` clickable divs | 0 — RESOLVED (this PR's ViewInventorySheet swap closes #4) |
| 6 — Title-naming drift | 0 — RESOLVED |
| 7 — Hand-built segmented controls/tabs | 0 — RESOLVED (PR #75) |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

**The audit's pattern-promotion goal is met.** Recommend folding into launch-checklist + archiving the audit doc.

## Notes for the next session

- **`<InteractiveListItem>` is the new canonical drill-down row.** Reach for it any time you have a leading visual + primary text + optional subtitle + optional trailing. Don't compose `<Card>` + custom button wrapping — that's how we got into this audit in the first place.
- **`subtitle: ReactNode` lets you embed badges, multi-line metadata, structured content.** From Batch 8 pre-work — the audit's "string subtitle" assumption was too narrow.
- **`<Menu>` + `MenuItemData.description` (v0.44.0) handles the "Add X" menu pattern** with icon + label + 2-line description. From Batch 4b.
- **`<ChecklistItem>` (v0.43.0) handles completion-state rows** with circular toggle. Distinct from `<Checkbox>` (rectangular form selection). From Batch C3#3.
- **`<AddableFieldRowList>` handles authoring-mode lists** with add/remove + custom row content. From Batch 9.
- **`<TabBar>` handles page-level tab navigation** (3 variants, none currently support brand-color + underline combo). From Batch 7.
- **Always check whether the BDS primitive already exists.** Five pre-works in a row uncovered "BDS already has it" or "BDS has the visual buried in another component" findings (Batches 5/9/7/4b's pre-checks). For Batch 8 + 4b, real BDS extensions were genuinely needed; for the others, swap-only batches.
- **BDS publishing is manual today.** `npm publish` from BDS primary worktree after each merge.
