import { test, expect, type Page } from '@playwright/test';
import {
  getMemberByEmail,
  seedTask,
  seedChecklistItems,
  deleteTask,
  adminClient,
} from '../../helpers/seed-task';

/**
 * Staff completes a task with sign-off — Launch checklist Tier 1.2
 *
 * Drives the API contract behind the "Complete All" button on the task sheet:
 *
 *   - GET  /api/tasks/[id]/checklist  → returns the items
 *   - PATCH /api/tasks/[id]/checklist → marks items completed, sets completed_at,
 *                                       and rolls up tasks.status to 'completed'
 *                                       when every item is_completed.
 */

const TEST_PASSWORD = 'TestUser123!';
const STAFF_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant (staff)

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

interface ChecklistResponse {
  id: string;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
}

async function fetchChecklist(page: Page, taskId: string): Promise<ChecklistResponse[]> {
  const res = await page.request.get(`/api/tasks/${taskId}/checklist`);
  expect(res.ok(), `expected GET checklist 2xx, got ${res.status()}`).toBe(true);
  return res.json();
}

async function readTaskStatus(taskId: string): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single();
  if (error || !data) throw new Error(`Failed to read task ${taskId}: ${error?.message}`);
  return data.status;
}

test.describe('Staff completes a task (Tier 1.2)', () => {
  let practiceId: string;
  let staffMemberId: string;
  const tag = `qa-staff-completion-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const staff = await getMemberByEmail(STAFF_EMAIL);
    practiceId = staff.practiceId;
    staffMemberId = staff.memberId;
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('staff can fetch their assigned task\'s checklist', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] fetch-checklist`,
      assignedTo: staffMemberId,
    });
    createdTaskIds.push(taskId);

    await seedChecklistItems(taskId, practiceId, [
      { label: 'Step 1: prep tray' },
      { label: 'Step 2: position chair' },
      { label: 'Step 3: confirm patient' },
    ]);

    await loginAs(page, STAFF_EMAIL);
    const items = await fetchChecklist(page, taskId);

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.label)).toEqual([
      'Step 1: prep tray',
      'Step 2: position chair',
      'Step 3: confirm patient',
    ]);
    items.forEach((i) => expect(i.is_completed).toBe(false));
  });

  test('PATCH all items to completed marks them done with completed_at', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] complete-all`,
      assignedTo: staffMemberId,
    });
    createdTaskIds.push(taskId);

    const itemIds = await seedChecklistItems(taskId, practiceId, [
      { label: 'Sterilize instruments' },
      { label: 'Verify expiration date' },
    ]);

    await loginAs(page, STAFF_EMAIL);

    const patchRes = await page.request.patch(`/api/tasks/${taskId}/checklist`, {
      data: { items: itemIds.map((id) => ({ id, is_completed: true })) },
    });
    expect(patchRes.ok(), `expected PATCH 2xx, got ${patchRes.status()}`).toBe(true);

    const after = await fetchChecklist(page, taskId);
    expect(after).toHaveLength(2);
    after.forEach((i) => {
      expect(i.is_completed, `item "${i.label}" should be completed`).toBe(true);
      expect(i.completed_at, `item "${i.label}" should have completed_at`).not.toBeNull();
    });
  });

  test('completing every checklist item flips task status to completed', async ({ page }) => {
    // PATCH /api/tasks/[id]/checklist now rolls up to tasks.status when every
    // item is_completed. Closes the gap that caused completed tasks to
    // reappear on the board after refresh.
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] auto-status-flip`,
      assignedTo: staffMemberId,
      status: 'not_started',
    });
    createdTaskIds.push(taskId);

    const itemIds = await seedChecklistItems(taskId, practiceId, [
      { label: 'Single item' },
    ]);

    await loginAs(page, STAFF_EMAIL);
    await page.request.patch(`/api/tasks/${taskId}/checklist`, {
      data: { items: [{ id: itemIds[0], is_completed: true }] },
    });

    expect(await readTaskStatus(taskId)).toBe('completed');
  });
});
