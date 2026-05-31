import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * task_reset_cadence column — Integration tests (#343)
 *
 * Verifies:
 *   1. Admin can write and read all valid cadence values ('daily', 'weekly', 'monthly').
 *   2. NULL is accepted (inherits from frequency — the default).
 *   3. The DB check constraint rejects invalid values.
 *
 * The PUT /api/templates/[id] 403 for non-admins is enforced by
 * requirePracticeAdmin in the route handler, which is already exercised by
 * tests/integration/auth-no-system-role-metadata.test.ts and the e2e
 * permissions suite.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const RENEW_DENTAL_SLUG = 'renew-dental';

describe('task_reset_cadence column (service-role writes)', () => {
  let practiceId: string;
  const createdTemplateIds: string[] = [];

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
    if (createdTemplateIds.length) {
      await supabase.from('tasks').delete().in('template_id', createdTemplateIds);
      await supabase.from('checklist_items').delete().in('template_id', createdTemplateIds);
      await supabase.from('task_templates').delete().in('id', createdTemplateIds);
      createdTemplateIds.length = 0;
    }
  });

  async function createWeeklyTemplate(suffix: string, cadence: string | null): Promise<string> {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA #343] ${suffix} ${Date.now()}`,
        type: 'checklist',
        frequency: 'weekly',
        priority: 'medium',
        status: 'draft',
        assignment_mode: 'pool',
        task_reset_cadence: cadence,
      })
      .select('id, task_reset_cadence')
      .single();

    if (error || !data) throw new Error(`template insert failed: ${error?.message}`);
    createdTemplateIds.push(data.id);
    return data.id;
  }

  test('null cadence is accepted (inherits from frequency)', async () => {
    const templateId = await createWeeklyTemplate('null-cadence', null);

    const { data, error } = await supabase
      .from('task_templates')
      .select('task_reset_cadence')
      .eq('id', templateId)
      .single();

    expect(error?.message).toBeUndefined();
    expect(data?.task_reset_cadence).toBeNull();
  });

  test.each(['daily', 'weekly', 'monthly'] as const)(
    'valid cadence "%s" is written and read back correctly',
    async (cadence) => {
      const templateId = await createWeeklyTemplate(`cadence-${cadence}`, cadence);

      const { data, error } = await supabase
        .from('task_templates')
        .select('task_reset_cadence')
        .eq('id', templateId)
        .single();

      expect(error?.message).toBeUndefined();
      expect(data?.task_reset_cadence).toBe(cadence);
    },
  );

  test('invalid cadence value is rejected by the check constraint', async () => {
    const { error } = await supabase
      .from('task_templates')
      .insert({
        practice_id: practiceId,
        name: `[QA #343] invalid-cadence ${Date.now()}`,
        type: 'checklist',
        frequency: 'weekly',
        priority: 'medium',
        status: 'draft',
        assignment_mode: 'pool',
        task_reset_cadence: 'hourly',
      })
      .select('id')
      .single();

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/violates check constraint/i);
  });

  test('cadence can be updated from null to a value and back to null', async () => {
    const templateId = await createWeeklyTemplate('update-cadence', null);

    await supabase
      .from('task_templates')
      .update({ task_reset_cadence: 'monthly' })
      .eq('id', templateId);

    const { data: after } = await supabase
      .from('task_templates')
      .select('task_reset_cadence')
      .eq('id', templateId)
      .single();
    expect(after?.task_reset_cadence).toBe('monthly');

    await supabase
      .from('task_templates')
      .update({ task_reset_cadence: null })
      .eq('id', templateId);

    const { data: cleared } = await supabase
      .from('task_templates')
      .select('task_reset_cadence')
      .eq('id', templateId)
      .single();
    expect(cleared?.task_reset_cadence).toBeNull();
  });
});
