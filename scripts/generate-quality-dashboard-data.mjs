#!/usr/bin/env node
// generate-quality-dashboard-data.mjs — Run: node scripts/generate-quality-dashboard-data.mjs

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, dirname, sep } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const OUTPUT_FILE = join(ROOT, '.storybook', 'foundations', 'quality-dashboard.data.ts');
const BS = sep; // platform path separator (backslash on Windows, slash on Unix)

function walkDir(dir, ext, exclude) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext, exclude));
    } else if (entry.name.endsWith(ext)) {
      if (!exclude || !entry.name.endsWith(exclude)) results.push(full);
    }
  }
  return results;
}

function subfolder(filePath) {
  const rel = relative(COMPONENTS_DIR, filePath);
  const parts = rel.split(sep);
  // Skip top-level files (not inside a subfolder)
  if (parts.length === 1) return null;
  return parts[0];
}

function fileContains(filePath, pattern) {
  try { return readFileSync(filePath, 'utf8').includes(pattern); }
  catch { return false; }
}

function countDeprecated(filePath) {
  try {
    const m = readFileSync(filePath, 'utf8').match(/@deprecated/g);
    return m ? m.length : 0;
  } catch { return 0; }
}

function toUnix(p) { return p.split(sep).join('/'); }

function gitModifiedAt(filePath) {
  try {
    const rel = toUnix(relative(ROOT, filePath));
    return execSync('git log -1 --format=%ci -- "' + rel + '"', {
      cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000,
    }).trim();
  } catch { return ''; }
}

function esc(str) { return str.replace(/'/g, String.fromCharCode(92) + "'"); }

const componentFiles = walkDir(COMPONENTS_DIR, '.tsx', '.stories.tsx');
const storyFiles = walkDir(COMPONENTS_DIR, '.stories.tsx');

const subfolderMap = {};
for (const f of componentFiles) {
  const sub = subfolder(f);
  if (!sub) continue;
  if (!subfolderMap[sub]) subfolderMap[sub] = { total: 0, storied: 0 };
  subfolderMap[sub].total++;
}
for (const f of storyFiles) {
  const sub = subfolder(f);
  if (!sub) continue;
  if (!subfolderMap[sub]) subfolderMap[sub] = { total: 0, storied: 0 };
  subfolderMap[sub].storied++;
}

const coverageBySubfolder = Object.entries(subfolderMap)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, { total, storied }]) => ({ path, total, storied }));

const deprecatedComponents = componentFiles
  .map(f => ({ file: toUnix(relative(ROOT, f)), count: countDeprecated(f) }))
  .filter(d => d.count > 0)
  .sort((a, b) => b.count - a.count);

const storiesWithoutPlay = storyFiles
  .filter(f => !fileContains(f, 'play:') && !fileContains(f, 'play ='))
  .map(f => toUnix(relative(ROOT, f)))
  .sort();

const allWithDates = storyFiles.map(f => ({
  file: toUnix(relative(ROOT, f)),
  modifiedAt: gitModifiedAt(f),
}));
const recentStories = allWithDates
  .filter(s => s.modifiedAt)
  .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  .slice(0, 10);

const q = "'";
const out = [
  '// AUTO-GENERATED. Run: npm run storybook:dashboard',
  '// Generated: ' + new Date().toISOString(),
  '',
  'export const coverageBySubfolder: Array<{ path: string; total: number; storied: number }> = [',
  ...coverageBySubfolder.map(r => '  { path: ' + q + esc(r.path) + q + ', total: ' + r.total + ', storied: ' + r.storied + ' },'),
  '];',
  '',
  'export const deprecatedComponents: Array<{ file: string; count: number }> = [',
  ...deprecatedComponents.map(d => '  { file: ' + q + esc(d.file) + q + ', count: ' + d.count + ' },'),
  '];',
  '',
  'export const storiesWithoutPlay: string[] = [',
  ...storiesWithoutPlay.map(f => '  ' + q + esc(f) + q + ','),
  '];',
  '',
  'export const recentStories: Array<{ file: string; modifiedAt: string }> = [',
  ...recentStories.map(s => '  { file: ' + q + esc(s.file) + q + ', modifiedAt: ' + q + esc(s.modifiedAt) + q + ' },'),
  '];',
].join(String.fromCharCode(10)) + String.fromCharCode(10);

writeFileSync(OUTPUT_FILE, out, 'utf8');

console.log('quality-dashboard.data.ts generated');
console.log('  coverageBySubfolder: ' + coverageBySubfolder.length + ' subfolders');
console.log('  deprecatedComponents: ' + deprecatedComponents.length);
console.log('  storiesWithoutPlay: ' + storiesWithoutPlay.length);
console.log('  recentStories: ' + recentStories.length);
