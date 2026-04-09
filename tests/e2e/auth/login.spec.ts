import { test, expect } from '@playwright/test';

/**
 * Login flow E2E tests — Renew PMS
 *
 * Tests the full auth chain: form → Supabase auth → redirect.
 * Uses test personas seeded by scripts/seed-test-users.ts.
 *
 * Prerequisites:
 *   - Dev server running on localhost:3200
 *   - Staging Supabase with seeded test personas
 *   - Test password: TestUser123!
 */

const TEST_PASSWORD = 'TestUser123!';

// ── Tests ──

test.describe('Login Page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Sign in to your practice')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('abbey+brikadmin@brikdesigns.com');
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Authenticated Login', () => {
  test('brik admin redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('abbey+brikadmin@brikdesigns.com');
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('practice owner redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('abbey+owner@brikdesigns.com');
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Auth Guard', () => {
  test('unauthenticated user redirected to /login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});
