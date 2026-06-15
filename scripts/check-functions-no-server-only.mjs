#!/usr/bin/env node
/**
 * check-functions-no-server-only.mjs — guard against the #1037/#1038 crash
 * class (ported cross-portal via brik-client-portal#1041).
 *
 * `import 'server-only'` resolves to a throwing entry point in the Netlify
 * Functions runtime (plain Node — no Next.js `react-server` export condition),
 * so it crashes the worker at MODULE LOAD. The function returns 202 but the
 * handler never runs, freezing the task with no error. In brik-client-portal
 * the #856 DAL centralization routed background workers through a
 * `server-only`-guarded module and silently broke ~14 workers (#1037).
 *
 * Unlike that portal — which banned `server-only` outright because its workers
 * MUST use the DAL — renew-pms legitimately keeps `import 'server-only'` in its
 * DAL (`src/lib/data/*`): its Netlify functions are crons that import nothing
 * from `@/`, so they never reach it. A blunt "no server-only anywhere" gate
 * would wrongly force its removal. This gate enforces the REAL invariant
 * instead: NO `netlify/functions` entry may TRANSITIVELY import a module that
 * does `import 'server-only'`. server-only stays valid in the DAL; the day a
 * function's import graph reaches it, CI fails with the offending chain.
 *
 * Portable, dependency-free (Node fs/path only; no TS compiler). Resolves the
 * `@/` alias to `src/` and follows relative imports/re-exports.
 *
 *   Run locally:  node scripts/check-functions-no-server-only.mjs
 *   CI:           invoked from .github/workflows/ci.yml
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? '.');
const FUNCTIONS_DIR = join(ROOT, 'netlify', 'functions');
const SRC_DIR = join(ROOT, 'src');
const EXTS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

// Real import/export-from STATEMENTS only (anchored, both quote styles).
const FROM_RE = /^\s*(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT_RE = /^\s*import\s*['"]([^'"]+)['"]/gm;
const SERVER_ONLY_RE = /^\s*import\s*['"]server-only['"]/m;

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else if (EXTS.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

/** Resolve a local import specifier to a file path; null for bare (node_modules) specifiers. */
function resolveLocal(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = join(SRC_DIR, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec);
  else return null;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
  if (existsSync(base) && statSync(base).isFile()) return base;
  return null; // unresolved (e.g. type-only path, asset) — nothing to crawl
}

function specifiersOf(src) {
  const specs = new Set();
  for (const re of [FROM_RE, BARE_IMPORT_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) specs.add(m[1]);
  }
  return specs;
}

/** BFS the import graph from `entry`; return the path chain to a server-only module, or null. */
function chainToServerOnly(entry) {
  const seen = new Set();
  const queue = [[entry, [entry]]];
  while (queue.length) {
    const [file, path] = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    if (file !== entry && SERVER_ONLY_RE.test(src)) return path;
    for (const spec of specifiersOf(src)) {
      if (spec === 'server-only') return [...path, "import 'server-only'"];
      const next = resolveLocal(spec, file);
      if (next && !seen.has(next)) queue.push([next, [...path, next]]);
    }
  }
  return null;
}

const entries = listFiles(FUNCTIONS_DIR);
if (entries.length === 0) {
  console.log('✅ PASS — no netlify/functions entries to check.');
  process.exit(0);
}

const rel = (p) => p.replace(ROOT + '/', '');
const violations = [];
for (const entry of entries) {
  const chain = chainToServerOnly(entry);
  if (chain) violations.push({ entry, chain });
}

if (violations.length > 0) {
  console.error("❌ FAIL — netlify/functions entry transitively imports `server-only`:\n");
  for (const { entry, chain } of violations) {
    console.error(`  ${rel(entry)}`);
    console.error('    ' + chain.map((c) => (c.startsWith("import '") ? c : rel(c))).join('\n      → '));
    console.error('');
  }
  console.error(`\`server-only\` throws at module load in the Netlify Functions runtime, which
silently freezes the worker (returns 202, handler never runs). See
brik-client-portal #1037 / #1038. Break the import chain above: move the
server-only-guarded logic out of the function's import graph, or drop the
\`import 'server-only'\` line (the server/client boundary belongs at lint time,
not the function runtime).`);
  process.exit(1);
}

console.log(`✅ PASS — no netlify/functions entry reaches \`server-only\` (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} checked).`);
