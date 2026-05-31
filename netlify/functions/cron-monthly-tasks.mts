import type { Config, Context } from '@netlify/functions';

/**
 * Netlify scheduled function — fires on the 1st of every month at 05:00 UTC
 * and POSTs to /api/cron/generate-monthly-tasks, gated by CRON_SECRET.
 *
 * ADR-003: fixed UTC schedule. 05:00 UTC on the 1st = still the 1st for all
 * US time zones, a low-activity window. Acceptable for pre-launch.
 *
 * Mirrors cron-weekly-tasks.mts — same secret, same URL pattern, same split
 * between the Netlify trigger and the Next.js handler that does DB work.
 */
export default async (_req: Request, _context: Context) => {
  const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl) {
    console.error('[cron-monthly-tasks] No site URL env var available (URL / DEPLOY_URL / NEXT_PUBLIC_SITE_URL)');
    return new Response('Site URL not configured', { status: 500 });
  }
  if (!cronSecret) {
    console.error('[cron-monthly-tasks] CRON_SECRET not configured');
    return new Response('Cron secret not configured', { status: 500 });
  }

  const target = `${siteUrl.replace(/\/$/, '')}/api/cron/generate-monthly-tasks`;
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
    console.error(`[cron-monthly-tasks] ${target} returned ${response.status} after ${elapsedMs}ms:`, body);
    return new Response(`Upstream ${response.status}: ${body}`, { status: 502 });
  }

  console.log(`[cron-monthly-tasks] OK in ${elapsedMs}ms:`, body);
  return new Response(body, { status: 200 });
};

export const config: Config = {
  schedule: '0 5 1 * *',
};
