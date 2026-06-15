import { NextResponse } from 'next/server';
import { buildBacklogPageBody, NOTION_VERSION } from '@brikdesigns/feedback-contract';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

const NOTION_API = 'https://api.notion.com/v1';
const PRODUCT_NAME = 'Vantage';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Map system roles to Backlog Role multi_select options */
const ROLE_MAP: Record<string, string> = {
  brik_admin: 'Brik Admin',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

/**
 * POST /api/feedback — Submit QA feedback to Notion Backlog.
 *
 * Notion is the canonical feedback destination — provides triage workflow,
 * status, comments, and kanban view. Restored after a brief detour through
 * Sentry routing (#262 → #266) which was scope creep, not architecture intent.
 */
export async function POST(request: Request) {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    console.error('[feedback] NOTION_TOKEN not configured in env');
    return NextResponse.json({ error: 'Feedback service not configured' }, { status: 500 });
  }

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
  const roleOption = ROLE_MAP[role];

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildBacklogPageBody({
        type,
        description,
        submitter: `${submitter} (${email})`,
        product: PRODUCT_NAME,
        url: `${BASE_URL}${page_url}`,
        roleOptions: roleOption ? [roleOption] : undefined,
      }),
    ),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error('[feedback] Notion API error:', res.status, JSON.stringify(errBody));
    // Surface the upstream Notion status + message so the widget shows an
    // actionable error instead of a generic string (see brik-llm#791).
    return NextResponse.json(
      { error: 'Failed to submit feedback', notion_status: res.status, details: errBody },
      { status: 502 },
    );
  }

  const page = await res.json();
  return NextResponse.json({ id: page.id, status: 'submitted' });
}
