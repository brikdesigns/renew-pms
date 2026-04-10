import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const BACKLOG_DATABASE_ID = '32097d34-ed28-8051-8225-eb6800c2e05a';
const PRODUCT_NAME = 'Renew PMS';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Map widget feedback types to Backlog Scope values */
const SCOPE_MAP: Record<string, string> = {
  bug: 'Critical',
  ui: 'Normal',
  suggestion: 'Low',
  question: 'Low',
};

/** Map widget types to Notion Feedback Type select values */
const FEEDBACK_TYPE_MAP: Record<string, string> = {
  bug: 'Bug',
  ui: 'UI Issue',
  suggestion: 'Suggestion',
  question: 'Question',
};

/** Emoji prefix per type for the title */
const EMOJI_MAP: Record<string, string> = {
  bug: '🐛',
  ui: '🎨',
  suggestion: '💡',
  question: '❓',
};

/**
 * POST /api/feedback — Submit QA feedback to Notion Backlog
 */
export async function POST(request: Request) {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    return NextResponse.json({ error: 'NOTION_TOKEN not configured' }, { status: 500 });
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
        'Feedback Type': { select: { name: FEEDBACK_TYPE_MAP[type] ?? 'Bug' } },
        Role: { select: { name: role } },
        Product: { select: { name: PRODUCT_NAME } },
        Status: { status: { name: 'Not Started' } },
        Scope: { select: { name: SCOPE_MAP[type] ?? 'Normal' } },
        'userDefined:URL': { url: `${BASE_URL}${page_url}` },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('[feedback] Notion API error:', JSON.stringify(err, null, 2));
    return NextResponse.json({ error: 'Failed to submit to Notion', details: err }, { status: 500 });
  }

  const page = await res.json();
  return NextResponse.json({ id: page.id, status: 'submitted' });
}
