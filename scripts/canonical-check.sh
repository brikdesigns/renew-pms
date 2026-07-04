#!/usr/bin/env bash
set -euo pipefail

# Canonical BDS token-name gate for renew-pms.
#
# Validates every --text-/--surface-/--background-/--border-/--color-* name
# referenced in src/ against the UNION of two real sources:
#   1. BDS canonical allowlist  — node_modules/@brikdesigns/bds/dist/tokens.css
#   2. renew's declared domain layer — src/styles/theme-renew.css
#
# Uses the shared @brikdesigns/bds/canonical-check engine (no reinvention). A
# name defined in NEITHER file is drift (a typo or an invented token) and fails
# the gate. This is the enforcement renew lacked: token-audit.sh checks
# hardcoded values + component usage, but never validated token *names*.
#
# Exit codes: 0 clean · 1 violations found · 2 bad setup (missing deps/files).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BDS_TOKENS="$ROOT/node_modules/@brikdesigns/bds/dist/tokens.css"
DOMAIN_TOKENS="$ROOT/src/styles/theme-renew.css"
ENGINE="$ROOT/node_modules/@brikdesigns/bds/scripts/canonical-check.mjs"

for f in "$BDS_TOKENS" "$DOMAIN_TOKENS" "$ENGINE"; do
  if [ ! -f "$f" ]; then
    echo "canonical-check: required file missing: ${f#"$ROOT"/}" >&2
    echo "  Run 'npm install' to populate @brikdesigns/bds." >&2
    exit 2
  fi
done

# canonical-check takes a single --allowlist CSS file; union the two real
# sources so a reference is valid iff it's canonical BDS *or* a declared renew
# domain token. Union catches typos in the domain layer too.
COMBINED="$(mktemp)"
trap 'rm -f "$COMBINED"' EXIT
cat "$BDS_TOKENS" "$DOMAIN_TOKENS" > "$COMBINED"

set +e
node "$ENGINE" "$ROOT/src" --allowlist "$COMBINED"
rc=$?
set -e
exit "$rc"
