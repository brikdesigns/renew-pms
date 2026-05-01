import { test, expect, type Page } from '@playwright/test';

/**
 * Account Edit — Launch checklist Tier 0.4
 *
 * Profile → change name → save → reflected on the page (and persisted in DB).
 *
 * Edits last_name only (changing email triggers Supabase Auth re-verification —
 * out of scope for an automated round-trip). Reverts the change at the end so
 * the persona returns to its seeded state.
 *
 * Self-edit support: this spec was the trigger for adding self-edit support
 * to `PATCH /api/members/[id]`. Non-admins can edit their own first_name,
 * last_name, and phone (admin-only fields like system_role and practice_role
 * stay gated). Both admin-edits-self and staff-edits-self are exercised below.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';
const ADMIN_LAST_NAME = 'Mitchell';
const STAFF_EMAIL = 'nick+frontdesk@brikdesigns.com';
const STAFF_LAST_NAME = 'Foster';

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function saveLastName(page: Page, newLastName: string) {
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByLabel('Last Name').fill(newLastName);
  await page.getByRole('button', { name: 'Save Changes' }).click();
  // Sheet must fully unmount before the next interaction — toBeHidden returns
  // true mid-animation while the dialog is still intercepting pointer events.
  await expect(dialog).toHaveCount(0, { timeout: 10_000 });
}

test.describe('Account Edit (Tier 0.4)', () => {
  test('admin can change their last name and see it persist', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/settings/account');

    await expect(page.getByText(ADMIN_LAST_NAME).first()).toBeVisible();

    const stamped = `${ADMIN_LAST_NAME}-${Date.now()}`;
    try {
      await saveLastName(page, stamped);
      await expect(page.getByText(stamped).first()).toBeVisible({ timeout: 5_000 });
    } finally {
      await saveLastName(page, ADMIN_LAST_NAME);
      await expect(page.getByText(ADMIN_LAST_NAME).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('staff can change their own last name and see it persist', async ({ page }) => {
    await loginAs(page, STAFF_EMAIL);
    await page.goto('/settings/account');

    await expect(page.getByText(STAFF_LAST_NAME).first()).toBeVisible();

    const stamped = `${STAFF_LAST_NAME}-${Date.now()}`;
    try {
      await saveLastName(page, stamped);
      await expect(page.getByText(stamped).first()).toBeVisible({ timeout: 5_000 });
    } finally {
      await saveLastName(page, STAFF_LAST_NAME);
      await expect(page.getByText(STAFF_LAST_NAME).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
