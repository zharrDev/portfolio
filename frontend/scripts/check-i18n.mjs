/**
 * Verification-only i18n key checker.
 *
 * Reads the dictionaries and every `data-i18n*` / `t('…')` reference in the
 * source, then reports:
 *   1. keys present in one dictionary but missing from the other (parity), and
 *   2. referenced keys that resolve in neither dictionary.
 *
 * This is the language-sync guard: the page-level smoke test only sees the
 * locale that loads by default, so a missing English string can slip through
 * unnoticed. Run with: node scripts/check-i18n.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i18n = readFileSync(path.join(root, 'src/i18n/index.ts'), 'utf8');

/** Extracts the quoted keys of one dictionary literal block. */
function keysOf(label, nextLabel) {
  const start = i18n.indexOf(label);
  const end = nextLabel ? i18n.indexOf(nextLabel, start) : i18n.length;
  const block = i18n.slice(start, end);
  return new Set([...block.matchAll(/'([^']+)':/g)].map((m) => m[1]));
}

const idKeys = keysOf('const id = {', 'const en:');
const enKeys = keysOf('const en: Record<StringKey, string> = {', 'const dictionaries');

const problems = [];

for (const key of idKeys) if (!enKeys.has(key)) problems.push(`missing in EN: ${key}`);
for (const key of enKeys) if (!idKeys.has(key)) problems.push(`missing in ID: ${key}`);

// Collect references from HTML and TS.
const files = [
  ...['index.html', 'about.html', 'projects.html', 'project-detail.html', 'resume.html', 'contact.html', '404.html'].map(
    (f) => path.join(root, f),
  ),
];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/data-i18n="([^"]+)"/g)) {
    if (!idKeys.has(m[1])) problems.push(`${path.basename(file)}: data-i18n key not found: ${m[1]}`);
  }
  for (const m of text.matchAll(/data-i18n-title="([^"]+)"/g)) {
    if (!idKeys.has(m[1])) problems.push(`${path.basename(file)}: data-i18n-title key not found: ${m[1]}`);
  }
  for (const m of text.matchAll(/data-i18n-attr='([^']+)'/g)) {
    for (const key of Object.values(JSON.parse(m[1]))) {
      if (!idKeys.has(key)) problems.push(`${path.basename(file)}: data-i18n-attr key not found: ${key}`);
    }
  }
}

// Runtime `t('key')` references across the public TypeScript source. Admin
// files are skipped: the dashboard is intentionally Indonesian-only and never
// mounts the locale switch.
const srcDir = path.join(root, 'src');
for (const rel of readdirSync(srcDir, { recursive: true })) {
  if (typeof rel !== 'string' || !rel.endsWith('.ts') || rel.includes('admin/')) continue;
  const text = readFileSync(path.join(srcDir, rel), 'utf8');
  for (const m of text.matchAll(/\bt\(\s*'([^']+)'/g)) {
    if (!idKeys.has(m[1])) problems.push(`src/${rel}: t('${m[1]}') key not found`);
  }
}

console.log(`ID keys: ${idKeys.size}, EN keys: ${enKeys.size}`);
if (problems.length === 0) {
  console.log('OK: dictionaries are in sync and every referenced key exists.');
  process.exit(0);
}
console.log(`\n${problems.length} problem(s):`);
for (const problem of problems) console.log(`  - ${problem}`);
process.exit(1);
