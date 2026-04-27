---
status: snapshot
owner: nick
last-updated: 2026-04-27
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-27. Audit state: **26 open / 42 originally / 38 verified.**

## In-flight PRs

The cleanup work this session sits on a stacked PR chain. Merge in order; each later PR rebases on the prior one.

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| [#59](https://github.com/brikdesigns/renew-pms/pull/59) | `task/docs-cleanup-workflow-pointer` | docs(claude): pointer to cleanup-workflow.md | 1 | Independent — can merge any time. |
| [#60](https://github.com/brikdesigns/renew-pms/pull/60) | `task/bds-cleanup-clickable-divs-3` | refactor(bds): swap clickable avatars to IconButton (Cat 3 partial) | 3 | Cat 3 #1 + #2 → BDS `IconButton`. Visual verified at `/requests`. |
| [#61](https://github.com/brikdesigns/renew-pms/pull/61) | `task/bds-cleanup-utility-bar-avatar` | refactor(bds): swap TopUtilityBar avatar to IconButton (Cat 2c #17) | 2 | Final Cat 2c. Stacks on #60. |
| [#62](https://github.com/brikdesigns/renew-pms/pull/62) | `task/docs-devpersona-cat6-triage` | docs(qa): elevate DevPersonaSwitcher Cat 6 to triage row 3b | 1 | Doc-only. Stacks on #61. |
| this | `task/docs-cleanup-handoff` | this file | 1 | Stacks on #62. |

**Merge order:** #59 → #60 → #61 → #62 → this. GitHub's merge-queue can do it automatically.

## Next sessions — kickoff prompts

Paste any of these as the first message of a new session.

### 3b — DevPersonaSwitcher headerStyle rename *(mechanical, unblocked)*

> Rename `DevPersonaSwitcher.tsx:98` `headerStyle` → `categoryLabelStyle` (or whatever `-Label` ending fits the BDS `-label` family). Also extend `scripts/token-audit.sh` check #14 to flag any `\w*headerStyle` declaration holding text styles. Tiny PR, no design call. Update audit Cat 6 + Triage row 3b to mark resolved when done.

### 5 — Cat 2b inline drill-down links *(design call)*

> Resolve Cat 2b inline drill-down links — 8 violations across `ViewRequestSheet.tsx` (lines 143, 153, 182, 189, 214, 221) and `ViewContactSheet.tsx` (lines 202, 294). Decision before code: are these `<Button variant=ghost size=sm>` calls (existing BDS surface), or do we promote a new BDS `InlineLink`/`EntityLink` primitive? Pre-work: query Storybook MCP for any `Link*` story; pull Figma file `kwNyWG6H3ifjZmytZnNJXd` for the inline drill-down link spec. The hand-rolled implementations all share an underlined-on-hover style, which hints at a missing primitive — but confirm with design before promoting.

### 4b — BDS `MenuItemData.description` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Add `description?: string` to BDS `MenuItemData` and a 2-line render variant. Ship the BDS PR + version bump first, then in renew-pms swap the 4 add-menu category dropdowns: `TemplatesTable.tsx:379`, `TasksClient.tsx:630`, `MyRequestsList.tsx:104`, `RequestsClient.tsx:555`. The dropdown panels in those 4 files are also hand-rolled — adopt BDS `Menu`, not just `MenuItem`. Pre-work: Figma spec for the 2-line variant.

### Cat 3 #3 — ViewTaskSheet checklist row *(design call)*

> Decide pattern for `ViewTaskSheet.tsx:376-394` clickable checklist rows. Constraint: BDS `Checkbox` is an inline `<label>`-wrapped input with no row-level chrome (background, padding, completion-state styling). Current row is a `<div role="button">` with three concerns: (1) toggle target, (2) completion bg, (3) opacity-while-toggling. Options: (a) wrap BDS `Checkbox` in a custom row container in renew-pms, (b) promote a new BDS `ChecklistItem` primitive (full row click target with checkbox + label + completion state). Pre-work: Storybook MCP for any `Checklist*` story; Figma spec for "checklist item — completed" variant.

### 7 — BDS `TabBar` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Promote `TabBar` (active-state underline tab strip with `role="tab"` + `aria-selected`). Then swap `PageHeader.tsx:165-179` — closes Cat 2d #23 and Cat 7 in one move. Pre-work: Figma spec for tab-bar active state.

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap 3 call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row). Pre-work: Figma spec for the row pattern across training, inventory, and dev-tools surfaces.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

## Worktree state

`git worktree list` shows the current worktrees in `~/Documents/GitHub/product/renew-pms-worktrees/`. Worktrees from this session that can be cleaned up *after their PR merges:*

```
bds-cleanup-clickable-divs-3      # PR #60
bds-cleanup-utility-bar-avatar    # PR #61 (rebased on #60)
docs-cleanup-workflow-pointer     # PR #59
docs-devpersona-cat6-triage       # PR #62 (rebased on #61)
docs-cleanup-handoff              # this PR (rebased on #62)
```

Other worktrees present (not from this cleanup session, do not touch without checking):

```
bds-cleanup-title-naming          # PR #56 (already merged into staging — worktree is stale, safe to prune)
docs-llm-stack-pointer            # unrelated
infra-tier1-shift-tasks           # unrelated
```

After a PR merges, clean up its worktree:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/<slug>
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

## Primary worktree

The primary worktree (`~/Documents/GitHub/product/renew-pms`) is on `staging` and may be 1–N commits behind `origin/staging` if PRs have merged this session. `git pull` to fast-forward when convenient.

There is one untracked file in the primary tree: `tasks-list-before.png`. This is a pre-session screenshot artifact — leave it alone (the user owns it).

## Audit status by category

After all PRs in this session land:

| Cat | Status |
|---|---|
| 1 — `<button>` wrapping non-button content | 1 open (TrainingCard) — Batch 8 |
| 2a — Menu items | 4 open (add-menu category pickers) — Batch 4b |
| 2b — Sheet drill-down nav-links | 7 open — Batch 5 |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 5 open — Batches 7 + 8 (covers #23, #25, #26, #27); #24 EditTemplateSheet collapse is its own pattern |
| 3 — `<div onClick>` clickable divs | 2 open (#3 checklist, #4 inventory row) — pattern decisions / Batch 8 |
| 6 — Title-naming drift | 1 open (DevPersonaSwitcher headerStyle) — Batch 3b |
| 7 — Hand-built segmented controls/tabs | 1 open (PageHeader) — Batch 7 |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **The IconButton-wrapping-avatar pattern is now load-bearing** for any future "clickable avatar" surface. Reuse it. Variant: `ghost`. Size: match the wrapped UserAvatar (sm UserAvatar → sm button, md → md). The 1em icon span overflows but flex-centers the avatar inside the button cleanly.
- **Don't trust the audit's "mechanical" labels without measuring first.** Batch 6 looked like 4 mechanical violations from the triage notes; only 2 actually were (the avatars). The other 2 needed pattern decisions. Same likely applies elsewhere — measure BDS coverage before scoping a batch.
- **Stack PRs explicitly** when they touch the same audit doc. The rebase trick (`git rebase origin/<prior-branch>`) keeps the diff clean and the merge automatic.
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches.
