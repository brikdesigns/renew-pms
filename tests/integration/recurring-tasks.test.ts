import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { propagateAssignmentToTodaysTasks } from '@/app/api/templates/_helpers';

/**
 * Recurring task generation — Launch checklist Tier 1.1
 *
 * Tier 1.1 is the most-fragile workflow per the launch checklist (the only
 * row that appears in all three Notion DBs). This spec exercises the
 * generator functions directly via service-role RPC:
 *
 *   generate_daily_tasks  — migration 00045
 *   generate_weekly_tasks — migration 00052
 *   generate_monthly_tasks — migration 00053
 *
 * For each frequency, three invariants are tested:
 *   1. An active pool template generates an instance with the correct due_date.
 *   2. Re-running the generator does not duplicate (idempotency).
 *   3. Stale (past-boundary, unstarted) tasks are auto-skipped on next run.
 *
 * DST edge cases: skipped per ADR-003. The fixed UTC cron schedule is
 * acceptable for pre-launch. DST-transition tests should be added when
 * per-practice timezone support lands.
 *
 * Setup: tests run against the dev Supabase project via service-role; they
 * use the seeded "Renew Dental" practice and clean up everything they create.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const RENEW_DENTAL_SLUG = 'renew-dental';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

// Returns the ISO date of the Monday that starts the current ISO week —
// matching date_trunc('week', current_date) in PostgreSQL.
function thisWeekMondayIso(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sunday, 1=Monday, …, 6=Saturday
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  return d.toISOString().slice(0, 10);
}

// Returns the Monday one week before thisWeekMondayIso() — a safe stale date
// for weekly skip tests (always strictly before the current week boundary).
function prevWeekMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday - 7);
  return d.toISOString().slice(0, 10);
}

// Returns the ISO date of the 1st of the current month —
// matching date_trunc('month', current_date) in PostgreSQL.
function thisMonthFirstIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// Returns the 1st of the month before thisMonthFirstIso() — a safe stale date
// for monthly skip tests.
function prevMonthFirstIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// Returns the last day of the previous calendar month — used to test that the
// stale-skip condition catches non-1st due_dates (month-end overflow edge case).
// Day 0 of the current month resolves to the last day of the previous month.
function prevMonthLastDayIso(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return last.toISOString().slice(0, 10);
}

// Returns the Wednesday of the prior ISO week — a non-Monday stale date used to
// test that the stale-skip condition catches off-Monday due_dates (week-boundary
// anchor edge case). Always strictly before this week's Monday.
function prevWeekWednesdayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  // Monday of prev week + 2 days = Wednesday of prev week.
  d.setDate(d.getDate() + daysToMonday - 7 + 2);
  return d.toISOString().slice(0, 10);
}

describe('Recurring task generation (Tier 1.1)', () => {
  let practiceId: string;
  const createdTemplateIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    const { data, error } = await supabase
      .from('practices')
      .select('id')
      .eq('slug', RENEW_DENTAL_SLUG)
      .single();
    if (error || !data) {
      throw new Error(`Test practice "${RENEW_DENTAL_SLUG}" not found in dev DB: ${error?.message}`);
    }
    practiceId = data.id;
  });

  afterEach(async () => {
    // Order matters — task_checklist_items FK to tasks, tasks FK to templates.
    if (createdTaskIds.length) {
      await supabase.from('task_checklist_items').delete().in('task_id', createdTaskIds);
      await supabase.from('tasks').delete().in('id', createdTaskIds);
      createdTaskIds.length = 0;
    }
    if (createdTemplateIds.length) {
      // Tasks spawned by the generator also reference the template — sweep
      // them up too in case a test forgot to track its generated task.
      await supabase.from('tasks').delete().in('template_id', createdTemplateIds);
      await supabase.from('checklist_items').delete().in('template_id', createdTemplateIds);
      await supabase.from('task_templates').delete().in('id', createdTemplateIds);
      createdTemplateIds.length = 0;
    }
  });

  async function createDailyPoolTemplate(suffix: string): Promise<string> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA Tier 1.1] ${suffix} ${Date.now()}`,
        type: 'checklist',
        frequency: 'daily',
        priority: 'medium',
        status: 'active',
        assignment_mode: 'pool',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create test template: ${error?.message}`);
    }
    createdTemplateIds.push(data.id);
    return data.id;
  }

  async function tasksForTemplateOn(templateId: string, isoDate: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, due_date, status')
      .eq('template_id', templateId)
      .eq('due_date', isoDate);
    if (error) throw new Error(`tasks query failed: ${error.message}`);
    return data ?? [];
  }

  test('a daily pool template generates a task with today as due_date', async () => {
    const templateId = await createDailyPoolTemplate('daily-generates');

    // Sanity: starting state has no task for this template today.
    expect(await tasksForTemplateOn(templateId, todayIso())).toHaveLength(0);

    const { error } = await supabase.rpc('generate_daily_tasks', {
      p_practice_id: practiceId,
    });
    expect(error?.message).toBeUndefined();

    const after = await tasksForTemplateOn(templateId, todayIso());
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('not_started');
    after.forEach((t) => createdTaskIds.push(t.id));
  });

  test('running the generator twice does not duplicate (idempotent)', async () => {
    const templateId = await createDailyPoolTemplate('idempotent');

    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });
    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });

    const tasks = await tasksForTemplateOn(templateId, todayIso());
    expect(tasks).toHaveLength(1);
    tasks.forEach((t) => createdTaskIds.push(t.id));
  });

  test('a stale unstarted pool task from yesterday is auto-skipped on next run', async () => {
    const templateId = await createDailyPoolTemplate('stale-skip');

    const { data: stale, error: staleErr } = await supabase
      .from('tasks')
      .insert({
        practice_id: practiceId,
        title: '[QA Tier 1.1] stale yesterday task',
        template_id: templateId,
        status: 'not_started',
        priority: 'medium',
        frequency: 'daily',
        due_date: yesterdayIso(),
        assigned_to: null,
      })
      .select('id, status')
      .single();
    expect(staleErr?.message).toBeUndefined();
    if (!stale) throw new Error('expected stale task seed to succeed');
    createdTaskIds.push(stale.id);
    expect(stale.status).toBe('not_started');

    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });

    const { data: refreshed, error: refreshErr } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', stale.id)
      .single();
    expect(refreshErr?.message).toBeUndefined();
    expect(refreshed?.status).toBe('skipped');

    // Track today's auto-generated task too, for cleanup.
    const todays = await tasksForTemplateOn(templateId, todayIso());
    todays.forEach((t) => createdTaskIds.push(t.id));
  });

});

describe('Weekly task generation (Tier 1.1)', () => {
  let practiceId: string;
  const createdTemplateIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    const { data, error } = await supabase
      .from('practices')
      .select('id')
      .eq('slug', RENEW_DENTAL_SLUG)
      .single();
    if (error || !data) {
      throw new Error(`Test practice "${RENEW_DENTAL_SLUG}" not found: ${error?.message}`);
    }
    practiceId = data.id;
  });

  afterEach(async () => {
    if (createdTaskIds.length) {
      await supabase.from('task_checklist_items').delete().in('task_id', createdTaskIds);
      await supabase.from('tasks').delete().in('id', createdTaskIds);
      createdTaskIds.length = 0;
    }
    if (createdTemplateIds.length) {
      await supabase.from('tasks').delete().in('template_id', createdTemplateIds);
      await supabase.from('checklist_items').delete().in('template_id', createdTemplateIds);
      await supabase.from('task_templates').delete().in('id', createdTemplateIds);
      createdTemplateIds.length = 0;
    }
  });

  async function createWeeklyPoolTemplate(suffix: string): Promise<string> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA Tier 1.1 weekly] ${suffix} ${Date.now()}`,
        type: 'checklist',
        frequency: 'weekly',
        priority: 'medium',
        status: 'active',
        assignment_mode: 'pool',
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`Failed to create weekly template: ${error?.message}`);
    createdTemplateIds.push(data.id);
    return data.id;
  }

  async function weeklyTasksForTemplateOn(templateId: string, isoDate: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, due_date, status')
      .eq('template_id', templateId)
      .eq('due_date', isoDate);
    if (error) throw new Error(`tasks query failed: ${error.message}`);
    return data ?? [];
  }

  test('a weekly pool template generates a task due on this Monday', async () => {
    const templateId = await createWeeklyPoolTemplate('generates');
    const monday = thisWeekMondayIso();

    expect(await weeklyTasksForTemplateOn(templateId, monday)).toHaveLength(0);

    const { error } = await supabase.rpc('generate_weekly_tasks', { p_practice_id: practiceId });
    expect(error?.message).toBeUndefined();

    const after = await weeklyTasksForTemplateOn(templateId, monday);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('not_started');
    after.forEach((t) => createdTaskIds.push(t.id));
  });

  test('running the weekly generator twice does not duplicate (idempotent)', async () => {
    const templateId = await createWeeklyPoolTemplate('idempotent');
    const monday = thisWeekMondayIso();

    await supabase.rpc('generate_weekly_tasks', { p_practice_id: practiceId });
    await supabase.rpc('generate_weekly_tasks', { p_practice_id: practiceId });

    const tasks = await weeklyTasksForTemplateOn(templateId, monday);
    expect(tasks).toHaveLength(1);
    tasks.forEach((t) => createdTaskIds.push(t.id));
  });

  test('a stale unstarted weekly task from a prior Monday is auto-skipped on next run', async () => {
    const templateId = await createWeeklyPoolTemplate('stale-skip');
    const staleDate = prevWeekMondayIso();

    const { data: stale, error: staleErr } = await supabase
      .from('tasks')
      .insert({
        practice_id: practiceId,
        title: '[QA Tier 1.1 weekly] stale prior-Monday task',
        template_id: templateId,
        status: 'not_started',
        priority: 'medium',
        frequency: 'weekly',
        due_date: staleDate,
        assigned_to: null,
      })
      .select('id, status')
      .single();
    expect(staleErr?.message).toBeUndefined();
    if (!stale) throw new Error('expected stale task seed to succeed');
    createdTaskIds.push(stale.id);
    expect(stale.status).toBe('not_started');

    await supabase.rpc('generate_weekly_tasks', { p_practice_id: practiceId });

    const { data: refreshed, error: refreshErr } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', stale.id)
      .single();
    expect(refreshErr?.message).toBeUndefined();
    expect(refreshed?.status).toBe('skipped');

    const todays = await weeklyTasksForTemplateOn(templateId, thisWeekMondayIso());
    todays.forEach((t) => createdTaskIds.push(t.id));
  });

  test('stale weekly task with a non-Monday due_date is skipped and this Monday spawns (week-boundary anchor)', async () => {
    const templateId = await createWeeklyPoolTemplate('non-monday-stale');
    // Wednesday of the prior ISO week — always strictly before this week's Monday.
    const staleDate = prevWeekWednesdayIso();

    const { data: stale, error: staleErr } = await supabase
      .from('tasks')
      .insert({
        practice_id: practiceId,
        title: '[QA Tier 1.1 weekly] stale mid-week task',
        template_id: templateId,
        status: 'not_started',
        priority: 'medium',
        frequency: 'weekly',
        due_date: staleDate,
        assigned_to: null,
      })
      .select('id, status')
      .single();
    expect(staleErr?.message).toBeUndefined();
    if (!stale) throw new Error('expected stale task seed to succeed');
    createdTaskIds.push(stale.id);

    await supabase.rpc('generate_weekly_tasks', { p_practice_id: practiceId });

    const { data: refreshed, error: refreshErr } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', stale.id)
      .single();
    expect(refreshErr?.message).toBeUndefined();
    expect(refreshed?.status).toBe('skipped');

    // A new task must be anchored to Monday, not to the stale mid-week date.
    const thisWeekTasks = await weeklyTasksForTemplateOn(templateId, thisWeekMondayIso());
    expect(thisWeekTasks).toHaveLength(1);
    expect(thisWeekTasks[0].due_date).toBe(thisWeekMondayIso());
    thisWeekTasks.forEach((t) => createdTaskIds.push(t.id));
  });

  test.skip('weekly generator handles DST spring-forward and fall-back boundaries — ADR-003 deferred', () => {
    // ADR-003: DST handling is deferred for pre-launch. The fixed 05:00 UTC
    // cron (0 5 * * 1) is acceptable across US time zones at this stage.
    // Add DST-transition tests when per-practice timezone support lands.
  });
});

describe('Monthly task generation (Tier 1.1)', () => {
  let practiceId: string;
  const createdTemplateIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    const { data, error } = await supabase
      .from('practices')
      .select('id')
      .eq('slug', RENEW_DENTAL_SLUG)
      .single();
    if (error || !data) {
      throw new Error(`Test practice "${RENEW_DENTAL_SLUG}" not found: ${error?.message}`);
    }
    practiceId = data.id;
  });

  afterEach(async () => {
    if (createdTaskIds.length) {
      await supabase.from('task_checklist_items').delete().in('task_id', createdTaskIds);
      await supabase.from('tasks').delete().in('id', createdTaskIds);
      createdTaskIds.length = 0;
    }
    if (createdTemplateIds.length) {
      await supabase.from('tasks').delete().in('template_id', createdTemplateIds);
      await supabase.from('checklist_items').delete().in('template_id', createdTemplateIds);
      await supabase.from('task_templates').delete().in('id', createdTemplateIds);
      createdTemplateIds.length = 0;
    }
  });

  async function createMonthlyPoolTemplate(suffix: string): Promise<string> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA Tier 1.1 monthly] ${suffix} ${Date.now()}`,
        type: 'checklist',
        frequency: 'monthly',
        priority: 'medium',
        status: 'active',
        assignment_mode: 'pool',
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`Failed to create monthly template: ${error?.message}`);
    createdTemplateIds.push(data.id);
    return data.id;
  }

  async function monthlyTasksForTemplateOn(templateId: string, isoDate: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, due_date, status')
      .eq('template_id', templateId)
      .eq('due_date', isoDate);
    if (error) throw new Error(`tasks query failed: ${error.message}`);
    return data ?? [];
  }

  test('a monthly pool template generates a task due on the 1st of this month', async () => {
    const templateId = await createMonthlyPoolTemplate('generates');
    const monthFirst = thisMonthFirstIso();

    expect(await monthlyTasksForTemplateOn(templateId, monthFirst)).toHaveLength(0);

    const { error } = await supabase.rpc('generate_monthly_tasks', { p_practice_id: practiceId });
    expect(error?.message).toBeUndefined();

    const after = await monthlyTasksForTemplateOn(templateId, monthFirst);
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('not_started');
    after.forEach((t) => createdTaskIds.push(t.id));
  });

  test('running the monthly generator twice does not duplicate (idempotent)', async () => {
    const templateId = await createMonthlyPoolTemplate('idempotent');
    const monthFirst = thisMonthFirstIso();

    await supabase.rpc('generate_monthly_tasks', { p_practice_id: practiceId });
    await supabase.rpc('generate_monthly_tasks', { p_practice_id: practiceId });

    const tasks = await monthlyTasksForTemplateOn(templateId, monthFirst);
    expect(tasks).toHaveLength(1);
    tasks.forEach((t) => createdTaskIds.push(t.id));
  });

  test('a stale unstarted monthly task from a prior month is auto-skipped on next run', async () => {
    const templateId = await createMonthlyPoolTemplate('stale-skip');
    const staleDate = prevMonthFirstIso();

    const { data: stale, error: staleErr } = await supabase
      .from('tasks')
      .insert({
        practice_id: practiceId,
        title: '[QA Tier 1.1 monthly] stale prior-month task',
        template_id: templateId,
        status: 'not_started',
        priority: 'medium',
        frequency: 'monthly',
        due_date: staleDate,
        assigned_to: null,
      })
      .select('id, status')
      .single();
    expect(staleErr?.message).toBeUndefined();
    if (!stale) throw new Error('expected stale task seed to succeed');
    createdTaskIds.push(stale.id);
    expect(stale.status).toBe('not_started');

    await supabase.rpc('generate_monthly_tasks', { p_practice_id: practiceId });

    const { data: refreshed, error: refreshErr } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', stale.id)
      .single();
    expect(refreshErr?.message).toBeUndefined();
    expect(refreshed?.status).toBe('skipped');

    const todays = await monthlyTasksForTemplateOn(templateId, thisMonthFirstIso());
    todays.forEach((t) => createdTaskIds.push(t.id));
  });

  test('stale monthly task with end-of-month due_date (not the 1st) is skipped and this month spawns (month-end overflow)', async () => {
    const templateId = await createMonthlyPoolTemplate('end-of-month-stale');
    // Last day of prev month (e.g. Apr 30 when in May) — tests the stale-skip
    // condition across month-length differences including Feb 28/29.
    const staleDate = prevMonthLastDayIso();

    const { data: stale, error: staleErr } = await supabase
      .from('tasks')
      .insert({
        practice_id: practiceId,
        title: '[QA Tier 1.1 monthly] stale end-of-month task',
        template_id: templateId,
        status: 'not_started',
        priority: 'medium',
        frequency: 'monthly',
        due_date: staleDate,
        assigned_to: null,
      })
      .select('id, status')
      .single();
    expect(staleErr?.message).toBeUndefined();
    if (!stale) throw new Error('expected stale task seed to succeed');
    createdTaskIds.push(stale.id);

    await supabase.rpc('generate_monthly_tasks', { p_practice_id: practiceId });

    const { data: refreshed, error: refreshErr } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', stale.id)
      .single();
    expect(refreshErr?.message).toBeUndefined();
    expect(refreshed?.status).toBe('skipped');

    // A new task must be anchored to the 1st, not to the stale end-of-month date.
    const thisMonthTasks = await monthlyTasksForTemplateOn(templateId, thisMonthFirstIso());
    expect(thisMonthTasks).toHaveLength(1);
    expect(thisMonthTasks[0].due_date).toBe(thisMonthFirstIso());
    thisMonthTasks.forEach((t) => createdTaskIds.push(t.id));
  });

  test.skip('monthly generator handles DST spring-forward and fall-back boundaries — ADR-003 deferred', () => {
    // ADR-003: DST handling is deferred for pre-launch. The fixed 05:00 UTC
    // cron (0 5 1 * *) fires at midnight or 1AM local for US practices — still
    // the 1st of the month in all US zones. Add DST tests when per-practice
    // timezone support lands.
  });
});

describe('Template reassignment propagation', () => {
  let practiceId: string;
  const createdTemplateIds: string[] = [];
  const createdTaskIds: string[] = [];

  beforeAll(async () => {
    const { data, error } = await supabase
      .from('practices')
      .select('id')
      .eq('slug', RENEW_DENTAL_SLUG)
      .single();
    if (error || !data) {
      throw new Error(`Test practice "${RENEW_DENTAL_SLUG}" not found in dev DB: ${error?.message}`);
    }
    practiceId = data.id;
  });

  afterEach(async () => {
    if (createdTaskIds.length) {
      await supabase.from('task_checklist_items').delete().in('task_id', createdTaskIds);
      await supabase.from('tasks').delete().in('id', createdTaskIds);
      createdTaskIds.length = 0;
    }
    if (createdTemplateIds.length) {
      await supabase.from('tasks').delete().in('template_id', createdTemplateIds);
      await supabase.from('checklist_items').delete().in('template_id', createdTemplateIds);
      await supabase.from('task_templates').delete().in('id', createdTemplateIds);
      createdTemplateIds.length = 0;
    }
  });

  async function getTwoActiveMembers(): Promise<[string, string]> {
    const { data, error } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .limit(2);
    if (error || !data || data.length < 2) {
      throw new Error(`Need at least 2 active members in test practice: ${error?.message}`);
    }
    return [data[0].id, data[1].id];
  }

  async function createIndividualTemplate(memberId: string, suffix: string): Promise<string> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA reassign] ${suffix} ${Date.now()}`,
        type: 'checklist',
        frequency: 'daily',
        priority: 'medium',
        status: 'active',
        assignment_mode: 'individual',
        assigned_member_id: memberId,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`template insert failed: ${error?.message}`);
    createdTemplateIds.push(data.id);
    return data.id;
  }

  test('reassigning an individual template propagates to today\'s un-completed task', async () => {
    const [memberA, memberB] = await getTwoActiveMembers();
    const templateId = await createIndividualTemplate(memberA, 'reassign-individual');

    // Spawn today's task via the generator.
    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });

    // Reassign the template.
    const { data: updated, error: updateErr } = await supabase
      .from('task_templates')
      .update({ assigned_member_id: memberB })
      .eq('id', templateId)
      .select('assignment_mode, assigned_member_id, assigned_role_id, department_id')
      .single();
    expect(updateErr?.message).toBeUndefined();
    if (!updated) throw new Error('template update returned no row');

    const result = await propagateAssignmentToTodaysTasks(supabase, practiceId, templateId, updated);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.updatedCount).toBe(1);

    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('template_id', templateId);
    expect(taskErr?.message).toBeUndefined();
    expect(tasks).toHaveLength(1);
    expect(tasks?.[0].assigned_to).toBe(memberB);
    tasks?.forEach((t) => createdTaskIds.push(t.id));
  });

  test('reassignment skips tasks already in completed/skipped status', async () => {
    const [memberA, memberB] = await getTwoActiveMembers();
    const templateId = await createIndividualTemplate(memberA, 'preserve-completed');

    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });

    // Mark today's task complete before reassignment.
    const { data: tasksBefore } = await supabase
      .from('tasks')
      .select('id')
      .eq('template_id', templateId);
    const completedTaskId = tasksBefore?.[0].id;
    if (!completedTaskId) throw new Error('no spawned task to complete');
    createdTaskIds.push(completedTaskId);
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', completedTaskId);

    const { data: updated } = await supabase
      .from('task_templates')
      .update({ assigned_member_id: memberB })
      .eq('id', templateId)
      .select('assignment_mode, assigned_member_id, assigned_role_id, department_id')
      .single();
    if (!updated) throw new Error('template update returned no row');

    const result = await propagateAssignmentToTodaysTasks(supabase, practiceId, templateId, updated);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.updatedCount).toBe(0);

    const { data: after } = await supabase
      .from('tasks')
      .select('assigned_to, status')
      .eq('id', completedTaskId)
      .single();
    expect(after?.assigned_to).toBe(memberA);
    expect(after?.status).toBe('completed');
  });

  test('mode switch (individual → role) clears assigned_to and sets assigned_role_id', async () => {
    const [memberA] = await getTwoActiveMembers();
    const templateId = await createIndividualTemplate(memberA, 'mode-switch');

    await supabase.rpc('generate_daily_tasks', { p_practice_id: practiceId });

    // Pick any active practice role for the switch target.
    const { data: roles } = await supabase
      .from('practice_role_types')
      .select('id')
      .eq('practice_id', practiceId)
      .limit(1);
    const roleId = roles?.[0]?.id;
    if (!roleId) throw new Error('no practice_role_types in test practice');

    const { data: updated } = await supabase
      .from('task_templates')
      .update({ assignment_mode: 'role', assigned_member_id: null, assigned_role_id: roleId })
      .eq('id', templateId)
      .select('assignment_mode, assigned_member_id, assigned_role_id, department_id')
      .single();
    if (!updated) throw new Error('template update returned no row');

    const result = await propagateAssignmentToTodaysTasks(supabase, practiceId, templateId, updated);
    expect(result.ok).toBe(true);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, assigned_to, assigned_role_id, assigned_department')
      .eq('template_id', templateId);
    expect(tasks).toHaveLength(1);
    expect(tasks?.[0].assigned_to).toBeNull();
    expect(tasks?.[0].assigned_role_id).toBe(roleId);
    expect(tasks?.[0].assigned_department).toBeNull();
    tasks?.forEach((t) => createdTaskIds.push(t.id));
  });
});
