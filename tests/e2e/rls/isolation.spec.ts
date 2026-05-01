import { test, expect, type Page } from '@playwright/test';

/**
 * RLS Isolation — Launch checklist Tier 0.6 (HIPAA-critical)
 *
 * Confirms that a user authenticated to one practice cannot see data from
 * another practice via the public API surface. Drives the assertion through
 * the same routes the real UI uses, so this catches both DB policy regressions
 * and API routes that forget to scope by practice_id.
 *
 * Requires personas seeded by scripts/seed-test-users.ts:
 *   - Practice 1 (Renew Dental):       nick+owner@brikdesigns.com
 *   - Practice 2 (Bayside, RLS test):  nick+p2admin@brikdesigns.com,
 *                                      nick+p2staff@brikdesigns.com
 */

const TEST_PASSWORD = 'TestUser123!';

const P1 = {
  admin: 'nick+owner@brikdesigns.com',
  practiceName: 'Renew Dental',
  practiceSlug: 'renew-dental',
};

const P2 = {
  admin: 'nick+p2admin@brikdesigns.com',
  staff: 'nick+p2staff@brikdesigns.com',
  practiceSlug: 'bayside-test',
};

// Substrings of P2 emails — used to assert P2 data does not leak into P1 responses.
const P2_EMAIL_MARKERS = [
  'p2admin@brikdesigns.com',
  'p2staff@brikdesigns.com',
];

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

test.describe('RLS Isolation (Tier 0.6 — HIPAA-critical)', () => {
  test('P1 admin cannot see P2 members via /api/members', async ({ page }) => {
    await loginAs(page, P1.admin);

    const res = await page.request.get('/api/members');
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const body = await res.text();
    for (const marker of P2_EMAIL_MARKERS) {
      expect(body, `P2 email "${marker}" leaked into P1 /api/members response`).not.toContain(marker);
    }
  });

  test('P2 admin cannot see P1 members via /api/members', async ({ page }) => {
    await loginAs(page, P2.admin);

    const res = await page.request.get('/api/members');
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const body = await res.text();
    // P1-only personas (no P2 counterpart) — must NOT appear for a P2 user
    const p1OnlyMarkers = [
      'nick+owner@brikdesigns.com',
      'nick+manager@brikdesigns.com',
      'nick+hygienist@brikdesigns.com',
    ];
    for (const marker of p1OnlyMarkers) {
      expect(body, `P1 email "${marker}" leaked into P2 /api/members response`).not.toContain(marker);
    }
    // The P2 user themselves SHOULD appear in their own practice's member list.
    expect(body).toContain(P2.admin);
  });

  test('P1 admin sees Renew Dental as their practice', async ({ page }) => {
    await loginAs(page, P1.admin);

    const res = await page.request.get('/api/practice');
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const practice = await res.json();
    expect(practice.name).toBe(P1.practiceName);
    expect(practice.slug).toBe(P1.practiceSlug);
  });

  test('P2 admin sees Bayside as their practice (not Renew Dental)', async ({ page }) => {
    await loginAs(page, P2.admin);

    const res = await page.request.get('/api/practice');
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const practice = await res.json();
    expect(practice.slug).toBe(P2.practiceSlug);
    expect(practice.name).not.toBe(P1.practiceName);
  });
});
