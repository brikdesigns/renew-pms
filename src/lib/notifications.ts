import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'request_new' | 'request_status_change' | 'request_assigned' | 'task_assigned';

interface CreateNotificationOptions {
  practiceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Create an in-app notification. Fails silently. */
export async function createNotification(opts: CreateNotificationOptions) {
  try {
    const supabase = await createClient();
    await supabase.from('notifications').insert({
      practice_id: opts.practiceId, user_id: opts.userId, type: opts.type,
      title: opts.title, body: opts.body ?? null, link: opts.link ?? null,
    });
  } catch (err) { console.error('[notification] Failed:', err); }
}

/** Create notifications for multiple users. */
export async function createNotifications(opts: Omit<CreateNotificationOptions, 'userId'> & { userIds: string[] }) {
  if (opts.userIds.length === 0) return;
  try {
    const supabase = await createClient();
    await supabase.from('notifications').insert(
      opts.userIds.map(userId => ({
        practice_id: opts.practiceId, user_id: userId, type: opts.type,
        title: opts.title, body: opts.body ?? null, link: opts.link ?? null,
      }))
    );
  } catch (err) { console.error('[notification] Failed batch:', err); }
}

/** Get user IDs for practice admins. */
export async function getPracticeAdminUserIds(practiceId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('practice_members').select('user_id, profiles(system_role)').eq('practice_id', practiceId).eq('is_active', true);
  if (!data) return [];
  const ids: string[] = [];
  for (const member of data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles as any;
    if (profile?.system_role === 'practice_admin' || profile?.system_role === 'platform_admin') ids.push(member.user_id);
  }
  return ids;
}
