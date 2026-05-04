import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

const FEEDBACK_TYPE_MAP: Record<string, string> = {
  bug: 'Bug',
  ui: 'UI Issue',
  suggestion: 'Suggestion',
  question: 'Question',
};

const PRIORITY_MAP: Record<string, string> = {
  bug: 'critical',
  ui: 'normal',
  suggestion: 'low',
  question: 'low',
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * POST /api/feedback — Submit user feedback to Sentry User Feedback.
 *
 * Replaces the legacy Notion Backlog write — eliminates NOTION_TOKEN secret and
 * centralizes feedback in the Sentry dashboard alongside error events. Sentry
 * was already wired (instrumentation-client.ts has feedbackIntegration); this
 * route consumes the existing integration server-side via captureFeedback.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const body = await request.json();
  const { page_url, feedback_type, description } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const submitter = authUser.profile.first_name ?? 'Unknown';
  const email = authUser.profile.email ?? 'unknown';
  const role = authUser.profile.system_role ?? 'staff';
  const type = feedback_type ?? 'bug';

  const eventId = Sentry.captureFeedback({
    message: description.trim(),
    name: submitter,
    email,
    url: page_url ? `${BASE_URL}${page_url}` : undefined,
    source: 'renew-pms-feedback-widget',
    tags: {
      feedback_type: FEEDBACK_TYPE_MAP[type] ?? 'Bug',
      priority: PRIORITY_MAP[type] ?? 'normal',
      role,
      product: 'Renew PMS',
    },
  });

  // Required in Netlify serverless — function may terminate before the in-flight
  // Sentry POST completes, silently dropping the event. Initial #262 ship missed this.
  const flushed = await Sentry.flush(2000);
  if (!flushed) console.warn('[feedback] Sentry flush timed out — event may not have transmitted');

  return NextResponse.json({ id: eventId, status: 'submitted' });
}
