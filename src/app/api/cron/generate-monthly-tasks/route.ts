import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/cron/generate-monthly-tasks
 *
 * Cross-practice monthly task generation, called by the Netlify scheduled
 * function at netlify/functions/cron-monthly-tasks.mts (05:00 UTC on the 1st
 * of every month, cron: '0 5 1 * *'). Also usable for manual smoke tests via curl.
 *
 * Auth: shared-secret Bearer token matched against CRON_SECRET.
 *
 * ADR-002: skip+spawn-fresh — stale monthly tasks from prior months are marked
 * 'skipped', then a fresh 'not_started' task is spawned with due_date set to
 * the 1st of the current month (date_trunc('month', current_date)).
 *
 * ADR-003: fixed UTC schedule — no per-practice timezone logic. 05:00 UTC on
 * the 1st is still the 1st for all US time zones.
 *
 * The handler invokes run_monthly_tasks() (migration 00053), which iterates
 * every active practice. Idempotent: duplicate firings on the same 1st are
 * safe (the SQL function skips already-spawned rows).
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron/generate-monthly-tasks] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const startedAt = Date.now();
  const { error } = await admin.rpc('run_monthly_tasks');
  const elapsedMs = Date.now() - startedAt;

  if (error) {
    console.error('[cron/generate-monthly-tasks] run_monthly_tasks failed:', error);
    return NextResponse.json({ error: 'Internal server error', elapsedMs }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Monthly tasks generated for all active practices.',
    elapsedMs,
  });
}
