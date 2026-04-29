import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * POST /api/tasks/generate-daily
 * Triggers daily task generation for the current practice across all
 * assignment modes (individual, role, department, pool).
 * Calls the DB function generate_daily_tasks(practice_id).
 * Admin-only — intended for manual trigger or future cron webhook.
 */
export async function POST() {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const admin = createAdminClient();
  const { error } = await admin.rpc('generate_daily_tasks', {
    p_practice_id: practiceId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Daily tasks generated for today.' });
}
