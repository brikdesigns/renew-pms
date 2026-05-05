import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/cron/generate-daily-tasks
 *
 * Cross-practice daily task generation, called by the Netlify scheduled
 * function at netlify/functions/cron-daily-tasks.mts (5:00 UTC daily). Also
 * usable for manual smoke tests via curl with the same Bearer token.
 *
 * Auth: shared-secret Bearer token in Authorization header, matched against
 * CRON_SECRET (set in Netlify env + 1Password). NOT user-session-authed —
 * scheduled functions run without a user context.
 *
 * The handler invokes run_daily_tasks() (migration 00045), which iterates
 * every active practice and calls generate_daily_tasks(practice_id) for each.
 * That SQL function is idempotent (skips practices whose tasks already
 * exist for today), so duplicate cron firings or manual re-invocations are
 * safe.
 *
 * Pairs with the auto-spawn-on-template-save behavior shipped in PR #105:
 * that handles "I just made this template, where's today's task?", and
 * this handles tomorrow's recurrence (and every day after).
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron/generate-daily-tasks] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const startedAt = Date.now();
  const { error } = await admin.rpc('run_daily_tasks');
  const elapsedMs = Date.now() - startedAt;

  if (error) {
    console.error('[cron/generate-daily-tasks] run_daily_tasks failed:', error);
    return NextResponse.json({ error: error.message, elapsedMs }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Daily tasks generated for all active practices.',
    elapsedMs,
  });
}
