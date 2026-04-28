import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedTask, deleteTask, adminClient } from '../../helpers/seed-task';

/**
 * Assign task to a role (not a person) — Launch checklist Tier 1.4
 *
 * Verifies that a task created with `assigned_role_id` set and `assigned_to`
 * null is:
 *   1. Persisted with the right shape (data integrity).
 *   2. Visible to staff who hold that practice_role via the pool view.
 *   3. Readable by admin via /api/tasks/[id].
 *
 * ⚠ V1 visibility semantics (per src/lib/task-scope.ts, buildPoolScopeOr):
 *   pool tasks are universal — every authenticated practice member sees every
 *   pool task, regardless of role. Tightening pool scope to honor
 *   `assigned_role_id` (e.g. only show role-tagged pool tasks to that role's
 *   members) is logged as a follow-up in the scope helper itself. The
 *   `non-role staff don't see it` test below is `test.skip`-marked until
 *   pool scope tightens.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';
const STAFF_DA_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant role
const STAFF_FD_EMAIL = 'nick+frontdesk@brikdesigns.com'; // Business Administrator role

const TARGET_ROLE_NAME = 'Dental Assistant';

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function fetchPoolTaskIds(page: Page): Promise<Set<string>> {
  const res = await page.request.get('/api/tasks?pool=true');
  expect(res.ok(), `expected GET /api/tasks?pool=true 2xx, got ${res.status()}`).toBe(true);
  const list = await res.json();
  return new Set((Array.isArray(list) ? list : []).map((t: { id: string }) => t.id));
}

async function getRoleIdByName(practiceId: string, name: string): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('practice_role_types')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('name', name)
    .single();
  if (error || !data) throw new Error(`Role "${name}" not found in practice ${practiceId}: ${error?.message}`);
  return data.id;
}

test.describe('Assign task to a role (Tier 1.4)', () => {
  let practiceId: string;
  let targetRoleId: string;
  const tag = `qa-assign-role-${Date.now()}`;
  const createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const admin = await getMemberByEmail(ADMIN_EMAIL);
    practiceId = admin.practiceId;
    targetRoleId = await getRoleIdByName(practiceId, TARGET_ROLE_NAME);
  });

  test.afterAll(async () => {
    await Promise.all(createdTaskIds.map(deleteTask));
  });

  test('a role-assigned task persists with assigned_role_id and null assigned_to', async () => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] role-assigned`,
      assignedTo: null,
      assignedRoleId: targetRoleId,
    });
    createdTaskIds.push(taskId);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('id, assigned_to, assigned_role_id')
      .eq('id', taskId)
      .single();
    expect(error?.message).toBeUndefined();
    expect(data?.assigned_to).toBeNull();
    expect(data?.assigned_role_id).toBe(targetRoleId);
  });

  test('staff in the assigned role sees the task on pool view', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] role-staff-sees`,
      assignedTo: null,
      assignedRoleId: targetRoleId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_DA_EMAIL);
    const visible = await fetchPoolTaskIds(page);
    expect(visible.has(taskId), 'staff with the assigned role should see this pool task').toBe(true);
  });

  test('admin can read the role-assigned task by id', async ({ page }) => {
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] admin-read-by-id`,
      assignedTo: null,
      assignedRoleId: targetRoleId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, ADMIN_EMAIL);
    const res = await page.request.get(`/api/tasks/${taskId}`);
    expect(res.ok(), `expected /api/tasks/${taskId} 2xx, got ${res.status()}`).toBe(true);
    const body = await res.json();
    // The endpoint flattens to TaskViewData shape — assignmentType / assignmentValue
    // expose the role assignment, not the raw FK.
    expect(body.id).toBe(taskId);
    expect(body.assignmentType).toBe('role');
    expect(body.assignmentValue).toBe(TARGET_ROLE_NAME);
  });

  test.skip('staff NOT in the assigned role does not see the task — pool scope universal in V1', async ({ page }) => {
    // Tracking: V1 pool scope is universal (buildPoolScopeOr returns null for
    // every scope). Once pool tasks gain meaningful department tagging, tighten
    // the scope helper so role-tagged pool tasks only surface to that role's
    // members. Remove `skip` once the helper is updated.
    const taskId = await seedTask({
      practiceId,
      title: `[${tag}] non-role-staff-cant-see`,
      assignedTo: null,
      assignedRoleId: targetRoleId,
    });
    createdTaskIds.push(taskId);

    await loginAs(page, STAFF_FD_EMAIL); // Business Administrator, not Dental Assistant
    const visible = await fetchPoolTaskIds(page);
    expect(visible.has(taskId), 'staff in a different role should NOT see role-tagged pool task').toBe(false);
  });
});
