# Data Access Layer (DAL)

This directory is the **single boundary** between the renew-pms application code and Supabase. Every database read or write that runs on the server should go through a function in this directory.

The DAL is one half of Brik's defense-in-depth for portal authorization. Supabase RLS is the other half — they layer, they don't replace each other.

## Why the DAL exists

`brik-llm#544` (the portal data-access audit) found 104 Supabase constructor callsites and 211 direct `.from()` queries scattered across renew-pms, plus the `proxy.ts` middleware doing session-refresh + redirect-to-login only — no authorization beyond signed-in/out. RLS is the structural defender; the DAL is the application-layer reinforcement.

Compared to brik-client-portal, renew-pms's starting posture is materially cleaner: **1 runtime file uses service-role** (`src/lib/supabase/admin.ts`, properly centralized). No server actions. The DAL migration here is mostly mechanical — moving query bodies into authorized DAL functions, returning DTOs.

## The contract every DAL function must honor

```ts
import 'server-only';

import { getAuthUser } from './auth';
import { createClient } from '@/lib/supabase/server';

export async function getXxxDTO(...): Promise<XxxDTO | null> {
  // 1. Authenticate the current user.
  const auth = await getAuthUser();
  if (!auth) return null;          // (or throw, depending on caller contract)

  // 2. Authorize — can THIS user see/touch THIS row?
  if (!canSeeXxx(auth, ...)) return null;

  // 3. Construct an RLS-respecting client (anon-key — default path).
  //    Only fall back to service-role inside explicit admin DAL functions.
  const supabase = await createClient();

  // 4. Query.
  const { data } = await supabase.from('xxx').select(...).single();
  if (!data) return null;

  // 5. Return a DTO — minimal fields, class instance (not the raw row).
  return new XxxDTO(data.id, data.display_name, /* ... */);
}
```

## DTO pattern — class instances

renew-pms DAL DTOs are **class instances**, not plain TypeScript objects. The Next.js team's reasoning ([official guide](https://nextjs.org/blog/security-nextjs-server-components-actions#data-access-layer)) is that class instances **fail RSC serialization for non-passable fields** — so if anyone accidentally passes a DTO that wasn't designed for the client to a Client Component, the build or runtime catches it.

```ts
export class PatientDTO {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly practiceId: string,
  ) {}
}
```

Rules:

- `readonly` on every field — DTOs are immutable.
- `class`, not `interface` or `type` — the RSC boundary protection depends on the value being a class instance.
- No methods on the DTO that touch the DB (those are DAL functions). DTOs may carry pure derived getters if the derivation is cheap and side-effect-free.
- No nested raw rows. Each DTO owns its shape end-to-end.

## Service-role usage

Per the audit, renew-pms currently has **1 runtime file** using `SUPABASE_SERVICE_ROLE_KEY` (`src/lib/supabase/admin.ts`). That file is already the right shape — a centralized admin-client constructor. The DAL migration keeps it; callers move into `src/lib/data/<entity>.ts` so the authorization check happens at the DAL boundary, not at the caller's discretion.

Inside `src/lib/data/`, service-role is allowed **only** for functions that explicitly need cross-tenant reach (admin operations, system-triggered workflows, cron-secret-authed routes). Every service-role DAL function must:

1. State its trust assumption in a comment at the top (who is allowed to call this, and why).
2. Re-authorize the caller before constructing the service-role client (except for cron routes which use the `CRON_SECRET` Bearer pattern documented in `proxy.ts`).
3. Return a DTO scoped to what the caller is authorized to see (not just "everything the DB returned").

```ts
// Service-role DAL function — REQUIRES platform-admin caller.
// Trust assumption: the route that calls this has already verified the caller is brik_admin.
//                   This function re-verifies inside the body — never trust the caller.
export async function getAllPracticesAdminDTO(): Promise<PracticeDTO[]> {
  const auth = await getAuthUser();
  if (!auth || !isPlatformAdmin(auth)) throw new Error('Forbidden');

  // ... service-role client construction + query + DTO mapping
}
```

## Where DAL functions live

One file per entity. Likely shape for renew-pms (confirmed by the entity audit at migration time):

```
src/lib/data/
  auth.ts                  # re-exports of the auth helpers (this file)
  practice.ts              # practice + membership reads
  user.ts                  # user profile + invitation reads
  patient.ts               # PHI-adjacent data (highest blast — healthcare PII)
  appointment.ts           # scheduling
  task.ts                  # task management (the 6 RPC calls live here)
```

DTOs live in the same file as the DAL function that returns them. If a DTO is shared by multiple entities, extract to `src/lib/data/_dtos.ts` (prefixed with underscore — internal).

## Out of scope for the DAL

- **Cron routes (`/api/cron/*`)**: authenticate via shared-secret Bearer token (`CRON_SECRET`), not user session — exempt per `proxy.ts` public-route list. They have their own auth model and stay out of the DAL.
- **One-off scripts (`scripts/`)**: operator-driven ops scripts; not on the user-request path. They use service-role directly, as today.
- **Migration scripts (`scripts/migration/`)**: out of scope; one-shot migration code.

## What lives where today (and where the audit found it)

See [`brik-llm/operations/security/portal-dal-audit/renew-pms.md`](https://github.com/brikdesigns/brik-llm/blob/main/operations/security/portal-dal-audit/renew-pms.md) for the per-file audit findings:

- 104 Supabase constructor callsites
- 211 direct `.from()` queries
- 6 `.rpc()` calls
- 5 `SUPABASE_*` env reads
- 1 runtime service-role file (`src/lib/supabase/admin.ts`)
- 0 `"use server"` action files
- `src/proxy.ts` does session-refresh + redirect-to-login only

## Cross-references

- Issue: `brikdesigns/renew-pms#321` (this portal's DAL adoption)
- Umbrella: `brik-llm#543` (DAL across all Brik portals)
- Audit: `brik-llm#544` (`operations/security/portal-dal-audit/renew-pms.md`)
- Sibling: `brikdesigns/brik-client-portal#856` (primary portal, much larger refactor; same pattern applied here)
- supabase-workflow skill — practice-scoped query patterns the DAL must honor
- Next.js team's guide: <https://nextjs.org/blog/security-nextjs-server-components-actions>
