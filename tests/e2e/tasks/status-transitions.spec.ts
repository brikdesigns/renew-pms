import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedTask, deleteTask, adminClient } from '../../helpers/seed-task';

/**
 * Task status transitions — Launch checklist Tier 1.7
 *
 * Drives the seven-state task enum through `PATCH /api/tasks/[id]` and
 * verifies the API contract:
 *
 *   - Forward path: not_started → in_progress → awaiting_approval → completed
 *   - `completed_at` is auto-set when transitioning TO completed, cleared when
 *     leaving completed.
 *   - Branches `blocked` and `skipped` are reachable from active states.
 *   - All seven enum values are accepted at the DB level.
 *
 * ⚠ Coverage gap surfaced: the launch-checklist row promises "overdue
 *   triggers when past due_date" but no app code or DB trigger flips a task
 *   TO `overdue`. The /api/tasks read filter detects past-due daily/per_shift
 *   tasks at query time without setting the status, and there's no cron job
 *   that updates the column. Writing the status manually works (covered by
 *   `accepts every status value`) but auto-derivation is unimplemented. The
 *   `auto-overdue` test below is `test.skip`-marked as a tracking signal.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';

const STATUSES = [
  'not_started',
  'in_progress',
  'awaiting_approval',
  'completed',
  'blocked',
  'skipped',
  'overdue',
] as const;

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function patchStatus(page: Page, taskId: string, status: string) {
  const res = await page.request.patch(`/api/tasks/${taskId}`, { data: { status } });
  expect(res.ok(), `expected PATCH 2xx for status=${status}, got ${res.status()}`).toBe(true);
  return res.json();
}

async function readTask(taskId: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, status, completed_at')
    .eq('id', taskId)
    .single();
  if (error || !data) throw new Error(`Failed to read task ${taskId}: ${error?.message}`);
  return data;
}

test.describe('Task status transitions (Tier 1.7)', () => {
  let practiceId: string;
  let adminMemberId: string;
  const tag = `qa-status-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const admin = await getMemberByEmail(ADMIN_EMAIL);
    practiceId = admin.practiceId;
    adminMemberId = admin.memberId;
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('forward path: not_started → in_progress → awaiting_approval → completed sets completed_at', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] forward-path`,
      assignedTo: adminMemberId,
      status: 'not_started',
    });
    createdTaskIds.push(taskId);

    await loginAs(page, ADMIN_EMAIL);

    // Sanity: fresh task has no completed_at.
    expect((await readTask(taskId)).completed_at).toBeNull();

    await patchStatus(page, taskId, 'in_progress');
    expect((await readTask(taskId)).status).toBe('in_progress');

    await patchStatus(page, taskId, 'awaiting_approval');
    expect((await readTask(taskId)).status).toBe('awaiting_approval');

    await patchStatus(page, taskId, 'completed');
    const completed = await readTask(taskId);
    expect(completed.status).toBe('completed');
    expect(completed.completed_at).not.toBeNull();
  });

  test('moving away from completed clears completed_at', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] reopen`,
      assignedTo: adminMemberId,
      status: 'completed',
    });
    createdTaskIds.push(taskId);

    await loginAs(page, ADMIN_EMAIL);

    // Force completed_at on the seeded "completed" task so we can verify the
    // API clears it when status moves elsewhere. (seed-task doesn't set
    // completed_at directly; we patch through the API to get the side effect.)
    await patchStatus(page, taskId, 'in_progress');
    await patchStatus(page, taskId, 'completed');
    expect((await readTask(taskId)).completed_at).not.toBeNull();

    await patchStatus(page, taskId, 'in_progress');
    const reopened = await readTask(taskId);
    expect(reopened.status).toBe('in_progress');
    expect(reopened.completed_at).toBeNull();
  });

  test('blocked and skipped are reachable from active states', async ({ page }) => {
    const blockedTaskId = await seedTask({
      practiceId,
      title: `[${tag}] blocked-branch`,
      assignedTo: adminMemberId,
      status: 'in_progress',
    });
    createdTaskIds.push(blockedTaskId);

    const skippedTaskId = await seedTask({
      practiceId,
      title: `[${tag}] skipped-branch`,
      assignedTo: adminMemberId,
      status: 'not_started',
    });
    createdTaskIds.push(skippedTaskId);

    await loginAs(page, ADMIN_EMAIL);

    await patchStatus(page, blockedTaskId, 'blocked');
    expect((await readTask(blockedTaskId)).status).toBe('blocked');

    await patchStatus(page, skippedTaskId, 'skipped');
    expect((await readTask(skippedTaskId)).status).toBe('skipped');
  });

  test('every enum value is accepted by the DB', async () => {
    // Direct DB inserts — exercises the CHECK constraint without going through
    // the API. If a status enum value were ever removed, this test catches it
    // before any spec relying on that value silently misbehaves.
    for (const status of STATUSES) {
      const taskId = await seedTask({
        practiceId,
        title: `[${tag}] enum-${status}`,
        assignedTo: adminMemberId,
        status,
      });
      createdTaskIds.push(taskId);
      const fresh = await readTask(taskId);
      expect(fresh.status).toBe(status);
    }
  });

  test.skip('overdue is auto-set when due_date is in the past — auto-trigger does not exist', () => {
    // Tracking: launch-checklist row 1.7 promises "overdue triggers when past
    // due_date" but the codebase has no app- or DB-level trigger that flips a
    // task's status TO `overdue`. The UI treats past-due daily/per_shift tasks
    // AS overdue at query time (filter logic in /api/tasks), so a status of
    // `overdue` is currently only ever set manually. Remove `skip` once the
    // auto-derivation is implemented (cron, trigger, or post-save hook).
  });
});
