import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Service-role helpers used by Playwright/Vitest specs that need to seed or
 * inspect task data outside of the browser context. .env.local is loaded
 * once per process so callers can import these helpers without setup.
 */

let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (cached) return cached;
  config({ path: resolve(__dirname, '..', '..', '.env.local') });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Test helpers need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export interface MemberLookup {
  userId: string;
  memberId: string;
  practiceId: string;
}

/** Resolve a persona's member context by email. */
export async function getMemberByEmail(email: string): Promise<MemberLookup> {
  const supabase = adminClient();
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (profileErr || !profile) {
    throw new Error(`Profile not found for ${email}: ${profileErr?.message ?? 'no row'}`);
  }
  const { data: member, error: memberErr } = await supabase
    .from('practice_members')
    .select('id, practice_id')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (memberErr || !member) {
    throw new Error(`Active membership not found for ${email}: ${memberErr?.message ?? 'no row'}`);
  }
  return { userId: profile.id, memberId: member.id, practiceId: member.practice_id };
}

export interface SeedTaskOptions {
  practiceId: string;
  title: string;
  assignedTo?: string | null;
  assignedDepartment?: string | null;
  assignedRoleId?: string | null;
  status?: 'not_started' | 'in_progress' | 'awaiting_approval' | 'completed' | 'blocked' | 'skipped' | 'overdue';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string; // YYYY-MM-DD
}

/** Insert a task and return its id. Caller is responsible for cleanup. */
export async function seedTask(opts: SeedTaskOptions): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      practice_id: opts.practiceId,
      title: opts.title,
      assigned_to: opts.assignedTo ?? null,
      assigned_department: opts.assignedDepartment ?? null,
      assigned_role_id: opts.assignedRoleId ?? null,
      status: opts.status ?? 'not_started',
      priority: opts.priority ?? 'medium',
      due_date: opts.dueDate ?? new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Failed to seed task "${opts.title}": ${error?.message ?? 'no row'}`);
  }
  return data.id;
}

/** Delete a task by id. Tolerates already-deleted rows. */
export async function deleteTask(id: string): Promise<void> {
  const supabase = adminClient();
  // task_checklist_items has FK to tasks — clean up children first.
  await supabase.from('task_checklist_items').delete().eq('task_id', id);
  await supabase.from('tasks').delete().eq('id', id);
}
