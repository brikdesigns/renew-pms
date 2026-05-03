/**
 * Renew Dental — silent user provisioning for 2026-05-04 beta launch.
 *
 * Creates auth.users + profiles + practice_members for the 18 Active employees
 * from the Notion employee directory. No emails fire (email_confirm: true).
 *
 * Idempotent: detects pre-existing auth.users by email and skips creation,
 * still creates / upserts profile + practice_member rows.
 *
 * Usage:
 *   npx tsx scripts/migration/provision-users.ts            # dry-run
 *   npx tsx scripts/migration/provision-users.ts --execute  # write to prod
 */

import { createClient, type User } from '@supabase/supabase-js';
import { parse as dotenvParse } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ─── Load prod env directly (no .env.local override) ───────────────────────

const PROD_ENV_PATH = resolve(process.env.HOME!, '.secrets', 'renew-pms-prod.env');
if (!existsSync(PROD_ENV_PATH)) {
  console.error(`Missing prod env: ${PROD_ENV_PATH}`);
  process.exit(1);
}
const env = dotenvParse(readFileSync(PROD_ENV_PATH));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROD_REF_EXPECTED = 'bbuimkdpmuggrszwenmg';
const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
if (ref !== PROD_REF_EXPECTED) {
  console.error(`Refusing: expected prod ref ${PROD_REF_EXPECTED}, got ${ref}`);
  process.exit(1);
}

// ─── State (from prior migration) ───────────────────────────────────────────

const PROD_PRACTICE_ID = 'cf392bc9-d987-4ce4-acec-b65133b5a24e';

// ─── CLI ────────────────────────────────────────────────────────────────────

const EXECUTE = process.argv.includes('--execute');
const DRY_RUN = !EXECUTE;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// ─── User dataset (Active staff, 2026-05-03) ────────────────────────────────

type SystemRole = 'admin' | 'manager' | 'staff';
type EmployeeType = 'new' | 'maturing' | 'proficient';

interface UserSpec {
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  system_role: SystemRole;
  practice_role_name: string;
  employee_type: EmployeeType;
}

const USERS: UserSpec[] = [
  // Practice admins
  { email: 'drgray@renewdentaltn.com',     first_name: 'Dani',     last_name: 'Gray',      full_name: 'Dr. Dani Gray',           system_role: 'admin', practice_role_name: 'Owner',                       employee_type: 'proficient' },
  { email: 'chris@renewdentaltn.com',      first_name: 'Chris',    last_name: 'Gray',      full_name: 'Chris Gray',              system_role: 'admin', practice_role_name: 'Owner',                       employee_type: 'proficient' },
  { email: 'office@renewdentaltn.com',     first_name: 'Sylvia',   last_name: 'Salazar',   full_name: 'Sylvia Salazar',          system_role: 'admin', practice_role_name: 'Office Manager',              employee_type: 'proficient' },
  { email: 'operations@renewdentaltn.com', first_name: 'Autumn',   last_name: 'Weimer',    full_name: 'Autumn Weimer',           system_role: 'admin', practice_role_name: 'Clinical Manager',            employee_type: 'proficient' },
  // Business administration
  { email: 'tessakay06@hotmail.com',         first_name: 'Tessa',    last_name: 'Hernandez', full_name: 'Tessa Hernandez',         system_role: 'staff', practice_role_name: 'Lead Business Administrator', employee_type: 'proficient' },
  { email: 'konnerbarefoot123@me.com',       first_name: 'Konner',   last_name: 'Rudolph',   full_name: 'Konner Rudolph',          system_role: 'staff', practice_role_name: 'Business Administrator',      employee_type: 'proficient' },
  { email: 'samantha.rodriguez8@gmail.com',  first_name: 'Samantha', last_name: 'Rodriguez', full_name: 'Samantha Rodriguez',      system_role: 'staff', practice_role_name: 'Business Administrator',      employee_type: 'proficient' },
  { email: 'sophiamattson72@gmail.com',      first_name: 'Sophia',   last_name: 'Mattson',   full_name: 'Sophia Mattson',          system_role: 'staff', practice_role_name: 'Business Administrator',      employee_type: 'new' },
  { email: 'ivonneslife1980@gmail.com',      first_name: 'Ivonne',   last_name: 'Colon',     full_name: 'Ivonne Colon',            system_role: 'staff', practice_role_name: 'Business Administrator',      employee_type: 'maturing' },
  // Clinical — assistants
  { email: 'aviigitol0120@gmail.com', first_name: 'Avilina',   last_name: 'Igitol',   full_name: 'Avilina Igitol',              system_role: 'staff', practice_role_name: 'Dental Assistant', employee_type: 'proficient' },
  { email: 'jahammond087@gmail.com',  first_name: 'Jordan',    last_name: 'Johnston', full_name: 'Jordan Johnston',             system_role: 'staff', practice_role_name: 'Dental Assistant', employee_type: 'proficient' },
  { email: 'shelby2219@gmail.com',    first_name: 'Shelby',    last_name: 'Smith',    full_name: 'Shelby Smith',                system_role: 'staff', practice_role_name: 'Dental Assistant', employee_type: 'maturing' },
  { email: 'ely23carrillo@gmail.com', first_name: 'Elizabeth', last_name: 'Carrillo', full_name: 'Elizabeth (Ely) Carrillo',    system_role: 'staff', practice_role_name: 'Dental Assistant', employee_type: 'proficient' },
  // Clinical — hygienists
  { email: 'destinykerrda@gmail.com', first_name: 'Destiny', last_name: 'Mora',    full_name: 'Destiny Mora',    system_role: 'staff', practice_role_name: 'Dental Hygienist', employee_type: 'proficient' },
  { email: 'oliviamoreland@gmail.com', first_name: 'Olivia',  last_name: 'Biggs',   full_name: 'Olivia Biggs',    system_role: 'staff', practice_role_name: 'Dental Hygienist', employee_type: 'proficient' },
  { email: 'cleasx4@comcast.net',     first_name: 'Jo',      last_name: 'Cleasby', full_name: 'Jo Cleasby',      system_role: 'staff', practice_role_name: 'Dental Hygienist', employee_type: 'proficient' },
  { email: 'jbibee16@outlook.com',    first_name: 'Josalyn', last_name: 'Bibee',   full_name: 'Josalyn Bibee',   system_role: 'staff', practice_role_name: 'Dental Hygienist', employee_type: 'proficient' },
  { email: 'sproctor1390@gmail.com',  first_name: 'Sarah',   last_name: 'Moon',    full_name: 'Sarah Moon',      system_role: 'staff', practice_role_name: 'Dental Hygienist', employee_type: 'new' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const banner = () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Renew Dental user provisioning  |  ${DRY_RUN ? 'DRY-RUN' : '*** EXECUTE ***'}`);
  console.log(`  prod: ${ref}  |  practice: ${PROD_PRACTICE_ID}  |  ${USERS.length} users`);
  console.log('═══════════════════════════════════════════════════════════════');
};

async function buildRoleMap(): Promise<Map<string, string>> {
  const { data, error } = await sb
    .from('practice_role_types')
    .select('id, name')
    .eq('practice_id', PROD_PRACTICE_ID);
  if (error) throw new Error(`read practice_role_types: ${error.message}`);
  const map = new Map<string, string>();
  for (const r of data ?? []) map.set(r.name, r.id);
  return map;
}

async function findUserByEmail(email: string): Promise<User | null> {
  // Supabase admin listUsers paginates; for ~18 users we only need one page.
  // For larger sets, paginate via { page, perPage }.
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

// ─── Provisioning ───────────────────────────────────────────────────────────

interface ProvisionResult {
  email: string;
  user_status: 'created' | 'reused';
  profile_status: 'inserted' | 'updated' | 'unchanged';
  member_status: 'inserted' | 'unchanged';
  user_id: string;
}

async function provisionOne(spec: UserSpec, roleMap: Map<string, string>): Promise<ProvisionResult> {
  const role_id = roleMap.get(spec.practice_role_name);
  if (!role_id) {
    throw new Error(`practice_role "${spec.practice_role_name}" not found in prod (user: ${spec.email})`);
  }

  // Step 1: ensure auth.users row exists
  let user = await findUserByEmail(spec.email);
  let user_status: 'created' | 'reused' = 'reused';

  if (!user) {
    if (DRY_RUN) {
      // Pretend we'd create
      user = {
        id: '<would-mint>',
        email: spec.email,
        // ...
      } as User;
      user_status = 'created';
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: spec.email,
        email_confirm: true, // SILENT — no welcome email fires
        user_metadata: {
          full_name: spec.full_name,
          first_name: spec.first_name,
          last_name: spec.last_name,
        },
      });
      if (error) throw new Error(`createUser ${spec.email}: ${error.message}`);
      user = data.user;
      user_status = 'created';
    }
  }
  const user_id = user.id;

  // Step 2: upsert profile row
  let profile_status: 'inserted' | 'updated' | 'unchanged' = 'unchanged';
  if (DRY_RUN) {
    // Check if profile exists; describe what would happen
    if (user_id !== '<would-mint>') {
      const { data: existing } = await sb.from('profiles').select('id').eq('id', user_id).maybeSingle();
      profile_status = existing ? 'updated' : 'inserted';
    } else {
      profile_status = 'inserted';
    }
  } else {
    const { data: existing } = await sb.from('profiles').select('id').eq('id', user_id).maybeSingle();
    const profileRow = {
      id: user_id,
      email: spec.email,
      first_name: spec.first_name,
      last_name: spec.last_name,
      // full_name is a generated column (first_name + ' ' + last_name) — DB computes it.
      system_role: spec.system_role,
      is_active: true,
    };
    const { error } = await sb.from('profiles').upsert(profileRow, { onConflict: 'id' });
    if (error) throw new Error(`upsert profile ${spec.email}: ${error.message}`);
    profile_status = existing ? 'updated' : 'inserted';
  }

  // Step 3: upsert practice_members row
  let member_status: 'inserted' | 'unchanged' = 'inserted';
  if (DRY_RUN) {
    if (user_id !== '<would-mint>') {
      const { data: existingMember } = await sb
        .from('practice_members')
        .select('id')
        .eq('practice_id', PROD_PRACTICE_ID)
        .eq('user_id', user_id)
        .maybeSingle();
      member_status = existingMember ? 'unchanged' : 'inserted';
    }
  } else {
    const { data: existingMember } = await sb
      .from('practice_members')
      .select('id')
      .eq('practice_id', PROD_PRACTICE_ID)
      .eq('user_id', user_id)
      .maybeSingle();
    if (existingMember) {
      member_status = 'unchanged';
    } else {
      const { error } = await sb.from('practice_members').insert({
        practice_id: PROD_PRACTICE_ID,
        user_id,
        practice_role_id: role_id,
        employee_type: spec.employee_type,
        is_active: true,
        joined_at: new Date().toISOString(),
      });
      if (error) throw new Error(`insert practice_member ${spec.email}: ${error.message}`);
      member_status = 'inserted';
    }
  }

  return { email: spec.email, user_status, profile_status, member_status, user_id };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  banner();

  // Pre-flight: validate practice exists
  const { data: practice, error: pErr } = await sb
    .from('practices')
    .select('id, name')
    .eq('id', PROD_PRACTICE_ID)
    .maybeSingle();
  if (pErr || !practice) {
    console.error(`Refusing: practice ${PROD_PRACTICE_ID} not found on prod`);
    process.exit(1);
  }
  console.log(`Target practice: ${practice.name}\n`);

  // Pre-flight: build role map
  const roleMap = await buildRoleMap();
  for (const u of USERS) {
    if (!roleMap.has(u.practice_role_name)) {
      console.error(`Pre-flight FAILED: practice_role "${u.practice_role_name}" missing on prod (needed for ${u.email})`);
      process.exit(1);
    }
  }
  console.log(`Pre-flight: all ${USERS.length} role names resolve.\n`);

  console.log('email                              | user      | profile   | member');
  console.log('-----------------------------------|-----------|-----------|----------');
  const results: ProvisionResult[] = [];
  for (const spec of USERS) {
    try {
      const r = await provisionOne(spec, roleMap);
      results.push(r);
      console.log(
        `${spec.email.padEnd(34)} | ${r.user_status.padEnd(9)} | ${r.profile_status.padEnd(9)} | ${r.member_status}`,
      );
    } catch (e: any) {
      console.log(`${spec.email.padEnd(34)} | ERROR: ${e.message}`);
      throw e;
    }
  }

  // Summary
  console.log('');
  const counts = {
    user_created: results.filter((r) => r.user_status === 'created').length,
    user_reused: results.filter((r) => r.user_status === 'reused').length,
    member_inserted: results.filter((r) => r.member_status === 'inserted').length,
    member_unchanged: results.filter((r) => r.member_status === 'unchanged').length,
  };
  console.log(`Auth users: ${counts.user_created} created, ${counts.user_reused} reused`);
  console.log(`Practice members: ${counts.member_inserted} inserted, ${counts.member_unchanged} unchanged`);

  // Final verify (only meaningful in execute mode)
  if (!DRY_RUN) {
    const { count } = await sb
      .from('practice_members')
      .select('id', { count: 'exact', head: true })
      .eq('practice_id', PROD_PRACTICE_ID);
    console.log(`\nProd practice_members for Renew Dental: ${count}`);
  }

  console.log('\nDone.');
  if (DRY_RUN) console.log('(dry-run — no prod writes performed)');
}

main().catch((e) => {
  console.error('\nProvisioning failed:', e.message);
  process.exit(1);
});
