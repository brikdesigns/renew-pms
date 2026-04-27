import { test, expect, type Page } from '@playwright/test';
import { getMemberByEmail, seedRequest, deleteRequest, adminClient } from '../../helpers/seed-task';

/**
 * Request triage / approval guard — Launch checklist Tier 0.7
 *   "Staff cannot approve own requests"
 *
 * The requests model has no literal "approve" status; the closest analog is
 * the status pipeline (submitted → in_review → in_progress → waiting_on_vendor
 * → resolved → closed). Staff must NOT be able to triage their own request
 * through the pipeline, reassign it, set vendor, or write resolution notes.
 *
 * This PR adds an admin-only guard on PATCH /api/requests/[id] for those
 * fields. Staff can still revise their submission (title, description,
 * category, urgency, location, room, equipment) — same model as a customer
 * editing a ticket they filed.
 */

const TEST_PASSWORD = 'TestUser123!';
const ADMIN_EMAIL = 'nick+owner@brikdesigns.com';
const STAFF_EMAIL = 'nick+newhire@brikdesigns.com'; // Dental Assistant

async function loginAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

async function readRequestStatus(id: string): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('requests')
    .select('status')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(`Failed to read request ${id}: ${error?.message}`);
  return data.status;
}

test.describe('Request triage guard (Tier 0.7 — cannot approve own request)', () => {
  let practiceId: string;
  let staffMemberId: string;
  const tag = `qa-request-${Date.now()}`;
  const created: string[] = [];

  test.beforeAll(async () => {
    const staff = await getMemberByEmail(STAFF_EMAIL);
    practiceId = staff.practiceId;
    staffMemberId = staff.memberId;
  });

  test.afterAll(async () => {
    await Promise.all(created.map(deleteRequest));
  });

  test('staff cannot transition their own request through the status pipeline', async ({ page }) => {
    const id = await seedRequest({
      practiceId,
      submittedBy: staffMemberId,
      title: `[${tag}] staff-cannot-self-approve`,
      status: 'submitted',
    });
    created.push(id);

    await loginAs(page, STAFF_EMAIL);

    // Move toward "approved" / triaged states one by one — each must 403.
    for (const target of ['in_review', 'in_progress', 'resolved', 'closed']) {
      const res = await page.request.patch(`/api/requests/${id}`, { data: { status: target } });
      expect(res.status(), `staff should not set status=${target}, got ${res.status()}`).toBe(403);
    }

    expect(await readRequestStatus(id)).toBe('submitted');
  });

  test('staff cannot reassign their request', async ({ page }) => {
    const id = await seedRequest({
      practiceId,
      submittedBy: staffMemberId,
      title: `[${tag}] staff-cannot-reassign`,
    });
    created.push(id);

    await loginAs(page, STAFF_EMAIL);
    const res = await page.request.patch(`/api/requests/${id}`, {
      data: { assigned_to: staffMemberId }, // even pointing it back at themselves is forbidden
    });
    expect(res.status(), `expected 403, got ${res.status()}`).toBe(403);
  });

  test('staff cannot write resolution_notes on their request', async ({ page }) => {
    const id = await seedRequest({
      practiceId,
      submittedBy: staffMemberId,
      title: `[${tag}] staff-cannot-resolve`,
    });
    created.push(id);

    await loginAs(page, STAFF_EMAIL);
    const res = await page.request.patch(`/api/requests/${id}`, {
      data: { resolution_notes: 'Looks fine to me!' },
    });
    expect(res.status(), `expected 403, got ${res.status()}`).toBe(403);
  });

  test('staff CAN still revise non-triage fields on their submission', async ({ page }) => {
    const id = await seedRequest({
      practiceId,
      submittedBy: staffMemberId,
      title: `[${tag}] staff-can-revise`,
      description: 'Original description',
    });
    created.push(id);

    await loginAs(page, STAFF_EMAIL);
    const res = await page.request.patch(`/api/requests/${id}`, {
      data: { description: 'Adding more detail to my report' },
    });
    expect(res.ok(), `expected 2xx, got ${res.status()}`).toBe(true);

    const supabase = adminClient();
    const { data } = await supabase.from('requests').select('description').eq('id', id).single();
    expect(data?.description).toBe('Adding more detail to my report');
  });

  test('admin CAN move a request through the status pipeline', async ({ page }) => {
    const id = await seedRequest({
      practiceId,
      submittedBy: staffMemberId,
      title: `[${tag}] admin-can-triage`,
      status: 'submitted',
    });
    created.push(id);

    await loginAs(page, ADMIN_EMAIL);
    for (const target of ['in_review', 'in_progress', 'resolved']) {
      const res = await page.request.patch(`/api/requests/${id}`, { data: { status: target } });
      expect(res.ok(), `admin should set status=${target}, got ${res.status()}`).toBe(true);
    }

    expect(await readRequestStatus(id)).toBe('resolved');
  });
});
