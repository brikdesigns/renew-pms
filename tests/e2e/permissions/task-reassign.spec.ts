import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedTask, deleteTask, adminClient } from '../../helpers/seed-task';

/**
 * Task reassignment guard — Launch checklist Tier 0.7
 *   "Staff cannot reassign others' tasks" (and, by extension, cannot
 *    reassign their own tasks to a different person).
 *
 * Reassignment is changing `assigned_to` or `assigned_department` on an
 * existing task. PR adds an admin-only check on PATCH /api/tasks/[id]
 * for those two fields. Non-admins can still update other allowed fields
 * (e.g. status) on tasks in their scope.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';
const STAFF_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant
const OTHER_STAFF_EMAIL = 'nick+frontdesk@brikdesigns.com';

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function readAssignedTo(taskId: string): Promise<string | null> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('id', taskId)
    .single();
  if (error || !data) throw new Error(`Failed to read task ${taskId}: ${error?.message}`);
  return data.assigned_to;
}

test.describe('Task reassignment guard (Tier 0.7)', () => {
  let practiceId: string;
  let staffMemberId: string;
  let otherStaffMemberId: string;
  const tag = `qa-task-reassign-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const staff = await getMemberByEmail(STAFF_EMAIL);
    practiceId = staff.practiceId;
    staffMemberId = staff.memberId;
    otherStaffMemberId = (await getMemberByEmail(OTHER_STAFF_EMAIL)).memberId;
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('staff cannot change assigned_to on their own task', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-cannot-reassign`,
      assignedTo: staffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_EMAIL);
    const res = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { assigned_to: otherStaffMemberId },
    });
    expect(res.status(), `expected 403, got ${res.status()}`).toBe(403);

    expect(await readAssignedTo(taskId)).toBe(staffMemberId);
  });

  test('staff cannot change assigned_department on a task they can see', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-cannot-change-dept`,
      assignedTo: staffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_EMAIL);
    // Pass any non-null dept value — even an empty-string assignment is forbidden.
    const res = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { assigned_department: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.status(), `expected 403, got ${res.status()}`).toBe(403);
  });

  test('staff CAN still update non-assignment fields (status) on their task', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-can-status`,
      assignedTo: staffMemberId,
      status: 'not_started',
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_EMAIL);
    const res = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { status: 'in_progress' },
    });
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const supabase = adminClient();
    const { data } = await supabase.from('tasks').select('status').eq('id', taskId).single();
    expect(data?.status).toBe('in_progress');
  });

  test('admin CAN change assigned_to', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] admin-can-reassign`,
      assignedTo: staffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, ADMIN_EMAIL);
    const res = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { assigned_to: otherStaffMemberId },
    });
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    expect(await readAssignedTo(taskId)).toBe(otherStaffMemberId);
  });
});
