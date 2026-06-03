import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Regression check for [#203] — `raw_user_meta_data.system_role` retirement.
 *
 * After migration 00049, `profiles.system_role` is the only source of truth
 * for permission tier. Any reintroduction of `system_role` into auth metadata
 * (via a new seed, a renegade `admin.createUser()` call, or a manual edit)
 * is the drift surface this issue closed.
 *
 * This test enforces the invariant directly against the staging auth schema,
 * so the next CI run after a regression fails loudly. Running it locally as a
 * pre-launch smoke is also fine — same shape.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

describe('auth.users metadata invariants (#203)', () => {
  test('no auth.user has system_role in user_metadata', async () => {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(`admin.listUsers failed: ${error.message}`);

    const drift = data.users.filter(
      (u) => u.user_metadata && u.user_metadata.system_role !== undefined,
    );

    if (drift.length > 0) {
      const offenders = drift.map((u) => `${u.email} (id=${u.id})`).join('\n  ');
      throw new Error(
        `Drift detected: ${drift.length} auth.user(s) carry user_metadata.system_role.\n` +
          `  ${offenders}\n` +
          `Per migration 00049, profiles.system_role is the only source of truth. ` +
          `Strip the field via: UPDATE auth.users SET raw_user_meta_data = ` +
          `raw_user_meta_data - 'system_role' WHERE id = '<id>';`,
      );
    }

    expect(drift.length).toBe(0);
  });
});
