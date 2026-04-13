import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { getPracticeId } from '@/lib/practice';

// ─── Join types ─────────────────────────────────────────────────────────────

type ProfileJoin = { first_name: string; last_name: string };
type AssigneeMemberJoin = { id: string; profiles: ProfileJoin | ProfileJoin[] | null };

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/**
 * GET /api/contacts/[id]/activity
 * Returns requests assigned to this vendor contact, ordered by most recent.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const practiceId = await getPracticeId(supabase, authUser);
  if (!practiceId) return NextResponse.json({ error: 'No practice found' }, { status: 404 });

  // Verify contact belongs to this practice
  const { data: contact, error: contactErr } = await supabase
    .from('vendor_contacts')
    .select('id')
    .eq('id', id)
    .eq('practice_id', practiceId)
    .single();

  if (contactErr || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  // Fetch requests assigned to this contact
  const { data: requests, error: reqErr } = await supabase
    .from('requests')
    .select(`
      id, title, category, urgency, status,
      created_at, updated_at, resolved_at,
      assigned_member:practice_members!requests_assigned_to_fkey(
        id,
        profiles(first_name, last_name)
      )
    `)
    .eq('vendor_contact_id', id)
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false });

  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  const rows = (requests ?? []).map(r => {
    const assignee = first(r.assigned_member as AssigneeMemberJoin | AssigneeMemberJoin[] | null);
    const assigneeProfile = assignee ? first(assignee.profiles) : null;

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      resolved_at: r.resolved_at,
      assignee_name: assigneeProfile
        ? `${assigneeProfile.first_name} ${assigneeProfile.last_name}`.trim()
        : null,
    };
  });

  return NextResponse.json(rows);
}
