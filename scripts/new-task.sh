#!/usr/bin/env bash
# new-task.sh — Create an isolated git worktree for a single task.
#
# Branches from origin/$BASE_BRANCH (default: staging — we're pre-launch).
# Enforces task/{scope}-{name} naming. Installs dependencies in the worktree.
#
# At go-live, change the BASE_BRANCH default below to "main" and update
# the Branch Workflow section in CLAUDE.md to match.
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

# ── Base branch (pre-launch default: staging; flip to main at go-live) ──
BASE_BRANCH="${BASE_BRANCH:-staging}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Resolve repo root ──
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$(dirname "$PROJECT_ROOT")/renew-pms-worktrees"

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
echo -e "${YELLOW}▸ Installing dependencies (npm ci --prefer-offline)...${NC}"
npm ci --prefer-offline 2>&1 | tail -1

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
echo "  When done:"
echo "    git diff ${BASE_BRANCH}..${BRANCH_NAME}   # review changes"
echo "    gh pr create --base ${BASE_BRANCH}         # open PR"
echo ""
