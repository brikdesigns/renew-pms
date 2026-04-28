---
status: snapshot
owner: nick
last-updated: 2026-04-28
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-28 (Batch 4b — BDS `MenuItemData.description` extension + 4 add-menu swaps). Audit state after this PR + PR #75 both land: **11 open / 42 originally / 38 verified.** Cat 2a closes; Cat 7 closes via parallel PR #75 (already open). Only Batch 8 (`InteractiveListItem`) and 2c #15 (out of scope, blocked on BDS `NavItem`) remain.

## In-flight PRs

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| `brik-bds#303` ✅ MERGED | — | feat(bds): add MenuItemData.description for 2-line menu items | 5 | Published 0.44.0 to GitHub Packages. |
| this | `task/bds-cleanup-add-menu-4b` | refactor(bds): adopt BDS Menu for 4 add-menu surfaces (Cat 2a final) | 5 (4 component swaps + audit doc) | Renew-pms swap. Bumps `@brikdesigns/bds` 0.43 → 0.44. |
| `#75` (parallel) | `task/bds-pageheader-tabbar` | refactor(bds): swap PageHeader tabs to BDS TabBar variant=text | 3 | Closes Cat 7 + Cat 2d #23. Open, awaiting review. |

## Pattern + naming decisions documented in this batch

- **`MenuItemData.description?: string`** is now a first-class BDS field. Use for "what does this option do?" 2-line items in `Menu`. When `description` is absent, the item renders single-line (existing behavior, additive change).
- **Don't manage outside-click yourself.** When swapping a hand-rolled menu to BDS `<Menu>`, drop the `useRef` + `useEffect` outside-click handler — `<Menu>`'s `onClose` already fires on outside click + Escape. Same for the `flexShrink` wrapper div that existed only to position the menu — `<Menu>` accepts `style={{ top, right, marginTop }}` as positioning props.
- **The Add-menu pattern is canonical now.** Five surfaces converged on the same shape: `<Button>` trigger + `<Menu>` dropdown with description-bearing `MenuItemData[]`. Future add-X menus should mirror this exact shape — `addMenuOpen` state, `Menu`'s `onClose` handles all dismiss paths, items are mapped via `.map(c => ({ id, label, description, icon: <Icon icon={c.icon} />, onClick }))`.

## Next sessions — kickoff prompts

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap **5** call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row), and `ViewContactSheet.tsx:202` + `ViewContactSheet.tsx:294` (Cat 2b-B activity cards, moved here from Batch 5 in PR #67). Pre-work: Figma spec for the row pattern across training, inventory, dev-tools, and contact-activity surfaces. Pre-work also: check whether BDS already has the primitive (lessons from Batches 5/9/7) — likely not but verify.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

### Followup: BDS TabBar variant gap *(small, useful)*

> The current BDS `<TabBar>` has three variants (`text`/`tab`/`box`). renew-pms's PageHeader was historically a hybrid (`text` variant's brand-active color **+** `tab` variant's active underline). Adopted `text` in Batch 7 (PR #75); the underline was dropped. If we want the combo as a first-class pattern: add a 4th variant (e.g. `text-underline`) **or** add a boolean prop to `text` (`underline?: boolean`).

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex (`<button[ >]`). It misses multi-line declarations. Tiny audit-script-only change.

### Followup: BDS publish workflow automation

> Today BDS publishing to GitHub Packages is manual (`npm publish` from BDS primary worktree). A small `release.yml` GitHub Action that triggers `npm publish` on a tag push or on every `main` merge with a version bump would close this drift class.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-cleanup-add-menu-4b
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees present:

```
bds-pageheader-tabbar   # PR #75 (parallel cleanup batch — Batch 7)
docs-llm-stack-pointer  # unrelated
infra-tier1-shift-tasks # unrelated
```

## Primary worktree

The primary worktree (`~/Documents/GitHub/product/renew-pms`) is on `staging`. After this PR + PR #75 merge, `git pull` to fast-forward.

There are two untracked items in the primary tree: `tasks-list-before.png` (pre-session screenshot artifact, user-owned) and `supabase/.temp/` (Supabase CLI scratch dir). Both are added to `.git/info/exclude`.

## Audit status by category

After this PR + PR #75 land:

| Cat | Status |
|---|---|
| 1 — `<button>` wrapping non-button content | 1 open (TrainingCard) — Batch 8 |
| 2a — Menu items | 0 — RESOLVED (this PR + PR #58 prior) |
| 2b — Sheet drill-down nav-links | 0 — RESOLVED (PR #67) |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 4 open (#23 closed via PR #75) — Batch 8 covers #26 + #27; #24 EditTemplateSheet collapse + #25 DevPersonaSwitcher tester tab are own patterns |
| 3 — `<div onClick>` clickable divs | 1 open (#4 inventory row) — Batch 8 |
| 6 — Title-naming drift | 0 — RESOLVED (PR #56 + PR #66; audit checks #14 + #15) |
| 7 — Hand-built segmented controls/tabs | 0 — RESOLVED (PR #75) |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **`<Menu>` owns dismiss; consumers don't.** When adopting BDS `<Menu>` from a hand-rolled dropdown, drop the click-outside `useEffect` + `addBtnRef`. `<Menu>`'s `onClose` fires on outside click *and* Escape — covers both dismiss paths. Same for any cleanup of state in the close handler — fold it into `onClose`.
- **`MenuItemData.description` is the canonical 2-line item.** Don't render label + secondary text by hand inside `MenuItem`'s `label` prop. Use the new `description` field; BDS owns the visual styling.
- **The Addable family is bigger than I first scoped it.** From Batch 9. Four variants — `AddableTextList`, `AddableComboList`, `AddableEntryList`, `AddableFieldRowList`. Pick by data shape.
- **Always check whether the BDS primitive already exists.** Five batches in a row (5/9/7/4b's BDS half/4b's renew-pms half — well, 4b's BDS half *did* need extension) have re-scoped after pre-work. First step of any BDS-promotion batch should be `ls components/ui/` in BDS + grep for the suspected primitive.
- **Completion-state primitive ≠ Checkbox.** From Batch C3#3.
- **BDS publishing is manual today.** Run `npm publish` from BDS primary after merging a BDS PR. Tracked as a followup.
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch 4b has a real UI change — visual verification done in browser, answer "y" when prompted.
