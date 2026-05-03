import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedTask, deleteTask } from '../../helpers/seed-task';

/**
 * Board completion / Show-Resolved coverage — closes the QA gap raised by
 * 2026-04-29 retro in [`docs/qa/launch-checklist.md`](../../../docs/qa/launch-checklist.md).
 *
 * The pre-existing Tier 1.2 spec ([`staff-completion.spec.ts`](./staff-completion.spec.ts))
 * drives the API contract via `page.request.patch`; it never touches the
 * board UI. Two coupled bugs reached staging undetected because of that:
 *
 *   1. Clicking a board card's CompletionToggle on an overdue (prior-due)
 *      row appeared to "not stick" — the optimistic flip survived the PATCH
 *      but vanished on the next refetch because the server's loadTasks OR
 *      clauses excluded resolved variants of overdue/stale-recurring rows.
 *      Fix in PR #111: `loadTasks` accepts `includeResolved` and the client
 *      tracks `pendingToggleIds` so the resync useEffect doesn't clobber an
 *      in-flight optimistic flip.
 *
 *   2. The "Show Resolved" chip was a silent no-op. The toggle filtered
 *      client-side from a list the server had already pruned of resolved
 *      rows. Fix passes `includeResolved=true` through useTasks/usePoolTasks
 *      → `/api/tasks?includeResolved=true`.
 *
 * These specs seed cross-day-boundary fixtures (yesterday-due rows) — the
 * exact data shape that exposes both bugs and that no other spec/fixture
 * covers.
 */

const TEST_PASSWORD = 'TestUser123!';
const STAFF_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant (staff)

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

/** Locator for a BDS BoardCard whose title contains the given substring. */
function cardByTitle(page: Page, title: string) {
  return page.locator('.bds-board-card', { hasText: title });
}

/** Open the collapsible filter chip row above the board. */
async function openFilters(page: Page) {
  await page.getByRole('button', { name: 'Toggle filters' }).click();
  await expect(page.getByRole('button', { name: 'Show Resolved' })).toBeVisible();
}

test.describe('Tasks board: completion + Show Resolved (regression for retro 2026-04-29)', () => {
  let practiceId: string;
  let staffMemberId: string;
  const tag = `qa-board-resolution-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const staff = await getMemberByEmail(STAFF_EMAIL);
    practiceId = staff.practiceId;
    staffMemberId = staff.memberId;
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('overdue task: clicking the toggle keeps the card visible + checked through the post-PATCH refetch (Show Resolved on)', async ({ page }) => {
    // Pre-fix this row would: optimistic-check → PATCH 200 → refetch returns
    // a list without the row (server excluded resolved-overdue) → the
    // resync useEffect rebuilt `checked` from empty → checkbox visually
    // unchecked AND the card disappeared.
    //
    // Post-fix with Show Resolved on: includeResolved=true round-trips, the
    // server returns the row with status=completed, the client's pending
    // guard preserves optimistic state through the refetch, the rebuild
    // re-flags it from the server response, and the visual stays consistent.
    const title = `[${tag}] yesterday-overdue-then-complete`;
    const taskId = await seedTask({
      practiceId,
      title,
      assignedTo: staffMemberId,
      status: 'overdue',
      dueDate: isoDaysAgo(1),
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_EMAIL);
    await page.goto('/tasks');

    // The row loads via the server's `status.eq.overdue` clause — visible
    // even with Show Resolved off.
    const card = cardByTitle(page, title);
    await expect(card).toBeVisible();

    // Turn Show Resolved on so the row stays visible after we mark it
    // complete. The toggle triggers a refetch (assigned + pool); wait for
    // both to settle before we click the completion toggle.
    await openFilters(page);
    const refetchAfterToggle = Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/tasks?') && res.request().method() === 'GET' && res.ok(),
      ),
      page.waitForResponse((res) =>
        res.url().includes('/api/tasks?') &&
        res.url().includes('pool=true') &&
        res.request().method() === 'GET' &&
        res.ok(),
      ),
    ]);
    await page.getByRole('button', { name: 'Show Resolved' }).click();
    await refetchAfterToggle;

    // Click the card's completion toggle. Optimistic flip lands first.
    const toggle = card.getByRole('button', { name: 'Mark complete' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const patchAndRefetch = Promise.all([
      page.waitForResponse((res) =>
        res.url().includes(`/api/tasks/${taskId}`) &&
        res.request().method() === 'PATCH' &&
        res.ok(),
      ),
      // The toggle handler fires refetchAll() → both assigned + pool GETs.
      page.waitForResponse((res) =>
        res.url().includes('/api/tasks?') &&
        res.request().method() === 'GET' &&
        res.ok(),
      ),
    ]);
    await toggle.click();
    await patchAndRefetch;

    // Card stays visible AND checked after the refetch reconciles.
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'Mark incomplete' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('Show Resolved toggles a yesterday-completed row in and out of view', async ({ page }) => {
    // Pre-fix: this row never appeared regardless of toggle state — the
    // server's loadTasks OR clauses always excluded
    // status IN (completed, skipped) on prior-due rows.
    // Post-fix: includeResolved=true adds a
    // `due_date.lt.<today> AND status IN (completed, skipped)` clause, so
    // the row surfaces when Show Resolved is on.
    const title = `[${tag}] yesterday-already-completed`;
    const taskId = await seedTask({
      practiceId,
      title,
      assignedTo: staffMemberId,
      status: 'completed',
      dueDate: isoDaysAgo(1),
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_EMAIL);
    await page.goto('/tasks');

    // Initial board: Show Resolved off, the resolved-yesterday row is hidden.
    // Use a short timeout assertion — Playwright's default `not.toBeVisible`
    // would still wait the full expect timeout, which is fine but slow.
    await expect(cardByTitle(page, title)).toHaveCount(0);

    // Turn Show Resolved on; wait for the resulting refetch.
    await openFilters(page);
    const refetchOn = page.waitForResponse((res) =>
      res.url().includes('/api/tasks?') &&
      res.url().includes('includeResolved=true') &&
      res.request().method() === 'GET' &&
      res.ok(),
    );
    await page.getByRole('button', { name: 'Show Resolved' }).click();
    await refetchOn;

    // The yesterday-completed row now renders.
    await expect(cardByTitle(page, title)).toBeVisible();

    // Turning Show Resolved back off hides it again — same refetch shape but
    // without the includeResolved query param.
    const refetchOff = page.waitForResponse((res) => {
      const url = res.url();
      return url.includes('/api/tasks?') &&
        !url.includes('includeResolved=true') &&
        res.request().method() === 'GET' &&
        res.ok();
    });
    await page.getByRole('button', { name: 'Show Resolved' }).click();
    await refetchOff;
    await expect(cardByTitle(page, title)).toHaveCount(0);
  });

  test('PATCH failure surfaces the API error in the toast (not the generic "Failed to update status" fallback)', async ({ page }) => {
    // Pre-fix: the toggle handler fell back to "Failed to update status"
    // whenever res.json() couldn't yield a string `error` field. Post-fix
    // it prefers data.error, then `${status} ${statusText}`, never the
    // generic fallback.
    //
    // We simulate a failing PATCH via page.route() so we don't depend on
    // server-side state to engineer a 4xx.
    const title = `[${tag}] toast-diagnostic`;
    const taskId = await seedTask({
      practiceId,
      title,
      assignedTo: staffMemberId,
      status: 'not_started',
    });
    createdTaskIds.push(taskId);

    const apiErrorMessage = 'Synthetic error from test route handler';
    await page.route(`**/api/tasks/${taskId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ error: apiErrorMessage }),
        });
        return;
      }
      await route.continue();
    });

    await loginAs(page, STAFF_EMAIL);
    await page.goto('/tasks');

    const card = cardByTitle(page, title);
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: 'Mark complete' }).click();

    // Toast should appear with the synthetic API error string verbatim.
    const toast = page.getByRole('alert').filter({ hasText: 'Could not update task' });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(apiErrorMessage);
    await expect(toast).not.toContainText('Failed to update status');

    // And the optimistic flip rolls back since PATCH didn't succeed.
    await expect(card.getByRole('button', { name: 'Mark complete' }))
      .toHaveAttribute('aria-pressed', 'false');
  });
});
