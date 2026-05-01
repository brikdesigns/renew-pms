---
status: stable
owner: nick
last-updated: 2026-04-27
canonical-naming-rules: https://design.brikdesigns.com/docs/primitives/naming-conventions
related: ./component-cleanup-audit.md
---

# Cleanup workflow

How we run system-cleanup work in renew-pms — component misuse, naming drift, token drift, and any other "code that built up before the rule existed." Audit-first, batched-PR, with a clear handoff to BDS for promotion candidates.

This is a workflow standard. Use it when the cleanup spans more than one or two files. For a single drive-by fix, follow the standard "fix it while you're already in the file" rule from CLAUDE.md.

## When to trigger a cleanup audit

Any of these signals → start an audit, do not start patching:

1. **Visible misuse caught in review.** A screenshot shows a `<button>` wrapping an entire row, a hand-rolled tab bar, a hand-rolled segmented control, raw `<a>` styled like a card. The instinct is to fix the one occurrence. Don't — search the codebase first.
2. **A new BDS rule lands** ("never export `CSSProperties` for interactive elements," "always use `font.family.heading` only with sizes ≥ 18px"). The rule is forward-looking; the existing code base already violates it in unknown places. Catalog the existing violations before adding the rule.
3. **Naming-conventions doc updates.** Renames (`heading` → `title` BEM slot, `dark/light` → `solid/subtle/outline`, etc.) need to be inventoried, not opportunistically renamed.
4. **A pattern repeats by accident.** Three or more places independently rolled the same thing (e.g. inline drill-down link styling, hand-built segmented controls). That's a BDS promotion candidate, not a cleanup target — but the audit is what surfaces it.
5. **Pre-launch debt sweep.** Before any major release boundary, run a fresh audit to make sure the rule corpus and the code corpus actually match.

If the trigger is just "I noticed one thing while editing" → do not start an audit. Fix it inline per CLAUDE.md's drive-by rule.

## The audit document

Lives at `docs/qa/<topic>-cleanup-audit.md`. Examples: `component-cleanup-audit.md`, `token-cleanup-audit.md`. Each audit owns one topic — do not mix component and token findings in the same doc.

### Required structure

```
---
status: in-progress | resolved | archived
owner: <person>
last-updated: <YYYY-MM-DD>
canonical-rules: <URL or path to the rule doc the audit measures against>
related: <other docs>
---

# <Topic> cleanup audit

<one-paragraph why-this-exists>

## Guiding rules
<extracted, citation-style summary of the canonical rule doc — so the audit
remains usable when the canonical doc rotates. Do not paraphrase loosely.>

## Findings — N violations across M categories
<each category numbered, each violation listed with file_path:line_number
and a one-line snippet. Cap visible examples at 30 per category but report
the total count. Group by class of fix, not by file.>

## Pattern grouping → BDS promotion candidates
<which findings collapse into reusable patterns; which patterns already
have BDS coverage (straight swap) vs. which need new BDS components.>

## Triage — proposed batched PRs
<one row per PR, ordered by leverage and conflict risk. Smallest /
no-design-decision batches go first, BDS-promotion batches go last.>

## What this audit does not cover
<explicit out-of-scope list so future readers know which other audits to
look at instead.>

## Re-running the audit
<the actual grep/script recipes used. Counts go stale; the recipes are
how you refresh them.>
```

### Counting and citing violations

- **Always include `file_path:line_number`.** A category count without locations is useless — the next person can't verify it. Use markdown links so the reader can click through: `[file.tsx:123](../../src/file.tsx#L123)`.
- **Cap visible examples at 30 per category.** Above that, the audit becomes unreadable. Always report the total count even when capping.
- **Group by class of fix, not by file.** "27 raw `<button>` elements" is the actionable unit; "12 violations in `EditTemplateSheet.tsx`" is not.
- **Note when a single fix resolves multiple categories.** E.g., a `<button style={linkStyle}>` resolves both Cat 8 (CSSProperties export) and Cat 2b (raw `<button>`) in one swap. Cross-reference both.

## Pattern grouping — when to promote to BDS

Per CLAUDE.md "no speculative abstractions": three places with similar code is the threshold to promote.

For each cluster of findings, ask in order:

1. **Does BDS already cover this?** Query Storybook MCP first. If yes → straight swap, schedule as a no-design-decision batch.
2. **Does BDS provide only a CSS class, not a component?** Some BDS surfaces ship a class (e.g. `bds-sheet__nav-link` in `Sheet.css`) that the consumer applies to a raw element. This is a **legitimate BDS-sanctioned pattern** — the class lives in `@brikdesigns/bds/dist/styles.css` and changes to themed tokens propagate to consumers. The audit script's raw-`<button>` / raw-`<a>` rules whitelist these classes (e.g. `token-audit.sh` line 82). When you find a finding that turns out to be this pattern, mark it **resolved-as-acceptable** in the audit doc — don't promote a wrapping component for verbosity reduction alone unless ≥3 sites would benefit. Found in Batch 5 (PR #67): the 6 `ViewRequestSheet` "Cat 2b" sites turned out to consume `bds-sheet__nav-link` and needed no code change.
3. **Is this an unnamed primitive that we're hand-rolling everywhere?** ("Inline drill-down link," "interactive list row with avatar + title + subtitle + trailing badge.") If yes and it appears in ≥3 surfaces → BDS promotion candidate. Schedule as a cross-repo PR pair (BDS first, then renew-pms swap).
4. **Is this a one-off that just got out of hand?** Then fix in place — don't promote. Three similar lines is fine; abstraction is the worse outcome.

Promotion candidates need:
- A short proposed API in the audit doc (3–5 props, the typical JSX usage).
- A note on Figma spec / design alignment status. **Never promote without checking the Figma source first** (per `feedback_never_invent_ui`).

## Batched-PR rules

The cleanup pattern is **one branch = one batch of fixes that share the same shape**. Mixing patterns into one branch causes conflicts with feature work and makes review hard.

### Batch ordering — leverage and conflict-risk

Order from cheapest-and-safest to most-design-heavy:

1. **Dead code removal.** Findings that are exports nobody uses, helpers nobody calls. Pure deletion. No design decisions.
2. **Straight BDS swaps.** Replace raw `<button>` / `<a>` with existing BDS components. Mechanical change, but visual diffs need a glance per call site.
3. **Token / family fixes.** Wrong `font.family.*` paired with wrong size, etc. Mechanical, no design decisions.
4. **BDS-coverage-confirmation batches.** Need to query Storybook MCP first to confirm the right component exists before swapping.
5. **Pattern-decision batches.** Cluster of findings where the right BDS variant isn't obvious — needs a design call (e.g., "do inline drill-down links use `Button variant=ghost` or do we promote a new `InlineLink`?").
6. **BDS-promotion batches.** Cross-repo PR pairs — promote the new BDS component first, then swap call sites in renew-pms.

### Branch naming

```
task/<topic>-cleanup-<batch>
```

Examples:
- `task/bds-cleanup-css-properties` — Category 8 of the component audit.
- `task/bds-cleanup-toolbar-buttons-2c` — Category 2c (toolbar / chrome buttons).
- `task/token-cleanup-heading-family-misuse` — Category 6 of a token audit.

Use the `bds` scope for cleanup that touches BDS adoption; the `docs` scope for the audit doc PR itself. The number/letter suffix matches the audit doc's category index so the PR description can link back.

### One-branch-one-batch in practice

- Do not mix categories in one branch. Even if "while you're in there" feels efficient, the conflicts and review cost are worse.
- Do not bundle "fix" + "BDS promotion" in one branch. The promotion is a separate cross-repo deliverable.
- Do bundle multiple call sites of the same fix shape — that's the whole point of batching. (e.g., 8 instances of the same swap = 1 branch.)
- If a batch reveals a sub-category that needs a different decision, commit what you've done, ship it, and follow up with a new branch. Don't widen scope mid-flight.

### Visual verification

Per CLAUDE.md "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete." For cleanup batches:

- For each call site changed, verify the surface in a browser.
- Use Playwright MCP for screen-by-screen checks. Document any visual changes in the commit message and PR description — especially when adopting BDS spec produces a different look than the previous custom styling. Do not silently change the visual.
- If the BDS spec produces a usability regression (e.g., link affordance lost), call it out in the PR description and schedule a follow-up batch — do not revert to the custom styling.

## Audit lifecycle

```
trigger detected
  ↓
audit doc authored (status: in-progress)
  ↓
batch PRs land in order, each updating audit's per-category count
  ↓
when all categories drop to 0:
  status: resolved → fold into launch-checklist as a closed line item
  ↓
later: status: archived once the underlying rule has been stable for ≥1 release
```

The audit doc is **not** a one-shot deliverable. Treat it as a living workplan that contracts as batches land.

### Updating the audit per batch

Each batch PR should include a small audit-doc update commit:

- Decrement the violation count for the relevant category.
- Cross out / strikethrough the resolved file:line entries (don't delete — preserves history of what got fixed when).
- If the batch revealed a new category, add it to the doc and recompute totals.

Once a category drops to 0, mark it `### Category N — RESOLVED (was N violations)` and leave the section in for traceability.

## Refreshing the canonical rules

Audits are anchored to a canonical rule doc (Storybook naming-conventions, BDS healthcare-ada, repo CLAUDE.md). When the rule doc changes:

1. Update the audit doc's "Guiding rules" section to match.
2. Re-run the grep recipes — the rule change may surface new violations.
3. Update counts, schedule new batches if needed.

Conversely, when an audit batch reveals a rule that is missing from CLAUDE.md or the canonical doc:

1. Land the batch first (don't block on rule-doc PRs).
2. Open a follow-up PR to add the rule to CLAUDE.md or escalate to the BDS naming-conventions doc.
3. Cross-reference the rule-doc PR from the audit doc.

The two corpuses (rules + code) should always converge — the audit is the diff between them.

## Cross-repo coordination

When a batch involves a BDS promotion:

1. **Open the BDS PR first.** Land the new BDS component on `brik-bds@main` and publish a new package version.
2. **Bump `@brikdesigns/bds` in renew-pms** in a separate, tiny PR — never bundle the bump with consuming code.
3. **Then open the renew-pms swap PR**, importing the new component.

Do not author renew-pms code that imports a component that doesn't exist on the published package yet. The build will pass locally (via the worktree's `node_modules`) and break in CI / on the next clone.

## Trigger-to-PR checklist

Use this when you spot a cleanup signal:

- [ ] Searched the codebase to confirm scope (≥3 occurrences) before deciding it's an audit-class problem.
- [ ] Authored or updated the relevant `docs/qa/<topic>-cleanup-audit.md`.
- [ ] Categorized findings by class of fix, with file:line citations and total counts.
- [ ] Identified BDS-coverage status per pattern (straight swap / decision needed / promotion candidate).
- [ ] Drafted the triage table — ordered by leverage and conflict risk.
- [ ] Started Batch 1 in `task/<topic>-cleanup-<batch>` from `staging` via `./scripts/new-task.sh`.
- [ ] Visually verified each touched surface in a browser.
- [ ] Updated the audit doc's per-category count in the same PR (or in a sibling docs PR).
- [ ] Called out any visual changes in the PR description.

## What this workflow is not

- **Not for one-off bugs.** A single broken interaction → fix it inline, no audit needed.
- **Not for feature work.** New features follow the regular branch workflow.
- **Not a substitute for design review.** Pattern-decision batches and BDS-promotion batches need design alignment before code lands. The audit surfaces the question; design answers it.
- **Not bypassed by "while I'm in there."** Per CLAUDE.md's flag-don't-fix rule: cross-cutting cleanup found mid-feature gets logged in the audit, not patched on the feature branch.
