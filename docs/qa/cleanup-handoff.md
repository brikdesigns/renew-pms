---
status: snapshot
owner: nick
last-updated: 2026-04-28
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-28 (Batch 7 — swap PageHeader to BDS `<TabBar variant="text">`). Audit state after this PR lands: **15 open / 42 originally / 38 verified.** Cat 7 closes at 0 open; Cat 2d #23 also resolved. Two open batches remain (4b + 8) plus 2c #15 (out of scope, blocked on BDS `NavItem`).

## In-flight PR

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| this | `task/bds-pageheader-tabbar` | refactor(bds): swap PageHeader tabs to BDS TabBar variant=text | 3 (PageHeader + audit doc + handoff) | Renew-pms-only. No BDS PR — `<TabBar>` already shipped in BDS (since #47, well before 0.43.0). Adopted `text` variant to preserve PageHeader's brand-active text color; underline lost. |

## Pattern + naming decisions documented in this batch

- **Three TabBar variants in BDS today:** `text` (color-only active), `tab` (color + container border + active underline), `box` (filled active). PageHeader's pre-existing visual was a hybrid (brand-active text **+** active underline), which no BDS variant matches exactly.
- **Decision:** preserve brand-active color (Option 2) — adopted `text` variant. Active state now communicates via brand-purple text alone, no underline. Trade-off acknowledged: slightly weaker active affordance than the prior hybrid, but consistent with the "every variant has a clear semantic role" principle.
- **System gap flagged:** if the brand-color + underline combo turns out to be load-bearing for other surfaces, propose extending BDS — either a 4th variant (`text-underline`) or a prop on `text` that opts into an active underline. Not in scope for the audit cleanup.

## Next sessions — kickoff prompts

### 4b — BDS `MenuItemData.description` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Add `description?: string` to BDS `MenuItemData` and a 2-line render variant. Ship the BDS PR + version bump first, then in renew-pms swap the 4 add-menu category dropdowns: `TemplatesTable.tsx:379`, `TasksClient.tsx:630`, `MyRequestsList.tsx:104`, `RequestsClient.tsx:555`. The dropdown panels in those 4 files are also hand-rolled — adopt BDS `Menu`, not just `MenuItem`. Pre-work: check Storybook MCP for current `MenuItem` / `Menu` API; pull Figma spec for the 2-line variant.

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap **5** call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row), and `ViewContactSheet.tsx:202` + `ViewContactSheet.tsx:294` (Cat 2b-B activity cards, moved here from Batch 5 in PR #67). Pre-work: Figma spec for the row pattern across training, inventory, dev-tools, and contact-activity surfaces.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

### Followup: BDS TabBar variant gap *(small, useful)*

> The current BDS `<TabBar>` has three variants (`text`/`tab`/`box`). renew-pms's PageHeader was historically a hybrid (`text` variant's brand-active color **+** `tab` variant's active underline). Adopted `text` in Batch 7 (PR this); the underline was dropped. If we want the combo as a first-class pattern: add a 4th variant (e.g. `text-underline`) **or** add a boolean prop to `text` (`underline?: boolean`). Cross-repo BDS PR + minor PageHeader swap when the feature lands.

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex (`<button[ >]`). It misses multi-line declarations like `<button\n  type="button"\n  style={…}>`. ViewContactSheet:190 is one example caught by manual inspection but not by the script. Either (a) extend the regex to handle the multi-line case via `awk`/per-file scan (similar to check #15), or (b) add a follow-up rule that flags any `<button` opening tag whose attributes don't include a whitelisted token within the next 5 lines. Tiny audit-script-only change.

### Followup: BDS publish workflow automation

> Today BDS publishing to GitHub Packages is manual (`npm publish` from BDS primary worktree). A small `release.yml` GitHub Action that triggers `npm publish` on a tag push or on every `main` merge with a version bump would close this drift class. Out of scope for the cleanup audit — track in BDS infra backlog.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-pageheader-tabbar
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
| 2b — Sheet drill-down nav-links | 0 — RESOLVED (PR #67) |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 4 open (#23 closed via Batch 7) — Batch 8 covers #26 + #27; #24 EditTemplateSheet collapse + #25 DevPersonaSwitcher tester tab are own patterns |
| 3 — `<div onClick>` clickable divs | 1 open (#4 inventory row) — Batch 8 |
| 6 — Title-naming drift | 0 — RESOLVED (PR #56 + PR #66; audit checks #14 + #15) |
| 7 — Hand-built segmented controls/tabs | 0 — RESOLVED (this PR) |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **Always check whether the BDS primitive already exists.** Batch 7 was framed as "promote TabBar to BDS, then swap PageHeader." Pre-work found `<TabBar>` had been in BDS since well before the audit was written. **Three batches in a row** (5, 9, 7) have re-scoped from "promote new BDS primitive" to "BDS already has it — just swap." First step of any BDS-promotion batch should be `ls components/ui/` in BDS + grep for the suspected primitive.
- **The Addable family is bigger than I first scoped it.** Four variants — `AddableTextList`, `AddableComboList`, `AddableEntryList`, `AddableFieldRowList`. Pick by data shape: flat strings, suggestion tags, title+description cards, multi-field rows. From Batch 9.
- **TabBar variant-gap pattern** — when adopting an existing BDS primitive, the pre-existing renew-pms visual may not match any variant exactly. Surface trade-offs to design owner; pick the closest variant; flag the gap as a followup. Don't bend BDS to match a renew-pms hybrid without evidence the hybrid is needed across multiple surfaces.
- **Completion-state primitive ≠ Checkbox.** From Batch C3#3 (#69).
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch 7 has a real UI change (active state visual) — visual verification done in browser, answer "y" when prompted.
