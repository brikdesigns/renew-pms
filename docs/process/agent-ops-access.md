# Agent ops access — Netlify & Supabase

Lets Claude Code sessions inspect our operational platforms (deploys, functions,
scheduled crons, logs, DB) **directly**, instead of a human navigating the
Netlify/Supabase dashboards and pasting results back. Added 2026-06-03.

## What's wired

| Surface | Native (MCP) | Scripted (Bash) | Credential |
|---|---|---|---|
| **Netlify** | `netlify` MCP (`@netlify/mcp`) | `scripts/netlify-ops.sh` (read-only) | `~/.secrets/netlify.env` → `NETLIFY_AUTH_TOKEN` |
| **Supabase** | `supabase` MCP (`@supabase/mcp-server-supabase`, **`--read-only`, staging-pinned**) | `scripts/db-health.sh` (read-only, both envs) | `~/.secrets/supabase.env` → `SUPABASE_ACCESS_TOKEN` |

Both MCP servers are declared in [`.mcp.json`](../../.mcp.json). They source the
secret file at launch via a `bash -c` wrapper, so **no token is ever stored in a
tracked file** and they work on the headless brik-mini session. Restart / reconnect
Claude Code after pulling this change for the MCP servers to load.

## Quick reference

```bash
./scripts/netlify-ops.sh status        # prod url, branch, last publish
./scripts/netlify-ops.sh functions     # registered functions + cron schedules
./scripts/netlify-ops.sh deploys 8     # recent production deploys
./scripts/netlify-ops.sh env           # env keys x contexts (names only, no values)
./scripts/netlify-ops.sh fn-logs cron-daily-tasks   # live log tail
./scripts/db-health.sh --prod          # read-only prod DB health
```

Supabase SQL / schema / logs: use the `supabase` MCP tools (read-only). Prod
reads beyond that path go through the Management API (`api.supabase.com/.../database/query`)
as `db-health.sh` does.

## Security model — read by default, writes are gated

The allowlist in [`.claude/settings.json`](../../.claude/settings.json) auto-approves
**only read-only** ops (`netlify-ops.sh`, `db-health.sh`, `netlify logs/status/deploys/functions:list`,
and the read-only `supabase` MCP). Everything that mutates state still prompts:

- **Netlify writes** — `netlify deploy`, `netlify env:set`, `netlify functions:invoke`,
  and the `netlify` MCP's write tools (deploy/env). Not allowlisted → prompt every time.
- **Supabase prod writes** — the MCP is `--read-only` and pinned to **staging**
  (`zneuygoeorhkuhktmuld`). Any prod (`bbuimkdpmuggrszwenmg`) mutation requires an
  explicit, confirmed Management-API call — never silent. (HIPAA: prod holds PHI.)

This mirrors the standing rule: agents own *diagnosis* end-to-end; *changes* to
prod or platform config get human confirmation first.

## Extending

To grant an agent a specific mutating command without a blanket open-up, add the
exact command to `permissions.allow` in `.claude/settings.json` (project-wide) or
`.claude/settings.local.json` (this machine only). Keep prod-write and
deploy/env-mutation commands out of the committed allowlist.

## Token provenance

Tokens live in `~/.secrets/*.env` + 1Password (see
`brik-llm/operations/security/repo-token-map.md`). The Netlify token is a personal
access token (account `brikdesigns`); the Supabase token is account-level (works for
staging + prod — which is exactly why the MCP is read-only/staging-pinned). Rotate via
`brik-secrets`; never commit, never paste in chat.
