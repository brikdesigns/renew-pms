#!/usr/bin/env bash
# new-task.sh — Create an isolated git worktree for a single task.
#
# Always branches from origin/main. Enforces task/{scope}-{name} naming.
# Initializes BDS submodule and installs dependencies in the new worktree.
#
# Usage:
#   ./scripts/new-task.sh {scope}-{name}
#   ./scripts/new-task.sh renew-task-templates
#   ./scripts/new-task.sh renew-vendor-portal
#
# Creates:
#   ../renew-pms-worktrees/{scope}-{name}/   on branch  task/{scope}-{name}
#
# Requirements:
#   - Must be run from the repo root.
#   - Requires a clean working tree (no uncommitted changes).

set -euo pipefail

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

# ── Fetch and branch from main ──
echo -e "${YELLOW}▸ Fetching latest main...${NC}"
git fetch origin main --quiet

echo -e "${YELLOW}▸ Creating worktree at ${WORKTREE_BASE}/${TASK_NAME}...${NC}"
mkdir -p "$WORKTREE_BASE"
git worktree add "${WORKTREE_BASE}/${TASK_NAME}" -b "${BRANCH_NAME}" origin/main

# ── Init BDS submodule ──
echo -e "${YELLOW}▸ Initializing BDS submodule...${NC}"
cd "${WORKTREE_BASE}/${TASK_NAME}"
git submodule update --init --recursive

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
echo "  Based on:  origin/main"
echo ""
echo "  Next steps:"
echo "    cd ${WORKTREE_BASE}/${TASK_NAME}"
echo "    claude -p \"Task: ... Follow CLAUDE.md rules.\""
echo ""
echo "  When done:"
echo "    git diff main..${BRANCH_NAME}   # review changes"
echo "    gh pr create --base main         # open PR"
echo ""
