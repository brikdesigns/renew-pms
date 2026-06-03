#!/usr/bin/env bash
set -euo pipefail
# ============================================================
# Renew PMS — Netlify Ops (READ-ONLY)
# Agent-facing wrapper over the Netlify API + CLI so sessions can
# inspect deploys / functions / scheduled crons / logs without a
# human navigating the Netlify UI.
#
# Reuses the existing token in ~/.secrets/netlify.env (NETLIFY_AUTH_TOKEN).
# NEVER prints the token or any env-var VALUE — only key names + which
# contexts have a value set (boolean), mirroring the UI.
#
# Mutating ops (deploy, env:set, functions:invoke) are intentionally
# NOT here — those stay manual/confirmed. See docs/process/agent-ops-access.md.
#
# Usage:
#   ./scripts/netlify-ops.sh deploys [n]     # recent production deploys (default 8)
#   ./scripts/netlify-ops.sh functions       # registered functions + cron schedules
#   ./scripts/netlify-ops.sh env             # env keys x contexts (names only)
#   ./scripts/netlify-ops.sh status          # site overview
#   ./scripts/netlify-ops.sh fn-logs <name>  # live function log tail (Ctrl-C to stop)
# ============================================================

ACCOUNT="brikdesigns"
SITE_NAME="renew-pms"
SITE_ID="6fd63b41-92d5-485c-9fa8-e79cf6718cd0"   # renew-pms (renew.brikdesigns.com)
API="https://api.netlify.com/api/v1"

set -a; source "$HOME/.secrets/netlify.env" 2>/dev/null || true; set +a
TOK="${NETLIFY_AUTH_TOKEN:-${NETLIFY_ACCESS_TOKEN:-}}"
if [ -z "$TOK" ]; then
  echo "ERROR: no Netlify token. Expected NETLIFY_AUTH_TOKEN in ~/.secrets/netlify.env" >&2
  exit 1
fi

api() { curl -s -H "Authorization: Bearer ${TOK}" "$API/$1"; }

cmd="${1:-help}"

case "$cmd" in
  deploys)
    n="${2:-8}"
    echo "▸ Last $n production deploys for $SITE_NAME"
    api "sites/$SITE_ID/deploys?per_page=30" | python3 -c "
import sys,json
ds=[d for d in json.load(sys.stdin) if d.get('context')=='production'][:${n}]
for d in ds:
    print(f\"  {d.get('created_at')}  state={d.get('state'):<8} branch={d.get('branch')}  skipped={d.get('skipped')}  {(d.get('title') or '')[:60]}\")
"
    ;;

  functions)
    echo "▸ Functions registered on $SITE_NAME (schedule = scheduled/cron function)"
    api "sites/$SITE_ID/functions" | python3 -c "
import sys,json
d=json.load(sys.stdin); fns=d if isinstance(d,list) else d.get('functions',[])
for f in fns:
    print(f\"  {f.get('n') or f.get('name'):<28} schedule={f.get('schedule')}\")
"
    ;;

  env)
    echo "▸ Env keys x deploy contexts (✓ = value set; values never printed)"
    api "accounts/$ACCOUNT/env?site_id=$SITE_ID" | python3 -c "
import sys,json
rows=json.load(sys.stdin)
for r in sorted(rows, key=lambda x: x.get('key','')):
    ctxs=sorted({v.get('context') + ('/'+v['context_parameter'] if v.get('context_parameter') else '')
                 for v in r.get('values',[]) if v.get('value')})
    print(f\"  {r.get('key'):<32} {', '.join(ctxs) if ctxs else '(none set)'}\")
"
    ;;

  status)
    echo "▸ $SITE_NAME site overview"
    api "sites/$SITE_ID" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('  name:        ', d.get('name'))
print('  prod url:    ', d.get('ssl_url') or d.get('url'))
print('  prod branch: ', (d.get('build_settings') or {}).get('repo_branch'))
print('  published:   ', (d.get('published_deploy') or {}).get('created_at'))
print('  state:       ', (d.get('published_deploy') or {}).get('state'))
"
    ;;

  fn-logs)
    name="${2:?usage: netlify-ops.sh fn-logs <function-name>}"
    echo "▸ Live log tail for function '$name' (Ctrl-C to stop). Scheduled fns only log when they run."
    NETLIFY_AUTH_TOKEN="$TOK" netlify logs:function "$name" --site "$SITE_ID"
    ;;

  *)
    sed -n '17,24p' "$0"
    ;;
esac
