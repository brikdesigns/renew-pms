import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const BACKLOG_DATABASE_ID = '32097d34-ed28-8051-8225-eb6800c2e05a';
const PRODUCT_NAME = 'Vantage';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Map widget feedback types to Backlog Severity values (triage adjusts after intake) */
const SEVERITY_MAP: Record<string, string> = {
  bug: 'High',
  ui: 'Low',
  suggestion: 'Low',
  question: 'Low',
};

/** Map widget types to Backlog Type select values */
const TYPE_MAP: Record<string, string> = {
  bug: 'Bug',
  ui: 'Enhancement',
  suggestion: 'Suggestion',
  question: 'Question',
};

/** Map system roles to Backlog Role multi_select options */
const ROLE_MAP: Record<string, string> = {
  brik_admin: 'Brik Admin',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

/** Emoji prefix per type for the title */
const EMOJI_MAP: Record<string, string> = {
  bug: '🐛',
  ui: '🎨',
  suggestion: '💡',
  question: '❓',
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
  const emoji = EMOJI_MAP[type] ?? '📝';
  const title = `${emoji} ${description.trim().slice(0, 80)}${description.length > 80 ? '...' : ''}`;
  const roleOption = ROLE_MAP[role];

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: BACKLOG_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Description: { rich_text: [{ text: { content: description.trim() } }] },
        Submitter: { rich_text: [{ text: { content: `${submitter} (${email})` } }] },
        Type: { select: { name: TYPE_MAP[type] ?? 'Bug' } },
        ...(roleOption ? { Role: { multi_select: [{ name: roleOption }] } } : {}),
        Product: { select: { name: PRODUCT_NAME } },
        Triage: { select: { name: 'Not Triaged' } },
        Severity: { select: { name: SEVERITY_MAP[type] ?? 'Medium' } },
        URL: { url: `${BASE_URL}${page_url}` },
      },
    }),
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
