import { test, expect } from '@playwright/test';

/**
 * Logout flow E2E tests — Renew PMS
 *
 * Launch checklist Tier 0.3 — full logout flow (the existing login.spec.ts
 * only covers the auth-guard half, i.e. unauthenticated → /login redirect).
 *
 * Verifies that signing out:
 *   1. Lands the user on /login
 *   2. Clears the session — protected routes redirect to /login afterwards
 */

const TEST_PASSWORD = 'TestUser123!';
const TEST_EMAIL = 'abbey+brikadmin@brikdesigns.com';

test.describe('Logout (Tier 0.3)', () => {
  test('user menu → Sign Out lands on /login and clears the session', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByLabel('Email address').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });

    // 2. Open the user menu and click Sign Out
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign Out' }).click();

    // 3. Lands on /login
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    // 4. Session cleared — visiting /dashboard now bounces back to /login
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});
