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

## Architecture
- Multi-tenant: practices are isolated via `practice_members` join table + RLS
- Three system roles: `platform_admin`, `practice_admin`, `staff`
- Five practice-level roles: `owner`, `admin`, `manager`, `staff`, `viewer`
- BDS submodule at `./brik-bds/` — import via `@bds/components` and `@bds/tokens`

## Path Aliases
```
@/*           → ./src/*
@bds/components → ./brik-bds/components
@bds/tokens   → ./brik-bds/tokens
```

## Key Directories
```
src/app/(auth)/     → Protected routes (dashboard, admin)
src/app/api/        → API routes
src/app/login/      → Login page
src/lib/            → Utilities (auth, supabase clients)
src/components/     → Shared React components
src/hooks/          → Custom React hooks
supabase/migrations/ → SQL migrations (numbered sequentially)
brik-bds/           → Design system submodule (DO NOT edit here)
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
