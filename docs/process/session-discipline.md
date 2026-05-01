# Session Discipline — renew-pms

**Audience:** any agent or human running a Claude Code session against this repo. Migrated from CLAUDE.md per markdown IA framework §3 (decision tree → process docs live in `docs/process/`) so the always-loaded CLAUDE.md prose stays pithy.

These rules prevent the two most common failure modes: forgotten commits and scope drift.

> **Cross-cutting changes & scope discipline:** See cross-repo CLAUDE.md (`~/Documents/GitHub/CLAUDE.md`) § Agent scope discipline. The rules there are mandatory and override any temptation to "fix it while I'm here."

## Session start (enforced by `scripts/session-guard.sh` PreToolUse hook)

1. **The hook runs automatically** on your first Edit/Write of the session. If there are uncommitted changes from a prior session, it prints a warning with `git status --short` output.
2. **Resolve before proceeding.** Commit, stash, or discard prior changes. Do not start new work on top of orphaned changes — that's how mixed commits happen.
3. **Declare scope.** State what this session will accomplish in one sentence before writing code. Apply the one-sentence test: if you can't describe it without "and," split it into separate branches.
4. **Check active worktrees.** Run `git worktree list` to see what other agents are working on. If another worktree touches the same files as your scope, coordinate — don't proceed blindly.

## During the session

1. **One concern at a time.** Don't mix feature work, debugging, and docs in the same uncommitted state. If you need to context-switch (e.g., fix a bug discovered while building a feature), commit the feature WIP first.
2. **Commit at each stable checkpoint.** After completing a logical unit (new component, migration, route wiring), commit immediately. Don't accumulate changes for a single big commit.
3. **No scope drift without a commit.** If the task expands (e.g., "this also needs a new API route"), commit everything completed so far before starting the expansion.
4. **Flag, don't fix, cross-cutting issues.** If you notice a widespread pattern problem (wrong button sizes, raw hex values, missing tokens) while working on a feature, log it in the PR description or memory. Do NOT fix it on this branch — it will conflict with every other branch. When a flag matures into a real cleanup pass (≥3 occurrences, or a new BDS rule landed), follow [`docs/qa/cleanup-workflow.md`](../qa/cleanup-workflow.md) — audit-first, batched-PR, with explicit BDS-promotion handoff.

## Session end

1. **Nothing uncommitted.** Before ending a session, all changes must be committed. Zero tolerance — the working tree must be clean.
2. **Verify with `git status`.** Explicitly check. Don't assume.
3. **Don't push unless asked.** Commits are free; pushes trigger builds and cost deploy credits.

## Guardrails in place

| Guard | Type | What it does |
| ----- | ---- | ------------ |
| [`scripts/session-guard.sh`](../../scripts/session-guard.sh) | Claude Code PreToolUse hook | Warns on first edit if working tree is dirty |
| `.git/hooks/pre-push` | Git pre-push hook | Blocks push if `typecheck` or `build` fails |
| `.git/hooks/pre-commit` | Git pre-commit hook | Runs `git-secrets` to prevent credential leaks |
| [`scripts/token-audit.sh`](../../scripts/token-audit.sh) | Manual (run before PRs) | Catches 14 categories of token/component violations |
