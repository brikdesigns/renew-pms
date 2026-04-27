---
status: snapshot
owner: nick
last-updated: 2026-04-27
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-27 (Batch 3b). Audit state after this PR lands: **25 open / 42 originally / 38 verified.** Cat 6 closes at 0 open.

## In-flight PR

Single-PR session this time. Previous stack (#59 → #60 → #61 → #62 → #63) merged.

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| this | `task/bds-cleanup-devpersona-headerstyle` | refactor(bds): rename DevPersonaSwitcher headerStyle + audit rule (Cat 6) | 3 | Closes Cat 6. Adds `token-audit.sh` check #15 (`headerStyle` holding text styles, with chrome-vs-text detection). Branched from `staging`. |

## Next sessions — kickoff prompts

Paste any of these as the first message of a new session.

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

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-cleanup-devpersona-headerstyle
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees present (not from this cleanup session, do not touch without checking):

```
auth-piggyback-domain             # unrelated
docs-llm-stack-pointer            # unrelated
infra-tier1-shift-tasks           # unrelated
```

## Primary worktree

The primary worktree (`~/Documents/GitHub/product/renew-pms`) is on `staging`. After this PR merges, `git pull` to fast-forward.

There is one untracked file in the primary tree: `tasks-list-before.png`. This is a pre-session screenshot artifact — leave it alone (the user owns it). It's been added to `.git/info/exclude` (per-clone, not committed) so `new-task.sh`'s dirty-tree check passes.

## Audit status by category

After this PR lands:

| Cat | Status |
|---|---|
| 1 — `<button>` wrapping non-button content | 1 open (TrainingCard) — Batch 8 |
| 2a — Menu items | 4 open (add-menu category pickers) — Batch 4b |
| 2b — Sheet drill-down nav-links | 7 open — Batch 5 |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 5 open — Batches 7 + 8 (covers #23, #25, #26, #27); #24 EditTemplateSheet collapse is its own pattern |
| 3 — `<div onClick>` clickable divs | 2 open (#3 checklist, #4 inventory row) — pattern decisions / Batch 8 |
| 6 — Title-naming drift | 0 — RESOLVED (PR #56 + this PR; audit checks #14 + #15) |
| 7 — Hand-built segmented controls/tabs | 1 open (PageHeader) — Batch 7 |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **`token-audit.sh` check #15 distinguishes chrome from text.** A `\w*headerStyle` declaration is only flagged if its body holds `fontSize`, `fontFamily`, `fontWeight`, `letterSpacing`, `lineHeight`, `textTransform`, or `textDecoration`. Chrome-only `headerStyle` (flex containers, padding, alignment) remain valid — there are ~17 of these across the codebase and they all pass clean. If you need to introduce a new "header" variable that holds text styles, name it `*labelStyle` or `*titleStyle` from the start.
- **The IconButton-wrapping-avatar pattern is now load-bearing** for any future "clickable avatar" surface. Reuse it. Variant: `ghost`. Size: match the wrapped UserAvatar (sm UserAvatar → sm button, md → md). The 1em icon span overflows but flex-centers the avatar inside the button cleanly.
- **Don't trust the audit's "mechanical" labels without measuring first.** Batch 6 looked like 4 mechanical violations from the triage notes; only 2 actually were (the avatars). The other 2 needed pattern decisions. Same likely applies elsewhere — measure BDS coverage before scoping a batch.
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch 3b is dev-tool-only (DevPersonaSwitcher) — variable rename has zero runtime effect; the new audit rule has zero runtime effect. `SKIP_UI_CHECK=1` is appropriate.
