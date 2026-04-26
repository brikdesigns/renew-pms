import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Recurring task generation — Launch checklist Tier 1.1
 *
 * Tier 1.1 is the most-fragile workflow per the launch checklist (the only
 * row that appears in all three Notion DBs). This spec exercises the
 * generator function `generate_daily_pool_tasks(p_practice_id)` directly via
 * service-role RPC, asserting the three behaviors that matter at launch:
 *
 *   1. A daily pool template generates today's task instance.
 *   2. Re-running the generator does not duplicate (idempotency).
 *   3. Stale (past-due, unstarted) pool tasks get auto-skipped on next run.
 *
 * ⚠ Coverage gap surfaced by this spec — flagged for product decision:
 *   The launch checklist promises "daily/weekly/monthly + frequency" but the
 *   generator at migration 00031/00032 only handles `daily` and `per_shift`.
 *   Templates with frequency = weekly/bi_weekly/monthly/quarterly/etc. can be
 *   created (the schema allows it) but no task ever spawns from them. The
 *   weekly+ test below is `skip`-marked with a tracking note.
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

    const { error } = await supabase.rpc('generate_daily_pool_tasks', {
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

    await supabase.rpc('generate_daily_pool_tasks', { p_practice_id: practiceId });
    await supabase.rpc('generate_daily_pool_tasks', { p_practice_id: practiceId });

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

    await supabase.rpc('generate_daily_pool_tasks', { p_practice_id: practiceId });

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

  test.skip('weekly/monthly templates also fire on the right day — generator does not yet support these frequencies', () => {
    // Tracking: generate_daily_pool_tasks (migration 00031/00032) only loops
    // over `daily` and `per_shift`. Templates with frequency in (weekly,
    // bi_weekly, monthly, quarterly, semi_annually, annually, custom) can be
    // saved but no task ever spawns from them. Until a generator extension
    // lands, launch-checklist Tier 1.1 cannot claim full coverage. Remove
    // `skip` from this test once the expanded generator is implemented.
  });
});
