import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Resend client ─────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? 'Renew PMS <notifications@renew.brikdesigns.com>';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ─── Send email ────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  practiceId: string;
  template: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email:', {
      to: options.to,
      subject: options.subject,
      template: options.template,
    });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('[email] Resend send failed:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// ─── Lookup helpers ────────────────────────────────────────────────────────

/** Get the email address for a practice member by their practice_members.id */
export async function getMemberEmail(memberId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('practice_members')
    .select('profiles(email)')
    .eq('id', memberId)
    .maybeSingle();

  if (!data) return null;
  const p = data.profiles as { email?: string } | { email?: string }[] | null;
  const profile = Array.isArray(p) ? p[0] : p;
  return profile?.email ?? null;
}

export async function getPracticeAdminEmails(practiceId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('practice_members')
    .select('profiles(email)')
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .in('profiles.system_role', ['admin', 'brik_admin']);

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

// ─── Email templates ───────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', in_review: 'In Review', in_progress: 'In Progress',
  waiting_on_vendor: 'Waiting on Vendor', resolved: 'Resolved', closed: 'Closed',
};

function emailWrapper(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;">This is an automated notification from Renew PMS.</p>
    </div>
  `;
}

export function requestStatusChangeEmail(title: string, newStatus: string, requestId: string): { subject: string; html: string } {
  return {
    subject: `Request Updated: ${title}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Request Status Updated</h2>
      <p style="margin: 0 0 16px; color: #555;"><strong>${title}</strong></p>
      <p style="margin: 0 0 24px;">Status changed to <strong>${STATUS_LABELS[newStatus] ?? newStatus}</strong>.</p>
      <a href="${SITE_URL}/requests?open=${requestId}" style="display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border-radius: 6px;">View Request</a>
    `),
  };
}

export function requestAssignedEmail(title: string, requestId: string): { subject: string; html: string } {
  return {
    subject: `Request Assigned: ${title}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">You've Been Assigned a Request</h2>
      <p style="margin: 0 0 16px; color: #555;"><strong>${title}</strong></p>
      <p style="margin: 0 0 24px;">You have been assigned to handle this request.</p>
      <a href="${SITE_URL}/requests?open=${requestId}" style="display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border-radius: 6px;">View Request</a>
    `),
  };
}

export function requestRejectedEmail(title: string, requestId: string): { subject: string; html: string } {
  return {
    subject: `Request Closed: ${title}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Request Closed</h2>
      <p style="margin: 0 0 16px; color: #555;"><strong>${title}</strong></p>
      <p style="margin: 0 0 24px;">This request has been reviewed and closed.</p>
      <a href="${SITE_URL}/requests?open=${requestId}" style="display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border-radius: 6px;">View Request</a>
    `),
  };
}
