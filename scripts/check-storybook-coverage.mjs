#!/usr/bin/env node
/**
 * Pre-commit warn: storybook coverage check (warn-only, never blocks).
 *
 * Two cases:
 *   1. Componente NOVO (added) em ui/shared/layout sem .stories.tsx novo no
 *      mesmo commit
 *   2. Componente MODIFICADO cuja .stories.tsx existe mas não foi atualizada
 *      no mesmo commit (sinal de drift entre componente e catálogo)
 *
 * Standalone run: `node scripts/check-storybook-coverage.mjs` (sem args).
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const stagedFiles = (() => {
  try {
    return execSync('git diff --cached --name-only --diff-filter=AM', {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
})();

const watchedPrefixes = [
  'src/components/ui/',
  'src/components/shared/',
  'src/components/layout/',
];

const candidates = stagedFiles.filter(f => {
  if (!f.endsWith('.tsx')) return false;
  if (f.endsWith('.stories.tsx')) return false;
  if (f.endsWith('.test.tsx')) return false;
  if (f.endsWith('.spec.tsx')) return false;
  return watchedPrefixes.some(p => f.startsWith(p));
});

const missingNew = [];
const staleStory = [];

for (const f of candidates) {
  const storyPath = f.replace(/\.tsx$/, '.stories.tsx');
  const storyExistsOnDisk = existsSync(path.resolve(process.cwd(), storyPath));
  const storyStaged = stagedFiles.includes(storyPath);

  if (!storyExistsOnDisk && !storyStaged) {
    missingNew.push(f);
  } else if (storyExistsOnDisk && !storyStaged) {
    staleStory.push({ component: f, story: storyPath });
  }
}

if (missingNew.length === 0 && staleStory.length === 0) {
  process.exit(0);
}

console.log('');
console.log('⚠️  Storybook coverage warning:');

if (missingNew.length > 0) {
  console.log('   Componentes novos sem story correspondente:');
  for (const f of missingNew) console.log(`     - ${f}`);
  console.log('');
}

if (staleStory.length > 0) {
  console.log(
    '   Componentes modificados cuja story existe mas não foi atualizada (possível drift):'
  );
  for (const { component, story } of staleStory) {
    console.log(`     - ${component} (story: ${story})`);
  }
  console.log('');
}

console.log(
  '   Regra: todo componente em ui/, shared/ ou layout/ tem story junto,'
);
console.log(
  '   e modificações no componente exigem revisar a story no mesmo PR.'
);
console.log('   Detalhes: docs/patterns/storybook-pattern.md');
console.log('   (Aviso warn-only — commit prossegue.)');
console.log('');

process.exit(0);
