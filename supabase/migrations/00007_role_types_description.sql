-- Add description column to practice_role_types
-- Allows admins to annotate each role with a brief purpose summary.

alter table public.practice_role_types
  add column if not exists description text;
