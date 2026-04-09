import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePracticeAdmin } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

/**
 * POST /api/tasks/generate-pool
 * Triggers daily pool task generation for the current practice.
 * Calls the DB function generate_daily_pool_tasks(practice_id).
 * Admin-only — intended for manual trigger or future cron webhook.
 */
export async function POST() {
  const supabase = await createClient();
  const authResult = await requirePracticeAdmin(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  const { error } = await supabase.rpc('generate_daily_pool_tasks', {
    p_practice_id: practiceId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Pool tasks generated for today.' });
}
