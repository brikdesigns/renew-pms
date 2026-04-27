---
status: snapshot
owner: nick
last-updated: 2026-04-27
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-27 (Batch 5 — Cat 2b split & whitelist). Audit state after this PR lands: **19 open / 42 originally / 38 verified.** Cat 2b closes at 0 open.

## In-flight PR

Single-PR session. Doc-only — no runtime change.

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| this | `task/bds-cleanup-sheet-navlink-whitelist` | docs(qa): split Cat 2b — ViewRequestSheet resolved-as-acceptable, ViewContactSheet → Batch 8 | 3 | Closes Cat 2b. No code change — `bds-sheet__nav-link` is BDS-provided (`Sheet.css`) and `token-audit.sh` rule #3 already whitelists it. Branched from `staging`. |

## Next sessions — kickoff prompts

Paste any of these as the first message of a new session.

### 4b — BDS `MenuItemData.description` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Add `description?: string` to BDS `MenuItemData` and a 2-line render variant. Ship the BDS PR + version bump first, then in renew-pms swap the 4 add-menu category dropdowns: `TemplatesTable.tsx:379`, `TasksClient.tsx:630`, `MyRequestsList.tsx:104`, `RequestsClient.tsx:555`. The dropdown panels in those 4 files are also hand-rolled — adopt BDS `Menu`, not just `MenuItem`. Pre-work: Figma spec for the 2-line variant.

### Cat 3 #3 — ViewTaskSheet checklist row *(design call)*

> Decide pattern for `ViewTaskSheet.tsx:376-394` clickable checklist rows. Constraint: BDS `Checkbox` is an inline `<label>`-wrapped input with no row-level chrome (background, padding, completion-state styling). Current row is a `<div role="button">` with three concerns: (1) toggle target, (2) completion bg, (3) opacity-while-toggling. Options: (a) wrap BDS `Checkbox` in a custom row container in renew-pms, (b) promote a new BDS `ChecklistItem` primitive (full row click target with checkbox + label + completion state). Pre-work: Storybook MCP for any `Checklist*` story; Figma spec for "checklist item — completed" variant.

### 7 — BDS `TabBar` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Promote `TabBar` (active-state underline tab strip with `role="tab"` + `aria-selected`). Then swap `PageHeader.tsx:165-179` — closes Cat 2d #23 and Cat 7 in one move. Pre-work: Figma spec for tab-bar active state.

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap **5** call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row), and `ViewContactSheet.tsx:202` + `ViewContactSheet.tsx:294` (Cat 2b-B activity cards, moved here from Batch 5 in PR #67). Pre-work: Figma spec for the row pattern across training, inventory, dev-tools, and contact-activity surfaces.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex (`<button[ >]`). It misses multi-line declarations like `<button\n  type="button"\n  style={…}>`. ViewContactSheet:190 is one example caught by manual inspection but not by the script. Either (a) extend the regex to handle the multi-line case via `awk`/per-file scan (similar to check #15), or (b) add a follow-up rule that flags any `<button` opening tag whose attributes don't include a whitelisted token within the next 5 lines. Tiny audit-script-only change, no design call.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-cleanup-sheet-navlink-whitelist
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees present (not from this cleanup session, do not touch without checking):

```
auth-sender-support               # unrelated (PR #64 follow-up)
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
| 2b — Sheet drill-down nav-links | 0 — RESOLVED (PR #67; 2b-A consumes BDS class, 2b-B moved to Batch 8) |
| 2c — Toolbar / chrome buttons | 1 open (#15 VendorSidebar nav) — blocked on BDS NavItem promotion |
| 2d — Tab bar + dev tools | 5 open — Batches 7 + 8 (covers #23, #25, #26, #27); #24 EditTemplateSheet collapse is its own pattern |
| 3 — `<div onClick>` clickable divs | 2 open (#3 checklist, #4 inventory row) — pattern decisions / Batch 8 |
| 6 — Title-naming drift | 0 — RESOLVED (PR #56 + PR #66; audit checks #14 + #15) |
| 7 — Hand-built segmented controls/tabs | 1 open (PageHeader) — Batch 7 |
| 8 — `CSSProperties` for interactive elements | 0 — RESOLVED |

When all categories drop to 0, fold the audit into [`launch-checklist.md`](./launch-checklist.md) per the lifecycle in `cleanup-workflow.md`.

## Notes for the next session

- **"BDS provides only a class, not a component" is a recognized resolved-as-acceptable pattern.** Documented as decision step #2 in `cleanup-workflow.md`. When you see a raw `<button>` or `<a>` consuming a BDS class (e.g. `bds-sheet__nav-link`), the class is the BDS surface — don't promote a wrapping component for verbosity reduction alone unless ≥3 sites would benefit. The audit script's raw-element rules already whitelist these classes; align the audit doc when you find one.
- **`token-audit.sh` check #15 distinguishes chrome from text** for the `\w*headerStyle` rule (PR #66). A `*headerStyle` declaration is only flagged if its body holds `fontSize`, `fontFamily`, `fontWeight`, `letterSpacing`, `lineHeight`, `textTransform`, or `textDecoration`. Chrome-only `headerStyle` (flex containers, padding, alignment) remain valid.
- **The IconButton-wrapping-avatar pattern is now load-bearing** for any future "clickable avatar" surface. Reuse it. Variant: `ghost`. Size: match the wrapped UserAvatar (sm UserAvatar → sm button, md → md).
- **Don't trust the audit's "mechanical" labels without measuring first.** Batch 5 looked like 8 inline-link violations from the triage; pre-work found 6 already-BDS-sanctioned + 2 different-pattern. Same likely applies elsewhere — measure BDS coverage before scoping a batch, even when the audit doc looks confident.
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch 5 is doc-only (audit doc + workflow + handoff) — `SKIP_UI_CHECK=1` is appropriate.
