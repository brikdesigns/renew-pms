#!/usr/bin/env bash
# install-hooks.sh — Copies tracked hook scripts into .git/hooks/
# Run after cloning or when hooks are updated.
#
# Existing hooks (git-secrets) are preserved — this only adds new hooks.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "Installing git hooks for renew-pms..."

# Pre-push hook (typecheck + build)
cp "$SCRIPT_DIR/git-hooks/pre-push" "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-push"
echo "  ✓ pre-push (typecheck + build)"

echo "Done. Hooks installed to $HOOKS_DIR"
