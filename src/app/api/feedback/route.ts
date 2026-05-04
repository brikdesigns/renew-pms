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
const SENTRY_ORG_SLUG = 'brik-designs';
const SENTRY_PROJECT_SLUG = 'renew-pms';

/**
 * POST /api/feedback — Submit user feedback to Sentry.
 *
 * Two-step pattern:
 *   1. Sentry.captureMessage(...) creates an issue event via the standard
 *      error-event transport (proven reliable from Netlify serverless).
 *   2. POST /api/0/projects/.../user-feedback/ attaches feedback content to
 *      that issue. Visible in Sentry's "User Feedback" tab on the issue and
 *      queryable via the legacy user-feedback API.
 *
 * Why not Sentry.captureFeedback alone? Documented but does not transmit
 * reliably from @sentry/nextjs v10.44 in Netlify functions — events drop
 * before ingestion. See #262 → #264 → debugging notes in this PR.
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
  const typeLabel = FEEDBACK_TYPE_MAP[type] ?? 'Bug';
  const priority = PRIORITY_MAP[type] ?? 'normal';
  const fullUrl = page_url ? `${BASE_URL}${page_url}` : BASE_URL;
  const titleText = description.trim().slice(0, 80);

  const eventId = Sentry.withScope((scope) => {
    scope.setLevel('info');
    scope.setTags({
      feedback_type: typeLabel,
      priority,
      role,
      product: 'Renew PMS',
      source: 'feedback-widget',
      page_url: page_url ?? '/',
    });
    scope.setUser({ username: submitter, email });
    scope.setContext('feedback', { description: description.trim(), url: fullUrl });
    return Sentry.captureMessage(`[Feedback] ${typeLabel}: ${titleText}`);
  });

  const flushed = await Sentry.flush(2000);
  if (!flushed) console.warn('[feedback] Sentry flush timed out — captureMessage event may not have transmitted');

  const sentryToken = process.env.SENTRY_AUTH_TOKEN;
  if (sentryToken) {
    try {
      const fbResp = await fetch(
        `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${SENTRY_PROJECT_SLUG}/user-feedback/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sentryToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: eventId,
            name: submitter,
            email,
            comments: description.trim(),
          }),
        },
      );
      if (!fbResp.ok) {
        const errText = await fbResp.text().catch(() => 'unknown');
        console.warn(`[feedback] Sentry user-feedback POST failed: ${fbResp.status} — ${errText.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn('[feedback] Sentry user-feedback POST threw:', err);
    }
  } else {
    console.warn('[feedback] SENTRY_AUTH_TOKEN not configured — feedback metadata not attached');
  }

  return NextResponse.json({ id: eventId, status: 'submitted' });
}
