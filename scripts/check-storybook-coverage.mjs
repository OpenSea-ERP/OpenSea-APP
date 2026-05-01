#!/usr/bin/env node
/**
 * Pre-commit gate: storybook coverage check (selective blocking).
 *
 * Two cases:
 *   1. Componente NOVO (added) sem .stories.tsx novo no mesmo commit
 *   2. Componente MODIFICADO cuja .stories.tsx existe mas não foi atualizada
 *      no mesmo commit (sinal de drift entre componente e catálogo)
 *
 * Severity por prefixo:
 *   - BLOCKING (exit 1): src/components/ui/, src/components/shared/
 *     → essas pastas são o catálogo canônico consultado pela IA via MCP.
 *       Componente novo sem story degrada o catálogo silenciosamente.
 *   - WARN (exit 0):    src/components/layout/, demais módulos
 *     → ainda recomendado, mas não bloqueia (alguns dependem de contextos
 *       sem prop seam — visual replicas são aceitas mas não obrigatórias).
 *
 * Bypass: `STORYBOOK_COVERAGE_SKIP=1 git commit ...` (use só pra hotfix).
 *
 * Standalone run: `node scripts/check-storybook-coverage.mjs`.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

if (process.env.STORYBOOK_COVERAGE_SKIP === '1') {
  console.log('storybook-coverage: bypassed via STORYBOOK_COVERAGE_SKIP=1');
  process.exit(0);
}

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

const BLOCKING_PREFIXES = ['src/components/ui/', 'src/components/shared/'];
const WARN_PREFIXES = ['src/components/layout/'];

const watchedPrefixes = [...BLOCKING_PREFIXES, ...WARN_PREFIXES];

const isBlocking = file => BLOCKING_PREFIXES.some(p => file.startsWith(p));

const candidates = stagedFiles.filter(f => {
  if (!f.endsWith('.tsx')) return false;
  if (f.endsWith('.stories.tsx')) return false;
  if (f.endsWith('.test.tsx')) return false;
  if (f.endsWith('.spec.tsx')) return false;
  return watchedPrefixes.some(p => f.startsWith(p));
});

const missingNewBlocking = [];
const missingNewWarn = [];
const staleStoryBlocking = [];
const staleStoryWarn = [];

for (const f of candidates) {
  const storyPath = f.replace(/\.tsx$/, '.stories.tsx');
  const storyExistsOnDisk = existsSync(path.resolve(process.cwd(), storyPath));
  const storyStaged = stagedFiles.includes(storyPath);
  const blocking = isBlocking(f);

  if (!storyExistsOnDisk && !storyStaged) {
    (blocking ? missingNewBlocking : missingNewWarn).push(f);
  } else if (storyExistsOnDisk && !storyStaged) {
    (blocking ? staleStoryBlocking : staleStoryWarn).push({
      component: f,
      story: storyPath,
    });
  }
}

const hasBlocking =
  missingNewBlocking.length > 0 || staleStoryBlocking.length > 0;
const hasWarn = missingNewWarn.length > 0 || staleStoryWarn.length > 0;

if (!hasBlocking && !hasWarn) {
  process.exit(0);
}

console.log('');

if (hasBlocking) {
  console.log('❌ Storybook coverage error (BLOCKING):');

  if (missingNewBlocking.length > 0) {
    console.log('   Componentes novos sem story correspondente:');
    for (const f of missingNewBlocking) console.log(`     - ${f}`);
    console.log('');
  }

  if (staleStoryBlocking.length > 0) {
    console.log(
      '   Componentes modificados cuja story existe mas não foi atualizada (drift):'
    );
    for (const { component, story } of staleStoryBlocking) {
      console.log(`     - ${component} (story: ${story})`);
    }
    console.log('');
  }
}

if (hasWarn) {
  console.log('⚠️  Storybook coverage warning:');

  if (missingNewWarn.length > 0) {
    console.log('   Componentes novos sem story (não-bloqueante):');
    for (const f of missingNewWarn) console.log(`     - ${f}`);
    console.log('');
  }

  if (staleStoryWarn.length > 0) {
    console.log('   Componentes modificados sem update de story (drift):');
    for (const { component, story } of staleStoryWarn) {
      console.log(`     - ${component} (story: ${story})`);
    }
    console.log('');
  }
}

console.log(
  '   Regra: todo componente em ui/ ou shared/ exige story junto (BLOQUEANTE),'
);
console.log(
  '   modificações exigem revisar a story no mesmo PR. layout/ é warn-only.'
);
console.log('   Detalhes: docs/patterns/storybook-pattern.md');

if (hasBlocking) {
  console.log('');
  console.log(
    '   Bypass excepcional: STORYBOOK_COVERAGE_SKIP=1 git commit ... (hotfix only)'
  );
  console.log('');
  process.exit(1);
}

console.log('   (Aviso warn-only — commit prossegue.)');
console.log('');
process.exit(0);
