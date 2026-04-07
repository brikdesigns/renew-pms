# Renew PMS

Dental practice management and training platform. Staff-only back office tool for task management, training tracking, compliance, and practice operations.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, React 19)
- **Database:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Brik Design System (git submodule) + Tailwind CSS 4
- **Error tracking:** Sentry
- **Docs:** Fumadocs (`/docs`, `/guide`)
- **Hosting:** Netlify

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
```

Requires `.env.local` with Supabase credentials. See 1Password for keys.

## Commands

```bash
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest

npm run db:push      # Push migrations to Supabase
npm run db:status    # Migration status
```

## Project Structure

```text
src/
  app/               # Next.js App Router pages and API routes
  components/        # Shared React components
  hooks/             # Custom React hooks
  lib/               # Utilities, tokens, auth, Supabase clients
  styles/            # Client theme (theme-renew.css)
brik-bds/            # BDS submodule (read-only — edit in brik/brik-bds)
supabase/
  migrations/        # Database migrations
```

## Documentation

- **CLAUDE.md** — Agent instructions, architecture, conventions
- **Notion** — [Database Need to Knows](https://www.notion.so/Database-Need-to-Knows-32e97d34ed2880738291dc49554f0f97)
