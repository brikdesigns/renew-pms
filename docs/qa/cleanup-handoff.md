---
status: snapshot
owner: nick
last-updated: 2026-04-28
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-28 (Batch 9 — adopt BDS `<AddableFieldRowList>` in EditTemplateSheet authoring tab). Audit state after this PR lands: **17 open / 42 originally / 38 verified.** Batch 9 closes the last renew-pms-only audit batch — every remaining open item is either a cross-repo BDS promotion (4b, 7, 8) or blocked on a separate BDS effort (2c #15 → NavItem).

## In-flight PR

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| this | `task/bds-cleanup-edittemplate-addable` | refactor(bds): adopt AddableFieldRowList for EditTemplateSheet checklist authoring | 3 (component + audit doc + handoff) | Renew-pms-only. No BDS PR — `AddableFieldRowList` (per ADR-005) already covered the multi-field row shape with a render-prop children API. |

## Pattern + naming decisions documented in this batch

**The Addable family had the right primitive already** — pre-work for Batch 9 surfaced that I'd been thinking of `AddableEntryList` when `AddableFieldRowList` is the canonical multi-field row collection (per ADR-005). Different shape: `AddableEntryList` enforces a `{primary, secondary}` data shape; `AddableFieldRowList` is generic `T[]` + `newRow` factory + `children: (ctx) => ReactNode` render-prop, so consumers own the per-row markup.

For row-shaped collections in renew-pms going forward:

| Primitive | Use when |
|---|---|
| `AddableTextList` | Flat single-string tag list ("comma-separated chips") |
| `AddableComboList` | Suggestion-driven tag list (vocabulary-locked) |
| `AddableEntryList` | Title + description card per row, fixed shape |
| `AddableFieldRowList` | **Multi-field row, consumer owns markup** — reach for this when row has 3+ fields, conditional render, or expandable sub-rows |

Reinforced in `cleanup-workflow.md` decision step #1 ("Does BDS already cover this?") — the answer for "list with add/remove + custom row content" is now `AddableFieldRowList`, not "wrap your own."

## Next sessions — kickoff prompts

Paste any of these as the first message of a new session.

### 4b — BDS `MenuItemData.description` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Add `description?: string` to BDS `MenuItemData` and a 2-line render variant. Ship the BDS PR + version bump first, then in renew-pms swap the 4 add-menu category dropdowns: `TemplatesTable.tsx:379`, `TasksClient.tsx:630`, `MyRequestsList.tsx:104`, `RequestsClient.tsx:555`. The dropdown panels in those 4 files are also hand-rolled — adopt BDS `Menu`, not just `MenuItem`. Pre-work: Figma spec for the 2-line variant.

### 7 — BDS `TabBar` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Promote `TabBar` (active-state underline tab strip with `role="tab"` + `aria-selected`). Then swap `PageHeader.tsx:165-179` — closes Cat 2d #23 and Cat 7 in one move. Pre-work: Figma spec for tab-bar active state.

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap **5** call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row), and `ViewContactSheet.tsx:202` + `ViewContactSheet.tsx:294` (Cat 2b-B activity cards, moved here from Batch 5 in PR #67). Pre-work: Figma spec for the row pattern across training, inventory, dev-tools, and contact-activity surfaces.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex (`<button[ >]`). It misses multi-line declarations like `<button\n  type="button"\n  style={…}>`. ViewContactSheet:190 is one example caught by manual inspection but not by the script. Either (a) extend the regex to handle the multi-line case via `awk`/per-file scan (similar to check #15), or (b) add a follow-up rule that flags any `<button` opening tag whose attributes don't include a whitelisted token within the next 5 lines. Tiny audit-script-only change, no design call.

### Followup: BDS publish workflow automation

> Today BDS publishing to GitHub Packages is manual (`npm publish` from BDS primary worktree). Every previous version was hand-published. A small `release.yml` GitHub Action that triggers `npm publish` on a tag push or on every `main` merge with a version bump would close this drift class. Out of scope for the cleanup audit — track in BDS infra backlog.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-cleanup-edittemplate-addable
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees present (not from this cleanup session, do not touch without checking):

```
docs-llm-stack-pointer            # unrelated
infra-tier1-shift-tasks           # unrelated
```

## Primary worktree

The primary worktree (`~/Documents/GitHub/product/renew-pms`) is on `staging`. After this PR merges, `git pull` to fast-forward.

There are two untracked items in the primary tree: `tasks-list-before.png` (pre-session screenshot artifact, user-owned) and `supabase/.temp/` (Supabase CLI scratch dir). Both are added to `.git/info/exclude` (per-clone, not committed) so `new-task.sh`'s dirty-tree check passes.

## Audit status by category

After this PR lands:

| Cat | Status |
|---|---|
| 1 — `<button>` wrapping non-button content | 1 open (TrainingCard) — Batch 8 |
| 2a — Menu items | 4 open (add-menu category pickers) — Batch 4b |
| 2b — Sheet drill-down nav-links | 0 — RESOLVED (PR #67; 2b-A consumes BDS class, 2b-B moved to Batch 8) |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 5 open — Batches 7 + 8 (covers #23, #25, #26, #27); #24 EditTemplateSheet collapse is its own pattern |
| 3 — `<div onClick>` clickable divs | 1 open (#4 inventory row) — Batch 8 |
| 6 — Title-naming drift | 0 — RESOLVED (PR #56 + PR #66; audit checks #14 + #15) |
| 7 — Hand-built segmented controls/tabs | 1 open (PageHeader) — Batch 7 |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **Reach for `AddableFieldRowList` for any "list with add/remove + custom row content" pattern.** It's the canonical multi-field row primitive (per ADR-005) and uses a render-prop children API — consumer owns the row's fields, BDS owns the scaffolding (label, helper, empty state, per-row remove icon, bottom Add button). Per-row expansion / inline collapsibility works via `gridColumn: '1 / -1'` inside the render-prop because each row is a CSS grid container.
- **The Addable family is bigger than I first scoped it.** Four variants — `AddableTextList`, `AddableComboList`, `AddableEntryList`, `AddableFieldRowList`. Pick by data shape: flat strings, suggestion tags, title+description cards, multi-field rows. `AddableFieldRowList` is the most flexible.
- **Don't trust the audit's "design call" labels without checking BDS first.** Batch 9 was framed as "design call: extend AddableEntryList or do drawer." The actual answer was "BDS already has a different primitive that fits — use that." Same lesson as Batch 5 (PR #67) where `bds-sheet__nav-link` turned out to already exist.
- **Completion-state primitive ≠ Checkbox.** `<ChecklistItem>` looks like a checkbox row but represents *completion on a unit of work* (circle, brand-primary fill on done). `<Checkbox>` represents *selection of a value* (square, traditional checkbox). Both ship from BDS; reach for the right one based on what the box represents. From Batch C3#3.
- **BDS publishing is manual today.** After merging a BDS PR, run `npm publish` from the BDS primary worktree. Without this, consumer `npm install` will not pick up the new version. Tracked as a followup (release.yml automation).
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch 9 has a real UI change (top→bottom Add button + inline-editable labels) — visual verification was done in browser, so answer "y" when prompted.
