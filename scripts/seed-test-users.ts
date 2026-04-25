/**
 * Seed Test Users — Renew PMS QA Testing
 *
 * Creates 6 test personas in Supabase (auth + profiles + practice_members)
 * using the Admin API. Idempotent — safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/seed-test-users.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Test password (shared across all test personas) ────────────────────────

const TEST_PASSWORD = 'TestUser123!';

// ─── Practice info ──────────────────────────────────────────────────────────

const PRACTICE_NAME = 'Renew Dental (Test)';
const PRACTICE_SLUG = 'renew-dental-test';
const OFFICE_NAME = 'Main Office';

// ─── Testers ────────────────────────────────────────────────────────────────
// Each tester gets their own set of 6 personas via + aliases.
// Add new team members here — the rest is automatic.

interface Tester {
  name: string;
  baseEmail: string;  // e.g. 'nick@brikdesigns.com' → nick+brikadmin@brikdesigns.com
}

const TESTERS: Tester[] = [
  { name: 'Nick', baseEmail: 'nick@brikdesigns.com' },
  { name: 'Abbey', baseEmail: 'abbey@brikdesigns.com' },
];

// ─── Persona templates ──────────────────────────────────────────────────────

interface PersonaTemplate {
  key: string;
  alias: string;           // appended via + to base email
  first_name: string;
  last_name: string;
  system_role: 'brik_admin' | 'admin' | 'manager' | 'staff';
  employee_type: 'new' | 'maturing' | 'proficient';
  shift: string | null;
  practice_role_name: string;
}

const PERSONA_TEMPLATES: PersonaTemplate[] = [
  { key: 'brik_admin',       alias: 'brikadmin',  first_name: 'Brik',    last_name: 'Admin',    system_role: 'brik_admin',     employee_type: 'proficient', shift: null,       practice_role_name: '(O) Owner' },
  { key: 'practice_owner',   alias: 'owner',      first_name: 'Sarah',   last_name: 'Mitchell', system_role: 'admin',          employee_type: 'proficient', shift: 'full_day', practice_role_name: '(O) Owner' },
  { key: 'dept_manager',     alias: 'manager',    first_name: 'Jessica', last_name: 'Torres',   system_role: 'manager',        employee_type: 'proficient', shift: 'full_day', practice_role_name: 'Clinical Manager' },
  { key: 'new_hire',         alias: 'newhire',    first_name: 'Emily',   last_name: 'Rivera',   system_role: 'staff',          employee_type: 'new',        shift: 'opening',  practice_role_name: '(A) Dental Assistant' },
  { key: 'maturing_staff',   alias: 'maturing',   first_name: 'Tyler',   last_name: 'Nguyen',   system_role: 'staff',          employee_type: 'maturing',   shift: 'closing',  practice_role_name: '(A) Dental Assistant' },
  { key: 'active_hygienist', alias: 'hygienist',  first_name: 'Amanda',  last_name: 'Chen',     system_role: 'staff',          employee_type: 'proficient', shift: 'opening',  practice_role_name: '(H) Dental Hygienist' },
  { key: 'front_desk',       alias: 'frontdesk',  first_name: 'Rachel',  last_name: 'Foster',   system_role: 'staff',          employee_type: 'proficient', shift: 'full_day', practice_role_name: 'Business Administrator' },
];

// ─── Practice 2 (RLS isolation testing) ─────────────────────────────────────
// Minimal second practice so launch-checklist Tier 0.6 can prove RLS isolates
// data across tenants. Distinct emails, distinct slug — never overlaps P1.

const PRACTICE_2_NAME = 'Bayside Family Dental (Test)';
const PRACTICE_2_SLUG = 'bayside-test';
const PRACTICE_2_OFFICE = 'Main Office';

const PRACTICE_2_TEMPLATES: PersonaTemplate[] = [
  { key: 'p2_admin', alias: 'p2admin', first_name: 'Maria',  last_name: 'Hernandez', system_role: 'admin', employee_type: 'proficient', shift: 'full_day', practice_role_name: '(O) Owner' },
  { key: 'p2_staff', alias: 'p2staff', first_name: 'Daniel', last_name: 'Park',      system_role: 'staff', employee_type: 'proficient', shift: 'full_day', practice_role_name: '(A) Dental Assistant' },
];

// ─── Build full persona list from testers × templates ───────────────────────

interface Persona {
  key: string;
  tester: string;
  email: string;
  first_name: string;
  last_name: string;
  system_role: 'brik_admin' | 'admin' | 'manager' | 'staff';
  employee_type: 'new' | 'maturing' | 'proficient';
  shift: string | null;
  practice_role_name: string;
  phone: string;
}

function buildAliasEmail(baseEmail: string, alias: string): string {
  const [local, domain] = baseEmail.split('@');
  return `${local}+${alias}@${domain}`;
}

const PERSONAS: Persona[] = TESTERS.flatMap((tester, testerIdx) =>
  PERSONA_TEMPLATES.map((tmpl, tmplIdx) => ({
    key: `${tester.name.toLowerCase()}_${tmpl.key}`,
    tester: tester.name,
    email: buildAliasEmail(tester.baseEmail, tmpl.alias),
    first_name: tmpl.first_name,
    last_name: tmpl.last_name,
    system_role: tmpl.system_role,
    employee_type: tmpl.employee_type,
    shift: tmpl.shift,
    practice_role_name: tmpl.practice_role_name,
    phone: `(555) ${String(testerIdx).padStart(3, '0')}-${String(tmplIdx + 1).padStart(4, '0')}`,
  }))
);

const PRACTICE_2_PERSONAS: Persona[] = TESTERS.flatMap((tester, testerIdx) =>
  PRACTICE_2_TEMPLATES.map((tmpl, tmplIdx) => ({
    key: `${tester.name.toLowerCase()}_${tmpl.key}`,
    tester: tester.name,
    email: buildAliasEmail(tester.baseEmail, tmpl.alias),
    first_name: tmpl.first_name,
    last_name: tmpl.last_name,
    system_role: tmpl.system_role,
    employee_type: tmpl.employee_type,
    shift: tmpl.shift,
    practice_role_name: tmpl.practice_role_name,
    phone: `(555) ${String(testerIdx + 100).padStart(3, '0')}-${String(tmplIdx + 1).padStart(4, '0')}`,
  }))
);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertAuthUser(persona: Persona): Promise<string> {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === persona.email);

  if (found) {
    console.log(`  ✓ Auth user exists: ${persona.email}`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password: TEST_PASSWORD,
    email_confirm: true, // Skip email verification
    user_metadata: {
      first_name: persona.first_name,
      last_name: persona.last_name,
    },
  });

  if (error) throw new Error(`Failed to create auth user ${persona.email}: ${error.message}`);
  console.log(`  + Created auth user: ${persona.email}`);
  return data.user.id;
}

async function upsertProfile(userId: string, persona: Persona): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      system_role: persona.system_role,
      first_name: persona.first_name,
      last_name: persona.last_name,
      email: persona.email,
      phone: persona.phone,
      is_active: true,
    }, { onConflict: 'id' });

  if (error) throw new Error(`Failed to upsert profile for ${persona.email}: ${error.message}`);
  console.log(`  ✓ Profile: ${persona.first_name} ${persona.last_name} (${persona.system_role})`);
}

async function ensurePractice(): Promise<{ practiceId: string; officeId: string }> {
  // Reuse any existing practice — avoids creating duplicates that split data
  const { data: anyPractice } = await supabase
    .from('practices')
    .select('id, name')
    .limit(1)
    .single();

  let practiceId: string;

  if (anyPractice) {
    practiceId = anyPractice.id;
    console.log(`✓ Reusing existing practice: ${anyPractice.name} (${practiceId})`);
  } else {
    const { data, error } = await supabase
      .from('practices')
      .insert({
        name: PRACTICE_NAME,
        slug: PRACTICE_SLUG,
        status: 'active',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create practice: ${error.message}`);
    practiceId = data.id;
    console.log(`+ Created practice: ${PRACTICE_NAME} (${practiceId})`);
  }

  // Check for office
  const { data: existingOffice } = await supabase
    .from('offices')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(1)
    .single();

  let officeId: string;

  if (existingOffice) {
    officeId = existingOffice.id;
    console.log(`✓ Office exists: ${OFFICE_NAME} (${officeId})`);
  } else {
    const { data: office, error } = await supabase
      .from('offices')
      .insert({
        practice_id: practiceId,
        name: OFFICE_NAME,
        is_primary: true,
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create office: ${error.message}`);
    officeId = office.id;
    console.log(`+ Created office: ${OFFICE_NAME} (${officeId})`);

    // Seed practice defaults (departments, roles, rooms, etc.)
    const { error: seedError } = await supabase.rpc('seed_practice_defaults', {
      p_practice_id: practiceId,
      p_office_id: officeId,
    });

    if (seedError) {
      console.warn(`  ⚠ seed_practice_defaults failed: ${seedError.message}`);
    } else {
      console.log(`  ✓ Seeded practice defaults`);
    }
  }

  return { practiceId, officeId };
}

async function upsertPracticeMember(
  userId: string,
  practiceId: string,
  persona: Persona,
): Promise<void> {
  // Skip practice membership for brik_admin (Brik staff — cross-practice)
  if (persona.system_role === 'brik_admin') {
    console.log(`  ⏭ Skipping practice_member for brik_admin`);
    return;
  }

  // Look up the practice_role_type by name
  const { data: roleType } = await supabase
    .from('practice_role_types')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('name', persona.practice_role_name)
    .single();

  const { error } = await supabase
    .from('practice_members')
    .upsert({
      practice_id: practiceId,
      user_id: userId,
      practice_role_id: roleType?.id ?? null,
      employee_type: persona.employee_type,
      shift: persona.shift,
      is_active: true,
    }, { onConflict: 'practice_id,user_id' });

  if (error) throw new Error(`Failed to upsert practice_member for ${persona.email}: ${error.message}`);
  console.log(`  ✓ Member: ${persona.practice_role_name} / ${persona.employee_type} / shift=${persona.shift ?? 'none'}`);
}

async function ensurePractice2(): Promise<{ practiceId: string; officeId: string }> {
  // Find or create Practice 2 by slug — must stay disjoint from Practice 1
  const { data: existing } = await supabase
    .from('practices')
    .select('id, name')
    .eq('slug', PRACTICE_2_SLUG)
    .maybeSingle();

  let practiceId: string;
  if (existing) {
    practiceId = existing.id;
    console.log(`✓ Reusing Practice 2: ${existing.name} (${practiceId})`);
  } else {
    const { data, error } = await supabase
      .from('practices')
      .insert({ name: PRACTICE_2_NAME, slug: PRACTICE_2_SLUG, status: 'active' })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create Practice 2: ${error.message}`);
    practiceId = data.id;
    console.log(`+ Created Practice 2: ${PRACTICE_2_NAME} (${practiceId})`);
  }

  const { data: existingOffice } = await supabase
    .from('offices')
    .select('id')
    .eq('practice_id', practiceId)
    .limit(1)
    .maybeSingle();

  let officeId: string;
  if (existingOffice) {
    officeId = existingOffice.id;
    console.log(`✓ P2 office exists (${officeId})`);
  } else {
    const { data: office, error } = await supabase
      .from('offices')
      .insert({ practice_id: practiceId, name: PRACTICE_2_OFFICE, is_primary: true })
      .select('id')
      .single();
    if (error) throw new Error(`Failed to create P2 office: ${error.message}`);
    officeId = office.id;
    console.log(`+ Created P2 office: ${PRACTICE_2_OFFICE} (${officeId})`);

    const { error: seedError } = await supabase.rpc('seed_practice_defaults', {
      p_practice_id: practiceId,
      p_office_id: officeId,
    });
    if (seedError) {
      console.warn(`  ⚠ seed_practice_defaults failed for P2: ${seedError.message}`);
    } else {
      console.log(`  ✓ Seeded P2 practice defaults`);
    }
  }

  return { practiceId, officeId };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🦷 Renew PMS — Seed Test Users\n');
  console.log(`Target: ${supabaseUrl}`);
  console.log(`Password: ${TEST_PASSWORD}\n`);

  // 1. Ensure practice + office exist
  const { practiceId } = await ensurePractice();

  // 2. Create each persona (Practice 1)
  for (const persona of PERSONAS) {
    console.log(`\n── ${persona.key} ──`);
    const userId = await upsertAuthUser(persona);
    await upsertProfile(userId, persona);
    await upsertPracticeMember(userId, practiceId, persona);
  }

  // 3. Practice 2 — RLS isolation testing (launch-checklist Tier 0.6)
  console.log('\n══ Practice 2 (RLS isolation) ══');
  const { practiceId: practice2Id } = await ensurePractice2();
  for (const persona of PRACTICE_2_PERSONAS) {
    console.log(`\n── ${persona.key} ──`);
    const userId = await upsertAuthUser(persona);
    await upsertProfile(userId, persona);
    await upsertPracticeMember(userId, practice2Id, persona);
  }

  console.log('\n✅ All test personas seeded.\n');
  console.log('Login credentials:');
  console.log('─'.repeat(60));
  for (const tester of TESTERS) {
    console.log(`\n  ${tester.name} — Practice 1 (Renew Dental):`);
    for (const p of PERSONAS.filter((p) => p.tester === tester.name)) {
      const shortKey = p.key.replace(`${tester.name.toLowerCase()}_`, '');
      console.log(`    ${shortKey.padEnd(20)} ${p.email}`);
    }
    console.log(`\n  ${tester.name} — Practice 2 (Bayside, RLS test):`);
    for (const p of PRACTICE_2_PERSONAS.filter((p) => p.tester === tester.name)) {
      const shortKey = p.key.replace(`${tester.name.toLowerCase()}_`, '');
      console.log(`    ${shortKey.padEnd(20)} ${p.email}`);
    }
  }
  console.log(`\n  ${'password'.padEnd(20)} ${TEST_PASSWORD}`);
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
