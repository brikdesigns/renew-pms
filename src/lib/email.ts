import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Email utility — currently logs only.
 * Wire up Resend (RESEND_API_KEY) before beta launch.
 */

interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  practiceId: string;
  template: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  console.warn('[email] Resend not configured — would send:', {
    to: options.to,
    subject: options.subject,
    template: options.template,
  });
}

export async function getPracticeAdminEmails(practiceId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('practice_members')
    .select('profiles(email)')
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .in('profiles.system_role', ['practice_admin', 'platform_admin']);

  if (error) {
    console.error('[email] failed to fetch admin emails:', error);
    return [];
  }

  return (data ?? [])
    .map((m: Record<string, unknown>) => {
      const p = m.profiles as { email?: string } | { email?: string }[] | null;
      const profile = Array.isArray(p) ? p[0] : p;
      return profile?.email;
    })
    .filter((e): e is string => !!e);
}
