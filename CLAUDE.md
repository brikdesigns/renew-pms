# Renew PMS — Claude Code Instructions

## Project Overview

Dental practice management and training platform (vertical SaaS).
Multi-tenant architecture with practice-scoped data isolation.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Auth:** Supabase Auth (email/password, middleware-based session refresh)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **UI:** Brik Design System (BDS) submodule + Tailwind CSS 3 + Radix UI
- **Email:** Resend (transactional)
- **Icons:** FontAwesome 7
- **Error Tracking:** Sentry
- **Hosting:** Netlify
- **Testing:** Vitest

## Business Context

- Built for a single dental practice client initially; validated before going to market
- Client pays Brik via brik-client-portal — no in-app billing (Stripe deferred)
- Staff-only back office tool — no patient-facing features in V1
- Brik provisions practices; practice admins invite staff (no self-serve signup)

## Architecture

### Multi-tenancy

- Practices are isolated via `practice_members` join table + RLS on every table
- `practices.reseller_id` nullable — reserved for future white-label/reseller pivot
- `practices.integrations` jsonb — per-practice API config (Trainual key, GDrive folder); server-side only

### Role model (two layers — keep these distinct)

- **System role** (`profiles.system_role`) — controls permissions (what you can DO)
  - `platform_admin` → Brik staff; full access across all practices
  - `practice_admin` → manages their practice; invites staff, configures settings
  - `staff` → standard team member; scoped to their practice data
- **Practice role** (`practice_members.practice_role_id → practice_role_types`) — job function (what you ARE)
  - e.g. Owner, Office Manager, Dental Hygienist, Receptionist
  - Department is tied to the role type, not the individual member
  - Renameable, addable per practice — never hardcode these values in app logic

### Reference tables (user-renameable — never hardcode values in app logic)

- `departments` — Clinical, Front Desk, Engineering, HR, Administration, Sterilization, Global
- `practice_role_types` — dental job functions, seeded per practice
- `task_types` — Checklist, Procedure, Compliance, Skill Training, Onboarding, Request
- `task_categories` — Cleaning, Equipment, Maintenance, Compliance/Safety, Patient Care, Training, Administrative
- `compliance_types` — OSHA, HIPAA, Infection Control, Radiation Safety, Fire Safety, Emergency Preparedness
- `equipment_categories` — Dental Chair, Autoclave, X-Ray Machine, Handpieces, etc.
- `supply_categories` — Instruments, PPE, Disposables, Autoclave Bags, etc.

### Enum fields (app logic depends on these — not user-renameable)

- `profiles.system_role` — platform_admin | practice_admin | staff
- `practice_members.employee_status` — new | maturing | active (drives Trainual sync + task personalization)
- `practice_members.shift` — opening | closing | evening | full_day (nullable — optional)
- `tasks.status` — not_started | in_progress | awaiting_approval | completed | blocked | skipped | overdue
- `tasks.priority` — low | medium | high | critical
- `tasks.frequency` — daily | weekly | bi_weekly | monthly | quarterly | semi_annually | annually | per_shift | custom
- `equipment.status` — active | needs_service | out_of_service

### Location model (scales to multi-location practices)

- `offices` — physical buildings (practice has one or more)
- `rooms` — spaces within an office (Operatory, Sterilization Room, X-Ray Room, etc.)
- Rooms are seeded with dental defaults per office; `is_custom = true` for practice-added rooms

### Task context (nullable FKs — a task may relate to a location, asset, or supply)

- `tasks.room_id` → rooms
- `tasks.equipment_id` → equipment
- `tasks.supply_category_id` → supply_categories
- `tasks.assigned_to` → practice_members
- `tasks.assigned_department` → departments

### Provisioning

- `seed_practice_defaults(practice_id, office_id)` — seeds all reference tables with dental defaults
- Called by Brik when provisioning a new practice

### BDS

- Submodule at `./brik-bds/` — import via `@bds/components` and `@bds/tokens`
- Token system: `src/lib/tokens.ts` (CSS var refs) + `src/lib/styles.ts` (composed presets)
- Never hardcode hex colors or px values — always use BDS tokens

## Integrations

### Trainual (staff training + onboarding source of truth)

- API docs: [trainual.docs.apiary.io](https://trainual.docs.apiary.io/)
- Key constraint: API supports people management + assignment status only — cannot read/edit content
- Use case: sync Trainual user IDs → `practice_members.trainual_user_id`, pull training completion
  to inform `employee_status` and personalize task workflows
- API key stored in `practices.integrations.trainual.api_key` — never expose to client

### Google Drive (document source of truth)

- Practice files, SOPs, reference docs live in GDrive
- Future: surface relevant docs in task/workflow context
- Folder ID stored in `practices.integrations.gdrive.folder_id`

## Path Aliases

```text
@/*             → ./src/*
@bds/components → ./brik-bds/components
@bds/tokens     → ./brik-bds/tokens
```

## Key Directories

```text
src/app/(auth)/      → Protected routes (dashboard, admin)
src/app/api/         → API routes
src/app/login/       → Login page
src/lib/             → Utilities (auth, supabase clients)
src/components/      → Shared React components
src/hooks/           → Custom React hooks
supabase/migrations/ → SQL migrations (numbered sequentially)
brik-bds/            → Design system submodule (DO NOT edit here)
```

## Commands

```bash
npm run dev          # Local dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Run tests
npm run db:push      # Push migrations to Supabase
npm run db:diff      # Generate migration diff
npm run db:status    # List migration status
```

## Rules

- Follow global CLAUDE.md rules (parent directory)
- Always build locally before pushing
- Stage specific files, never `git add -A`
- Never push without user confirmation
- Never skip hooks (`--no-verify`)
- BDS development happens in `GitHub/brik/brik-bds/`, NOT in the submodule
