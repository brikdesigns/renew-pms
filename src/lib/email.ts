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

// ─── Vendor portal email templates ────────────────────────────────────────

const CTA_STYLE = 'display: inline-block; padding: 10px 20px; background: #333; color: #fff; text-decoration: none; border-radius: 6px;';

/** Sent to vendor contact when a request is assigned to their company. */
export function vendorAssignedEmail(opts: {
  vendorContactName: string;
  practiceName: string;
  requestTitle: string;
  requestDescription: string | null;
  token: string;
}): { subject: string; html: string } {
  const descBlock = opts.requestDescription
    ? `<p style="margin: 0 0 16px; color: #555;">${opts.requestDescription.slice(0, 300)}</p>`
    : '';

  return {
    subject: `Work Order: ${opts.requestTitle}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">New Work Order</h2>
      <p style="margin: 0 0 16px;">Hi ${opts.vendorContactName},</p>
      <p style="margin: 0 0 16px;"><strong>${opts.practiceName}</strong> has assigned you a work order:</p>
      <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">${opts.requestTitle}</p>
      ${descBlock}
      <p style="margin: 24px 0;">
        <a href="${SITE_URL}/vendor/${opts.token}" style="${CTA_STYLE}">View Work Order</a>
      </p>
      <p style="font-size: 13px; color: #888;">This link expires in 30 days. Use it to view details and post updates.</p>
    `),
  };
}

/** Sent to vendor contact when a staff member posts a message on the request thread. */
export function vendorMessageEmail(opts: {
  vendorContactName: string;
  staffName: string;
  requestTitle: string;
  messagePreview: string;
  token: string;
}): { subject: string; html: string } {
  const preview = opts.messagePreview.length > 200
    ? opts.messagePreview.slice(0, 200) + '...'
    : opts.messagePreview;

  return {
    subject: `New Message: ${opts.requestTitle}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">New Message on Work Order</h2>
      <p style="margin: 0 0 16px;">Hi ${opts.vendorContactName},</p>
      <p style="margin: 0 0 16px;"><strong>${opts.staffName}</strong> sent you a message regarding <strong>${opts.requestTitle}</strong>:</p>
      <blockquote style="margin: 0 0 16px; padding: 12px 16px; background: #f5f5f5; border-left: 3px solid #ddd; border-radius: 4px; color: #555;">${preview}</blockquote>
      <p style="margin: 24px 0;">
        <a href="${SITE_URL}/vendor/${opts.token}" style="${CTA_STYLE}">View &amp; Respond</a>
      </p>
    `),
  };
}

/** Sent to practice admins when a vendor posts a reply on the request thread. */
export function staffVendorReplyEmail(opts: {
  vendorName: string;
  vendorContactName: string;
  requestTitle: string;
  requestId: string;
  messagePreview: string;
  vendorStatus?: string | null;
}): { subject: string; html: string } {
  const preview = opts.messagePreview.length > 200
    ? opts.messagePreview.slice(0, 200) + '...'
    : opts.messagePreview;

  const VENDOR_STATUS_LABELS: Record<string, string> = {
    acknowledged: 'Acknowledged', scheduled: 'Scheduled', in_progress: 'In Progress',
    on_hold: 'On Hold', parts_ordered: 'Parts Ordered', completed: 'Completed',
  };

  const statusLine = opts.vendorStatus
    ? `<p style="margin: 0 0 16px;"><strong>Vendor Status:</strong> ${VENDOR_STATUS_LABELS[opts.vendorStatus] ?? opts.vendorStatus}</p>`
    : '';

  return {
    subject: `Vendor Response: ${opts.requestTitle}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Vendor Response</h2>
      <p style="margin: 0 0 16px;"><strong>${opts.vendorContactName}</strong> from <strong>${opts.vendorName}</strong> replied to <strong>${opts.requestTitle}</strong>:</p>
      <blockquote style="margin: 0 0 16px; padding: 12px 16px; background: #f5f5f5; border-left: 3px solid #ddd; border-radius: 4px; color: #555;">${preview}</blockquote>
      ${statusLine}
      <p style="margin: 24px 0;">
        <a href="${SITE_URL}/requests?open=${opts.requestId}" style="${CTA_STYLE}">View Request</a>
      </p>
    `),
  };
}

// ─── Auth email templates ──────────────────────────────────────────────────

/** Sent when an admin invites a new staff member. Link sets their password and signs them in. */
export function inviteAcceptanceEmail(opts: {
  firstName: string;
  practiceName: string;
  inviterName: string;
  actionLink: string;
  expiresInDays: number;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${opts.practiceName} on Renew PMS`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Welcome to Renew PMS</h2>
      <p style="margin: 0 0 16px;">Hi ${opts.firstName},</p>
      <p style="margin: 0 0 16px;"><strong>${opts.inviterName}</strong> has invited you to join <strong>${opts.practiceName}</strong> on Renew PMS — your dental practice's management and training platform.</p>
      <p style="margin: 0 0 16px;">Click below to set your password and sign in:</p>
      <p style="margin: 24px 0;">
        <a href="${opts.actionLink}" style="${CTA_STYLE}">Accept invitation</a>
      </p>
      <p style="font-size: 13px; color: #888;">This invitation expires in ${opts.expiresInDays} days. If it expires, ask your practice admin to resend it.</p>
    `),
  };
}

/** Sent in response to a forgot-password request. Link signs them in and lets them set a new password. */
export function passwordResetEmail(opts: {
  firstName: string;
  actionLink: string;
  expiresInDays: number;
}): { subject: string; html: string } {
  return {
    subject: 'Reset your Renew PMS password',
    html: emailWrapper(`
      <h2 style="margin: 0 0 8px;">Reset your password</h2>
      <p style="margin: 0 0 16px;">Hi ${opts.firstName},</p>
      <p style="margin: 0 0 16px;">We received a request to reset the password for your Renew PMS account.</p>
      <p style="margin: 24px 0;">
        <a href="${opts.actionLink}" style="${CTA_STYLE}">Reset password</a>
      </p>
      <p style="margin: 0 0 16px; font-size: 13px; color: #888;">This link expires in ${opts.expiresInDays} days. If you didn't request this reset, you can safely ignore this email — your password won't change.</p>
    `),
  };
}
