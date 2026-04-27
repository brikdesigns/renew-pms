import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedTask, deleteTask } from '../../helpers/seed-task';

/**
 * Task visibility scope — Launch checklist Tier 0.7 (manager scoping sub-case)
 *
 * Verifies the system_role-based scope helper added in PR #44
 * (src/lib/task-scope.ts), driven through the /api/tasks endpoint:
 *
 *   - admin / brik_admin → sees all practice tasks
 *   - manager           → sees tasks tied to their department + pool
 *   - staff             → sees only tasks assigned to themselves + pool
 *
 * Strategy: seed a fresh task assigned to a specific persona and assert
 * which roles do (and don't) see it. Avoids relying on point-in-time counts
 * of pre-seeded data.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';
const MANAGER_EMAIL = 'nick+manager@brikdesigns.com';     // Clinical Manager
const STAFF_CLINICAL_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant (Clinical)
const STAFF_NONCLINICAL_EMAIL = 'nick+frontdesk@brikdesigns.com'; // Business Administrator

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function fetchTaskIds(page: Page, opts: { pool?: boolean } = {}): Promise<Set<string>> {
  // /api/tasks splits assigned vs pool views — caller picks one. The default
  // (no query) returns only assigned tasks; pool tasks live behind ?pool=true.
  const url = opts.pool ? '/api/tasks?pool=true' : '/api/tasks';
  const res = await page.request.get(url);
  expect(res.ok(), `expected ${url} 2xx, got ${res.status()}`).toBe(true);
  const body = await res.json();
  const list: { id: string }[] = Array.isArray(body) ? body : [];
  return new Set(list.map((t) => t.id));
}

test.describe('Task scope (Tier 0.7 — manager scoping)', () => {
  let practiceId: string;
  let nonClinicalStaffMemberId: string;
  let clinicalStaffMemberId: string;
  // Tag every task with a unique suffix so concurrent test runs don't collide.
  const tag = `qa-task-scope-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const admin = await getMemberByEmail(ADMIN_EMAIL);
    practiceId = admin.practiceId;

    const nonClinical = await getMemberByEmail(STAFF_NONCLINICAL_EMAIL);
    nonClinicalStaffMemberId = nonClinical.memberId;

    const clinical = await getMemberByEmail(STAFF_CLINICAL_EMAIL);
    clinicalStaffMemberId = clinical.memberId;
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('admin sees a task assigned to any practice member', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] admin-visibility-non-clinical`,
      assignedTo: nonClinicalStaffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, ADMIN_EMAIL);
    const visible = await fetchTaskIds(page);
    expect(visible.has(taskId), 'admin should see this task').toBe(true);
  });

  test('manager does NOT see a task assigned to a non-Clinical staff member', async ({ page }) => {
    // Front-desk persona is in Business Administration, not Clinical, so the
    // Clinical Manager should NOT see this task.
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] manager-cant-see-non-clinical`,
      assignedTo: nonClinicalStaffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, MANAGER_EMAIL);
    const visible = await fetchTaskIds(page);
    expect(
      visible.has(taskId),
      'Clinical manager should not see a task assigned to a Business Administration member',
    ).toBe(false);
  });

  test('staff does NOT see a task assigned to a different staff member', async ({ page }) => {
    // Task assigned to the front-desk persona — newhire (also staff, in
    // Clinical) must not see it.
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-cant-see-others`,
      assignedTo: nonClinicalStaffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_CLINICAL_EMAIL);
    const visible = await fetchTaskIds(page);
    expect(
      visible.has(taskId),
      'staff should not see a task assigned to another staff member',
    ).toBe(false);
  });

  test('staff DOES see a task assigned to themselves', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-sees-own`,
      assignedTo: clinicalStaffMemberId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_CLINICAL_EMAIL);
    const visible = await fetchTaskIds(page);
    expect(visible.has(taskId), 'staff should see their own assigned task').toBe(true);
  });

  test('staff sees pool tasks (assigned_to = null) via /api/tasks?pool=true', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] staff-sees-pool`,
      assignedTo: null,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_CLINICAL_EMAIL);
    const visible = await fetchTaskIds(page, { pool: true });
    expect(visible.has(taskId), 'staff should see pool tasks').toBe(true);
  });
});
