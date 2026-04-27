---
status: snapshot
owner: nick
last-updated: 2026-04-27
related: ./component-cleanup-audit.md, ./cleanup-workflow.md
---

# Cleanup handoff — current state

> **What this is:** a transient snapshot of in-flight cleanup work. Replace this file at the end of each cleanup session — do not append history. Audit history lives in [`component-cleanup-audit.md`](./component-cleanup-audit.md); workflow rules live in [`cleanup-workflow.md`](./cleanup-workflow.md).

**Last session:** 2026-04-27 (Batch C3#3 — promote `<CompletionToggle>` + `<ChecklistItem>` to BDS, swap ViewTaskSheet). Audit state after this PR lands: **18 open / 42 originally / 38 verified.** Cat 3 #3 closes; only Cat 3 #4 (ViewInventorySheet) remains in Cat 3, deferred to Batch 8.

## In-flight work

Cross-repo. The BDS half landed first as `brik-bds#297` (v0.43.0). This PR is the renew-pms swap.

| PR | Branch | Title | Files | Notes |
|----|--------|-------|-------|-------|
| `brik-bds#297` ✅ MERGED | `task/bds-completion-toggle-checklist-item` | feat(bds): add CompletionToggle + ChecklistItem; refactor BoardCard | 14 files | New BDS primitives: `<CompletionToggle>` (atomic circular `<button>`) and `<ChecklistItem>` (row composition with `<label>` + hidden `<input>`). `<BoardCard>` internal refactor consumes `<CompletionToggle>` so the circle is single-sourced. Published 0.43.0 to GitHub Packages. |
| this | `task/bds-cleanup-checklist-item-3` | refactor(bds): swap ViewTaskSheet checklist row to BDS ChecklistItem (Cat 3 #3) | 4 files (package.json + lockfile bump, ViewTaskSheet swap, audit doc + handoff) | Bumps `@brikdesigns/bds` 0.41 → 0.43. Drops 30+ lines of local styles + 2 orphaned imports. Visual verified end-to-end in browser. |

## Pattern + naming decisions documented in this batch

The pre-work for Cat 3 #3 surfaced three primitives that are now distinct in BDS:

| Primitive | Visual | Use for | Notes |
|---|---|---|---|
| `<Checkbox>` (existing) | **Square** | Form selections — "I agree to terms," multi-select filters, settings toggles | Selection, not completion |
| `<CompletionToggle>` (new) | **Circle, atomic `<button>`** | Card chrome (BoardCard), standalone "is this done" toggles | The circle is the click target |
| `<ChecklistItem>` (new) | **Circle inside a `<label>` row** | Task checklists, clinical procedure steps, compliance checks | Entire row is the click target; native `Space`/`Enter` toggle |

Documented in BDS Storybook (`Components/Form/CompletionToggle.mdx` + `Components/Form/ChecklistItem.mdx`) and reinforced in `cleanup-workflow.md` decision step #2 ("Does BDS provide only a CSS class, not a component?" — added in Batch 5 / PR #67).

## Next sessions — kickoff prompts

Paste any of these as the first message of a new session.

### 4b — BDS `MenuItemData.description` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Add `description?: string` to BDS `MenuItemData` and a 2-line render variant. Ship the BDS PR + version bump first, then in renew-pms swap the 4 add-menu category dropdowns: `TemplatesTable.tsx:379`, `TasksClient.tsx:630`, `MyRequestsList.tsx:104`, `RequestsClient.tsx:555`. The dropdown panels in those 4 files are also hand-rolled — adopt BDS `Menu`, not just `MenuItem`. Pre-work: Figma spec for the 2-line variant.

### 7 — BDS `TabBar` promotion *(cross-repo, design call)*

> Cross-repo BDS promotion. Promote `TabBar` (active-state underline tab strip with `role="tab"` + `aria-selected`). Then swap `PageHeader.tsx:165-179` — closes Cat 2d #23 and Cat 7 in one move. Pre-work: Figma spec for tab-bar active state.

### 8 — BDS `InteractiveListItem` promotion *(cross-repo, design call, biggest)*

> Cross-repo BDS promotion. Highest design surface area in the audit — pair with a Figma spec before any code. Promote `InteractiveListItem` (clickable horizontal row: leading icon-or-avatar + title + optional subtitle + optional trailing badge/action). Then swap **5** call sites in renew-pms: `TrainingCard.tsx:134` (Cat 1), `DevPersonaSwitcher.tsx:297` (Cat 2d #26 persona row), `ViewInventorySheet.tsx:243-277` (Cat 3 #4 request row), and `ViewContactSheet.tsx:202` + `ViewContactSheet.tsx:294` (Cat 2b-B activity cards, moved here from Batch 5 in PR #67). Pre-work: Figma spec for the row pattern across training, inventory, dev-tools, and contact-activity surfaces.

### 9 — EditTemplateSheet checklist authoring → BDS `AddableEntryList` *(design call)*

> Adopt BDS `<AddableEntryList>` for the EditTemplateSheet checklist-authoring tab (`EditTemplateSheet.tsx:594` items map). The current implementation is a hand-rolled numbered list with `+ Link to Inventory` / Edit / Remove buttons per row. Pre-work confirmed `AddableEntryList` covers the basic shape (primary + secondary + add/remove), but lacks a per-row trailing-slot for the inventory-link action. Decision before code: (a) move inventory linking into a per-item drawer/menu and use vanilla `AddableEntryList`, (b) extend BDS with a `renderTrailing(entry, idx)` slot (small, additive, doesn't break existing callers), or (c) ship a sibling `AddableEntryListWithActions`. Pre-work: pull Figma spec for the authoring row; query Storybook MCP for the current `Addable*` family API surface.

### 2c #15 — VendorSidebar nav *(blocked on BDS NavItem promotion)*

> Out of cleanup scope — needs a separate `bds-promotion: NavItem` cross-repo effort. Track here, but do not start under this audit.

### Followup: audit-script multi-line `<button>` regex

> Rule #3 in `scripts/token-audit.sh` (raw `<button>` check) uses a line-based regex (`<button[ >]`). It misses multi-line declarations like `<button\n  type="button"\n  style={…}>`. ViewContactSheet:190 is one example caught by manual inspection but not by the script. Either (a) extend the regex to handle the multi-line case via `awk`/per-file scan (similar to check #15), or (b) add a follow-up rule that flags any `<button` opening tag whose attributes don't include a whitelisted token within the next 5 lines. Tiny audit-script-only change, no design call.

### Followup: BDS publish workflow automation

> Today BDS publishing to GitHub Packages is manual (`npm publish` from BDS primary worktree). Every previous version (0.41.0, 0.42.0, 0.43.0…) was hand-published. A small `release.yml` GitHub Action that triggers `npm publish` on a tag push or on every `main` merge with a version bump would close this drift class. Out of scope for the cleanup audit — track in BDS infra backlog.

## Worktree state

After this PR merges, prune:

```bash
rm -rf ~/Documents/GitHub/product/renew-pms-worktrees/bds-cleanup-checklist-item-3
git -C ~/Documents/GitHub/product/renew-pms worktree prune
```

Other worktrees present (not from this cleanup session, do not touch without checking):

```
auth-piggyback-domain             # unrelated
auth-sender-support               # unrelated (PR #64 follow-up)
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

- **Completion-state primitive ≠ Checkbox.** The pattern decision in this batch was non-obvious: `<ChecklistItem>` looks like a checkbox row but represents *completion on a unit of work* (circle, brand-primary fill on done). `<Checkbox>` represents *selection of a value* (square, traditional checkbox). Both ship from BDS; reach for the right one based on what the box represents. Documented in BDS MDX and in `cleanup-workflow.md` decision step #2.
- **The circle is single-sourced.** `<CompletionToggle>` is the atom; `<ChecklistItem>` reuses it inside a `<label>` row, and `<BoardCard>` consumes it as card chrome. Means a token change to the circle visual propagates to all three call sites without divergence. If a future surface needs the same "is this done" affordance (clinical sign-off card, etc.), reach for `<CompletionToggle>` first.
- **BDS publishing is manual today.** After merging a BDS PR, run `npm publish` from the BDS primary worktree. Without this, consumer `npm install` will not pick up the new version. Tracked as a followup (release.yml automation).
- **The IconButton-wrapping-avatar pattern is still load-bearing** for any future "clickable avatar" surface (Batch 6 / 6b). Reuse it. Variant: `ghost`. Size: match the wrapped UserAvatar.
- **Don't trust the audit's "mechanical" labels without measuring first.** Cat 3 #3 was originally framed as "1 site, deferred for pattern decision." Pre-work uncovered: 1 live site that already serves 3 task types (Checklist / Procedure / Compliance) × planned clinical extensions (4.1, 4.5) — promotion was the right call, not "wrap locally because <3 sites."
- **`pr-task.sh` enforces a UI-verification prompt.** Pass `SKIP_UI_CHECK=1` for doc-only branches. Batch C3#3 has a real UI change — visual verification was done in browser, so answer "y" when prompted.
