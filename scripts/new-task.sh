#!/usr/bin/env bash
# new-task.sh — Create an isolated git worktree for a single task.
#
# Branches from origin/$BASE_BRANCH (default: staging — the integration
# branch in our post-launch two-environment model; main = production).
# Enforces task/{scope}-{name} naming. Installs dependencies in the worktree.
#
# Day-to-day work branches from staging and promotes staging → main per
# docs/process/release-runbook.md. See CLAUDE.md § Branch model.
#
# Usage:
#   ./scripts/new-task.sh {scope}-{name}
#   BASE_BRANCH=main ./scripts/new-task.sh infra-some-thing   # one-off override
#
# Creates:
#   ../renew-pms-worktrees/{scope}-{name}/   on branch  task/{scope}-{name}
#
# Requirements:
#   - Must be run from the repo root.
#   - Requires a clean working tree (no uncommitted changes).

set -euo pipefail

# ── Base branch (integration branch = staging; main = production) ──
BASE_BRANCH="${BASE_BRANCH:-staging}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Resolve repo root ──
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$(dirname "$PROJECT_ROOT")/renew-pms-worktrees"

# ── Must run from the primary worktree on a base branch ──
# Running new-task.sh from inside another task worktree creates nested state
# that breaks the one-worktree-per-task contract. The primary worktree is
# the one place the base branch is meant to live — if it's on a task/*
# branch, something else already broke. See scripts/worktree-guard.sh for
# the full rationale and the 2026-04-21 BDS Phase B incident.
PRIMARY_PATH="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
if [ "$PROJECT_ROOT" != "$PRIMARY_PATH" ]; then
  echo -e "${RED}Error: new-task.sh must be run from the primary worktree.${NC}"
  echo ""
  echo "  Here:    $PROJECT_ROOT"
  echo "  Primary: $PRIMARY_PATH"
  echo ""
  echo "  cd into the primary worktree first:"
  echo "    cd $PRIMARY_PATH && ./scripts/new-task.sh $*"
  exit 1
fi

PRIMARY_BRANCH="$(git -C "$PRIMARY_PATH" branch --show-current || echo '(detached)')"
case "$PRIMARY_BRANCH" in
  main|staging) ;;
  *)
    echo -e "${RED}Error: primary worktree is on '${PRIMARY_BRANCH}', not a base branch.${NC}"
    echo ""
    echo "  The primary worktree at $PRIMARY_PATH must stay on ${BASE_BRANCH} (or main)."
    echo "  Task work lives in ../renew-pms-worktrees/{slug} — never in the primary."
    echo ""
    echo "  To fix:"
    echo "    cd $PRIMARY_PATH"
    echo "    git status                  # inspect any uncommitted work"
    echo "    git switch ${BASE_BRANCH}   # return to the base branch"
    exit 1
    ;;
esac

# ── Validate input ──
if [ $# -lt 1 ]; then
  echo -e "${RED}Usage: $0 {scope}-{name}${NC}"
  echo ""
  echo "  scope = feature area (renew, auth, tasks, training, vendor, bds, docs)"
  echo "  name  = what the task delivers (task-templates, vendor-portal)"
  echo ""
  echo "  Example: $0 renew-task-templates"
  exit 1
fi

TASK_NAME="$1"
BRANCH_NAME="task/${TASK_NAME}"

# ── Validate naming convention ──
if [[ ! "$TASK_NAME" =~ ^[a-z]+-[a-z0-9]+ ]]; then
  echo -e "${RED}Error: Task name must follow {scope}-{name} pattern.${NC}"
  echo ""
  echo "  Got:      $TASK_NAME"
  echo "  Expected: {scope}-{name}  (e.g., renew-task-templates, auth-session-fix)"
  echo ""
  echo "  Valid scopes: renew, auth, tasks, training, vendor, bds, docs, infra"
  exit 1
fi

# ── Check for clean working tree ──
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Error: Working tree is dirty. Commit or stash changes first.${NC}"
  echo ""
  git status --short
  exit 1
fi

# ── Check branch doesn't already exist ──
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  echo -e "${RED}Error: Branch '${BRANCH_NAME}' already exists.${NC}"
  echo ""
  echo "  To resume:  cd ${WORKTREE_BASE}/${TASK_NAME}"
  echo "  To delete:  git branch -d ${BRANCH_NAME}"
  exit 1
fi

# ── Fetch and branch from base ──
echo -e "${YELLOW}▸ Fetching latest ${BASE_BRANCH}...${NC}"
git fetch origin "${BASE_BRANCH}" --quiet

echo -e "${YELLOW}▸ Creating worktree at ${WORKTREE_BASE}/${TASK_NAME}...${NC}"
mkdir -p "$WORKTREE_BASE"
git worktree add "${WORKTREE_BASE}/${TASK_NAME}" -b "${BRANCH_NAME}" "origin/${BASE_BRANCH}"

cd "${WORKTREE_BASE}/${TASK_NAME}"

# ── Install dependencies ──
# `op run` authenticates via OP_SERVICE_ACCOUNT_TOKEN, which is scoped to the
# `claude-agent` shell alias only. A non-interactive / headless invocation
# (e.g. on brik-mini) inherits no account and op run fails with "No accounts
# configured for use with 1Password CLI". Fall back to the sanctioned
# service-account env file before invoking op run.
# See brik-llm/operations/security/op-run-migration.md (Resolved question #3).
if [ -z "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
  for sa_env in "$HOME/.secrets/op-service-account.env" "$HOME/.secrets/onepassword.env"; do
    if [ -f "$sa_env" ]; then
      echo -e "${YELLOW}▸ OP_SERVICE_ACCOUNT_TOKEN not in env — sourcing ${sa_env}${NC}"
      set -a
      # shellcheck disable=SC1090  # machine-dependent path, resolved at runtime
      . "$sa_env"
      set +a
      break
    fi
  done
fi
if [ -z "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
  echo -e "${RED}Error: OP_SERVICE_ACCOUNT_TOKEN unavailable and no service-account env file found.${NC}"
  echo ""
  echo "  Run new-task.sh from the claude-agent shell alias, or create the"
  echo "  service-account env file (~/.secrets/op-service-account.env on the Mini)."
  echo "  See brik-llm/operations/security/op-run-migration.md (Resolved question #3)."
  exit 1
fi

echo -e "${YELLOW}▸ Installing dependencies (op run -- npm ci --prefer-offline)...${NC}"
op run --env-file=.env.op -- npm ci --prefer-offline 2>&1 | tail -1

# ── Copy .env.local from primary ──
# .env.local is git-ignored and not tracked by `git worktree add`, so a fresh
# worktree starts without it. Without these vars the dev server crashes on
# Supabase init and the husky pre-push hook fails (the integration test setup
# in tests/integration/_setup.ts asserts NEXT_PUBLIC_SUPABASE_URL +
# SUPABASE_SERVICE_ROLE_KEY are present).
if [ -f "${PRIMARY_PATH}/.env.local" ]; then
  cp "${PRIMARY_PATH}/.env.local" "${WORKTREE_BASE}/${TASK_NAME}/.env.local"
  echo -e "${YELLOW}▸ Copied .env.local from primary${NC}"
else
  echo -e "${YELLOW}▸ No .env.local in primary — skipping env copy${NC}"
fi

# ── Summary ──
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Task worktree ready (renew-pms)${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "  Branch:    ${BRANCH_NAME}"
echo "  Worktree:  ${WORKTREE_BASE}/${TASK_NAME}"
echo "  Based on:  origin/${BASE_BRANCH}"
echo ""
echo "  Next steps:"
echo "    cd ${WORKTREE_BASE}/${TASK_NAME}"
echo "    claude -p \"Task: ... Follow CLAUDE.md rules.\""
echo ""
echo "  When done (REQUIRED — branches without PRs rot):"
echo "    git diff ${BASE_BRANCH}..${BRANCH_NAME}   # review changes"
echo "    ./scripts/pr-task.sh             # push + create PR (mandatory)"
echo ""
