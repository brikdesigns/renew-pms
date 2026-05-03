/**
 * Renew Dental staging → prod migration.
 *
 * Defaults to dry-run. Sub-commands run independently and idempotently.
 * Prod writes only when --execute is passed AND the project ref matches.
 *
 * Usage:
 *   npx tsx scripts/migration/migrate.ts --step a            # dry-run step a
 *   npx tsx scripts/migration/migrate.ts --step a --execute  # actually write step a to prod
 *   npx tsx scripts/migration/migrate.ts --step all          # dry-run every step
 *   npx tsx scripts/migration/migrate.ts --step verify       # row-count comparison only (read-only)
 *
 * State file: docs/migration/prod-ids.json (committed — record of what we minted)
 *
 * Steps:
 *   a — practices + offices  (mints fresh prod_practice_id)
 *   b — reference data: departments, role_types, task_types, task_categories,
 *       compliance_types, equipment_categories, supply_categories, rooms
 *   c — vendor + vendor_contacts (only Wright Technology Solutions + its contacts)
 *       + equipment (team_id forced null; teams out of scope)
 *   d — task_templates + checklist_items
 *   verify — counts on prod vs staging for the new practice
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parse as dotenvParse } from 'dotenv';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { randomUUID } from 'crypto';

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGING_REF_EXPECTED = 'zneuygoeorhkuhktmuld';
const PROD_REF_EXPECTED = 'bbuimkdpmuggrszwenmg';
const STAGING_PRACTICE_ID = 'd9f05b47-5429-41bc-aea9-79043c5c7062';
const ALLOWED_VENDOR_NAME = 'Wright Technology Solutions';
const STATE_FILE = resolve(__dirname, '..', '..', 'docs', 'migration', 'prod-ids.json');

// ─── CLI args ───────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const stepArg = argv[argv.indexOf('--step') + 1];
const EXECUTE = argv.includes('--execute');
const DRY_RUN = !EXECUTE;

if (!['a', 'b', 'c', 'd', 'all', 'verify'].includes(stepArg ?? '')) {
  console.error('Usage: --step a|b|c|d|all|verify [--execute]');
  process.exit(1);
}

// ─── Env loading (manual to avoid override pollution) ───────────────────────

function loadEnv(path: string, label: string): Record<string, string> {
  if (!existsSync(path)) {
    console.error(`Missing ${label} env file: ${path}`);
    process.exit(1);
  }
  return dotenvParse(readFileSync(path));
}

const stagingEnv = loadEnv(resolve(__dirname, '..', '..', '.env.local'), 'staging (.env.local)');
const prodEnv = loadEnv(resolve(process.env.HOME!, '.secrets', 'renew-pms-prod.env'), 'prod (~/.secrets/renew-pms-prod.env)');

const STAGING_URL = stagingEnv.NEXT_PUBLIC_SUPABASE_URL;
const STAGING_KEY = stagingEnv.SUPABASE_SERVICE_ROLE_KEY;
const PROD_URL = prodEnv.NEXT_PUBLIC_SUPABASE_URL;
const PROD_KEY = prodEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!STAGING_URL || !STAGING_KEY || !PROD_URL || !PROD_KEY) {
  console.error('Missing required env vars. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in both env files.');
  process.exit(1);
}

const stagingRef = new URL(STAGING_URL).hostname.split('.')[0];
const prodRef = new URL(PROD_URL).hostname.split('.')[0];

if (stagingRef !== STAGING_REF_EXPECTED) {
  console.error(`Refusing to run: staging URL ref is ${stagingRef}, expected ${STAGING_REF_EXPECTED}`);
  process.exit(1);
}
if (prodRef !== PROD_REF_EXPECTED) {
  console.error(`Refusing to run: prod URL ref is ${prodRef}, expected ${PROD_REF_EXPECTED}`);
  process.exit(1);
}

const sbStaging: SupabaseClient = createClient(STAGING_URL, STAGING_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sbProd: SupabaseClient = createClient(PROD_URL, PROD_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── State persistence ──────────────────────────────────────────────────────

type State = {
  staging_practice_id: string;
  prod_practice_id?: string;
  prod_office_id?: string; // preserved from staging
  minted_at?: string;
  steps: Partial<Record<'a' | 'b' | 'c' | 'd', { completed_at: string; rows_written: number }>>;
};

function loadState(): State {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  }
  return { staging_practice_id: STAGING_PRACTICE_ID, steps: {} };
}

function saveState(s: State) {
  if (DRY_RUN) {
    console.log('  [dry-run] would update state file');
    return;
  }
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const banner = () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Renew Dental migration  |  step ${stepArg}  |  ${DRY_RUN ? 'DRY-RUN' : '*** EXECUTE ***'}`);
  console.log(`  staging: ${stagingRef}  →  prod: ${prodRef}`);
  console.log('═══════════════════════════════════════════════════════════════');
};

async function readScoped<T = any>(table: string, practiceId: string): Promise<T[]> {
  const { data, error } = await sbStaging.from(table).select('*').eq('practice_id', practiceId);
  if (error) throw new Error(`read ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

async function copyTable<T extends Record<string, any>>(
  step: string,
  table: string,
  prodPracticeId: string,
  transform?: (row: T) => T | null, // return null to skip a row
): Promise<{ read: number; toWrite: number; prodCountAfter?: number }> {
  const rows = await readScoped<T>(table, STAGING_PRACTICE_ID);
  const transformed: T[] = [];
  for (const r of rows) {
    let next: any = { ...r, practice_id: prodPracticeId };
    if (transform) {
      const t = transform(next);
      if (t === null) continue;
      next = t;
    }
    transformed.push(next);
  }

  console.log(`  [${step}] ${table}: read ${rows.length} from staging, ${transformed.length} to write`);

  if (DRY_RUN) {
    return { read: rows.length, toWrite: transformed.length };
  }

  if (transformed.length === 0) return { read: rows.length, toWrite: 0, prodCountAfter: 0 };

  const { error } = await sbProd.from(table).upsert(transformed, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`write ${table}: ${error.message}`);

  const { count, error: countErr } = await sbProd
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('practice_id', prodPracticeId);
  if (countErr) throw new Error(`verify count ${table}: ${countErr.message}`);

  console.log(`  [${step}] ${table}: wrote ${transformed.length}, prod count = ${count}`);
  return { read: rows.length, toWrite: transformed.length, prodCountAfter: count ?? 0 };
}

// ─── Step a — practices + offices ───────────────────────────────────────────

async function stepA(state: State): Promise<State> {
  console.log('\n[a] practices + offices');

  if (state.prod_practice_id) {
    console.log(`  [a] prod_practice_id already minted: ${state.prod_practice_id}`);
    console.log('  [a] skipping mint. To re-mint, delete prod-ids.json and re-run.');
    return state;
  }

  // Read source practice
  const { data: stagingPractice, error: pErr } = await sbStaging
    .from('practices')
    .select('*')
    .eq('id', STAGING_PRACTICE_ID)
    .single();
  if (pErr) throw new Error(`read practice: ${pErr.message}`);

  // Read source office
  const stagingOffices = await readScoped<any>('offices', STAGING_PRACTICE_ID);
  if (stagingOffices.length !== 1) {
    throw new Error(`expected exactly 1 office in staging, got ${stagingOffices.length}`);
  }
  const stagingOffice = stagingOffices[0];

  // Mint fresh practice id; preserve staging office id (1:1)
  // In dry-run we still mint a real UUID so downstream steps can simulate
  // FK rewrites against a realistic id (the value is not persisted).
  const newPracticeId = randomUUID();
  const newOfficeId = stagingOffice.id; // preserved

  const prodPractice = {
    ...stagingPractice,
    id: newPracticeId,
  };
  const prodOffice = {
    ...stagingOffice,
    practice_id: newPracticeId,
  };

  console.log(`  [a] minted prod_practice_id: ${newPracticeId}`);
  console.log(`  [a] preserving office id: ${newOfficeId}`);

  if (DRY_RUN) {
    console.log('  [a] DRY-RUN — no writes. Would insert 1 practice + 1 office.');
    // Populate in-memory state so downstream dry-run steps can simulate.
    state.prod_practice_id = newPracticeId;
    state.prod_office_id = newOfficeId;
    return state;
  }

  const { error: insP } = await sbProd.from('practices').insert(prodPractice);
  if (insP) throw new Error(`insert practice: ${insP.message}`);
  const { error: insO } = await sbProd.from('offices').insert(prodOffice);
  if (insO) {
    // Roll back the practice insert if office fails
    await sbProd.from('practices').delete().eq('id', newPracticeId);
    throw new Error(`insert office (rolled back practice): ${insO.message}`);
  }

  console.log('  [a] inserted practice + office');

  state.prod_practice_id = newPracticeId;
  state.prod_office_id = newOfficeId;
  state.minted_at = new Date().toISOString();
  state.steps.a = { completed_at: new Date().toISOString(), rows_written: 2 };
  saveState(state);
  return state;
}

// ─── Step b — reference data ────────────────────────────────────────────────

async function stepB(state: State): Promise<State> {
  console.log('\n[b] reference data');
  if (!state.prod_practice_id) throw new Error('step a must complete first');
  const pid = state.prod_practice_id;

  // Order matters: parents before children (FK chain within step b).
  const tables = [
    'departments',
    'practice_role_types', // FK → departments
    'task_types',
    'task_categories',
    'compliance_types',
    'equipment_categories',
    'supply_categories', // FK → departments
    'rooms', // FK → offices (from step a)
  ];

  let total = 0;
  for (const t of tables) {
    const { toWrite } = await copyTable(`b/${t}`, t, pid);
    total += toWrite;
  }

  state.steps.b = { completed_at: new Date().toISOString(), rows_written: total };
  saveState(state);
  return state;
}

// ─── Step c — vendor + vendor_contacts + equipment ──────────────────────────

async function stepC(state: State): Promise<State> {
  console.log('\n[c] vendor + vendor_contacts + equipment');
  if (!state.prod_practice_id) throw new Error('step a must complete first');
  const pid = state.prod_practice_id;

  // 1. Find the allowed vendor in staging (Wright Technology Solutions only)
  const { data: stagingVendors, error: vErr } = await sbStaging
    .from('vendors')
    .select('*')
    .eq('practice_id', STAGING_PRACTICE_ID)
    .eq('name', ALLOWED_VENDOR_NAME);
  if (vErr) throw new Error(`read vendors: ${vErr.message}`);
  if (!stagingVendors || stagingVendors.length === 0) {
    throw new Error(`vendor "${ALLOWED_VENDOR_NAME}" not found in staging`);
  }
  const allowedVendorId = stagingVendors[0].id;
  console.log(`  [c] allowed vendor id: ${allowedVendorId}`);

  // 2. Insert vendor (rewrite practice_id; preserve id)
  const vendorRow = { ...stagingVendors[0], practice_id: pid };
  if (!DRY_RUN) {
    const { error } = await sbProd.from('vendors').upsert([vendorRow], { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(`write vendor: ${error.message}`);
  }
  console.log(`  [c] vendors: ${DRY_RUN ? 'would write 1 (Wright Technology Solutions)' : 'wrote 1'}`);

  // 3. vendor_contacts for that vendor only
  const { data: stagingContacts, error: cErr } = await sbStaging
    .from('vendor_contacts')
    .select('*')
    .eq('practice_id', STAGING_PRACTICE_ID)
    .eq('vendor_id', allowedVendorId);
  if (cErr) throw new Error(`read vendor_contacts: ${cErr.message}`);
  const contactRows = (stagingContacts ?? []).map((r) => ({ ...r, practice_id: pid }));
  if (!DRY_RUN && contactRows.length > 0) {
    const { error } = await sbProd
      .from('vendor_contacts')
      .upsert(contactRows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(`write vendor_contacts: ${error.message}`);
  }
  console.log(`  [c] vendor_contacts: ${DRY_RUN ? `would write ${contactRows.length}` : `wrote ${contactRows.length}`}`);

  // 4. Equipment — null team_id; null vendor_id if it points to a non-allowed vendor
  const eqResult = await copyTable('c/equipment', 'equipment', pid, (row: any) => {
    const next = { ...row, team_id: null };
    if (next.vendor_id && next.vendor_id !== allowedVendorId) {
      next.vendor_id = null;
    }
    return next;
  });

  state.steps.c = {
    completed_at: new Date().toISOString(),
    rows_written: 1 + contactRows.length + eqResult.toWrite,
  };
  saveState(state);
  return state;
}

// ─── Step d — task_templates + checklist_items ──────────────────────────────

async function stepD(state: State): Promise<State> {
  console.log('\n[d] task_templates + checklist_items');
  if (!state.prod_practice_id) throw new Error('step a must complete first');
  const pid = state.prod_practice_id;

  const t = await copyTable('d/task_templates', 'task_templates', pid);
  const c = await copyTable('d/checklist_items', 'checklist_items', pid);

  state.steps.d = {
    completed_at: new Date().toISOString(),
    rows_written: t.toWrite + c.toWrite,
  };
  saveState(state);
  return state;
}

// ─── verify — count comparison ──────────────────────────────────────────────

async function verify(state: State): Promise<void> {
  console.log('\n[verify] row-count comparison');
  if (!state.prod_practice_id) {
    console.log('  no prod_practice_id in state — nothing to verify yet.');
    return;
  }
  const pid = state.prod_practice_id;

  const tables = [
    'practices', // counted by id, not practice_id
    'offices',
    'departments',
    'practice_role_types',
    'task_types',
    'task_categories',
    'compliance_types',
    'equipment_categories',
    'supply_categories',
    'rooms',
    'vendors',
    'vendor_contacts',
    'equipment',
    'task_templates',
    'checklist_items',
  ];

  // Compute expected counts dynamically from staging.
  // Special cases: practices is always 1 (single row by id); vendors + vendor_contacts
  // are filtered to the allowed vendor only.
  async function stagingCount(table: string): Promise<number> {
    let q = sbStaging.from(table).select('id', { count: 'exact', head: true });
    if (table === 'practices') {
      q = q.eq('id', STAGING_PRACTICE_ID);
    } else if (table === 'vendors') {
      q = q.eq('practice_id', STAGING_PRACTICE_ID).eq('name', ALLOWED_VENDOR_NAME);
    } else if (table === 'vendor_contacts') {
      // Resolve allowed vendor id, then count contacts for it
      const { data: v } = await sbStaging
        .from('vendors')
        .select('id')
        .eq('practice_id', STAGING_PRACTICE_ID)
        .eq('name', ALLOWED_VENDOR_NAME)
        .single();
      if (!v) return 0;
      q = q.eq('practice_id', STAGING_PRACTICE_ID).eq('vendor_id', v.id);
    } else {
      q = q.eq('practice_id', STAGING_PRACTICE_ID);
    }
    const { count } = await q;
    return count ?? 0;
  }

  console.log('  table                     | expected |    prod |  match');
  console.log('  --------------------------|---------:|--------:|-------');
  let mismatchCount = 0;
  for (const t of tables) {
    const expected = await stagingCount(t);
    let q = sbProd.from(t).select('id', { count: 'exact', head: true });
    if (t === 'practices') {
      q = q.eq('id', pid);
    } else {
      q = q.eq('practice_id', pid);
    }
    const { count, error } = await q;
    if (error) {
      console.log(`  ${t.padEnd(25)} | ERROR: ${error.message}`);
      mismatchCount++;
      continue;
    }
    const match = count === expected ? '✓' : '✗';
    if (match === '✗') mismatchCount++;
    console.log(
      `  ${t.padEnd(25)} | ${String(expected).padStart(8)} | ${String(count ?? 0).padStart(7)} |  ${match}`,
    );
  }

  if (mismatchCount > 0) {
    console.log(`\n  ${mismatchCount} mismatches — investigate before declaring done.`);
  } else {
    console.log('\n  All counts match expected. ✓');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  banner();
  let state = loadState();
  console.log(`  state: ${existsSync(STATE_FILE) ? STATE_FILE : '(no state file yet)'}`);

  switch (stepArg) {
    case 'a':
      state = await stepA(state);
      break;
    case 'b':
      state = await stepB(state);
      break;
    case 'c':
      state = await stepC(state);
      break;
    case 'd':
      state = await stepD(state);
      break;
    case 'all':
      state = await stepA(state);
      state = await stepB(state);
      state = await stepC(state);
      state = await stepD(state);
      await verify(state);
      break;
    case 'verify':
      await verify(state);
      break;
  }

  console.log('\nDone.');
  if (DRY_RUN) console.log('(dry-run — no prod writes performed)');
}

main().catch((e) => {
  console.error('\nMigration failed:', e.message);
  process.exit(1);
});
