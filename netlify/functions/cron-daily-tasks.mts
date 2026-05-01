import type { Config, Context } from '@netlify/functions';

/**
 * Netlify scheduled function — fires daily at 05:00 UTC and POSTs to the
 * /api/cron/generate-daily-tasks Next.js route, which is gated by CRON_SECRET.
 *
 * The Next.js route does the actual DB work (run_daily_tasks RPC). Splitting
 * it this way keeps a single canonical URL for the cron action — useful for
 * manual triggering, monitoring, and same-secret access from any future
 * scheduler (Supabase pg_cron, an external uptime monitor, etc.).
 *
 * 5 UTC = midnight EST / 9pm PST the prior day. For US dental practices that
 * works as "tasks ready before staff arrive."
 */
export default async (_req: Request, _context: Context) => {
  const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl) {
    console.error('[cron-daily-tasks] No site URL env var available (URL / DEPLOY_URL / NEXT_PUBLIC_SITE_URL)');
    return new Response('Site URL not configured', { status: 500 });
  }
  if (!cronSecret) {
    console.error('[cron-daily-tasks] CRON_SECRET not configured');
    return new Response('Cron secret not configured', { status: 500 });
  }

  const target = `${siteUrl.replace(/\/$/, '')}/api/cron/generate-daily-tasks`;
  const startedAt = Date.now();
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  });
  const elapsedMs = Date.now() - startedAt;
  const body = await response.text();

  if (!response.ok) {
    console.error(`[cron-daily-tasks] ${target} returned ${response.status} after ${elapsedMs}ms:`, body);
    return new Response(`Upstream ${response.status}: ${body}`, { status: 502 });
  }

  console.log(`[cron-daily-tasks] OK in ${elapsedMs}ms:`, body);
  return new Response(body, { status: 200 });
};

export const config: Config = {
  schedule: '0 5 * * *',
};
