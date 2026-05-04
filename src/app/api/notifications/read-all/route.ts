import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

/** PATCH /api/notifications/read-all — mark all as read */
export async function PATCH() {
  const supabase = await createClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const authUser = authResult as AuthUser;

  const admin = createAdminClient();
  const { error } = await admin.from('notifications').update({ is_read: true }).eq('user_id', authUser.profile.id).eq('is_read', false);
  if (error) return apiError(error);
  return NextResponse.json({ success: true });
}
