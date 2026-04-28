import { test, expect, type Page } from '@playwright/test';

/**
 * Role-gated settings access — Launch checklist Tier 0.7
 *
 * Asserts the design intent declared in SettingsSubNav: every settings route
 * except `/settings/account` is admin-only. The test drives staff and admin
 * personas at each route and verifies the staff path is bounced server-side.
 *
 * UI-hiding alone is insufficient — for HIPAA defense-in-depth, the server
 * must reject the request. Staff can guess URLs or follow stale bookmarks.
 *
 * Other Tier 0.7 sub-cases (staff cannot reassign others' tasks, cannot
 * approve own requests; manager scoped to department) need seeded task /
 * request data and live in separate specs to keep this one focused on the
 * settings-routes coverage.
 */

const TEST_PASSWORD = 'TestUser123!';
const STAFF_EMAIL = 'nick+frontdesk@brikdesigns.com';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';

// Routes marked `adminOnly: true` in src/components/SettingsSubNav.tsx
const ADMIN_ONLY_ROUTES = [
  '/settings/organization',
  '/settings/templates',
  '/settings/departments',
  '/settings/teams',
  '/settings/roles',
  '/settings/users',
  '/settings/contacts',
  '/settings/inventory',
];

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

test.describe('Role-gated settings access (Tier 0.7)', () => {
  test('staff is redirected away from every admin-only settings route', async ({ page }) => {
    await loginAs(page, STAFF_EMAIL);

    for (const route of ADMIN_ONLY_ROUTES) {
      await page.goto(route);
      // Server-side redirect should land us anywhere BUT the requested route.
      // The conventional landing is /settings/account, but treat any redirect
      // away from the admin-only path as success.
      await expect(page, `staff should not reach ${route}`).not.toHaveURL(new RegExp(`${route}$`));
    }
  });

  test('admin can reach every admin-only settings route', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);

    for (const route of ADMIN_ONLY_ROUTES) {
      const response = await page.goto(route);
      expect(response?.status(), `admin should reach ${route}`).toBeLessThan(400);
      // After load, the URL should match what we asked for.
      await expect(page, `admin landed somewhere unexpected from ${route}`).toHaveURL(new RegExp(`${route}$`));
    }
  });

  test('any authenticated user can reach /settings/account', async ({ page }) => {
    await loginAs(page, STAFF_EMAIL);
    await page.goto('/settings/account');
    await expect(page).toHaveURL(/\/settings\/account$/);
  });
});
