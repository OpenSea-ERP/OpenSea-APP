/**
 * Finance Module Page Audit — FASE 1 (Erros Técnicos)
 * Navega por TODAS as páginas do módulo Finance e verifica:
 * 1. Página carrega sem erros no console
 * 2. Sem crashes de React (Objects are not valid as React child, etc.)
 * 3. Sem erros de query (Query data cannot be undefined, etc.)
 * 4. Conteúdo renderiza (não fica em loading infinito)
 * 5. Sem error boundaries visíveis
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@teste.com';
const LOGIN_PASSWORD = 'Teste@123';

// ALL Finance pages to audit
const FINANCE_PAGES = [
  // Dashboard & Overview
  { path: '/finance', label: 'Finance Dashboard' },
  { path: '/finance/overview/cashflow', label: 'Cash Flow Overview' },
  { path: '/finance/overview/overdue', label: 'Overdue Overview' },
  { path: '/finance/accountant', label: 'Accountant Dashboard' },

  // Bank Accounts
  { path: '/finance/bank-accounts', label: 'Contas Bancárias' },

  // Categories
  { path: '/finance/categories', label: 'Categorias' },

  // Chart of Accounts
  { path: '/finance/chart-of-accounts', label: 'Plano de Contas' },

  // Consortia
  { path: '/finance/consortia', label: 'Consórcios' },
  { path: '/finance/consortia/new', label: 'Novo Consórcio' },

  // Contracts
  { path: '/finance/contracts', label: 'Contratos' },

  // Cost Centers
  { path: '/finance/cost-centers', label: 'Centros de Custo' },
  { path: '/finance/cost-centers/new', label: 'Novo Centro de Custo' },

  // Loans
  { path: '/finance/loans', label: 'Empréstimos' },
  { path: '/finance/loans/new', label: 'Novo Empréstimo' },

  // Payable
  { path: '/finance/payable', label: 'Contas a Pagar' },
  { path: '/finance/payable/new', label: 'Nova Conta a Pagar' },

  // Receivable
  { path: '/finance/receivable', label: 'Contas a Receber' },
  { path: '/finance/receivable/new', label: 'Nova Conta a Receber' },

  // Recurring
  { path: '/finance/recurring', label: 'Recorrências' },
  { path: '/finance/recurring/new', label: 'Nova Recorrência' },

  // Features & Tools
  { path: '/finance/approval-rules', label: 'Regras de Aprovação' },
  { path: '/finance/bank-connections', label: 'Conexões Bancárias' },
  { path: '/finance/compliance', label: 'Compliance Fiscal' },
  { path: '/finance/escalations', label: 'Escalações' },
  { path: '/finance/exchange-rates', label: 'Taxas de Câmbio' },
  { path: '/finance/fiscal', label: 'Documentos Fiscais' },
  { path: '/finance/fiscal/config', label: 'Configuração Fiscal' },
  { path: '/finance/payment-links', label: 'Links de Pagamento' },
  { path: '/finance/reconciliation', label: 'Conciliação' },
  { path: '/finance/settings', label: 'Configurações Finance' },

  // Reports
  { path: '/finance/reports', label: 'Relatórios Hub' },
  { path: '/finance/reports/analytics', label: 'Analytics' },
  { path: '/finance/reports/balance-sheet', label: 'Balanço Patrimonial' },
  { path: '/finance/reports/budget', label: 'Orçamento' },
  { path: '/finance/reports/export', label: 'Exportação' },
  { path: '/finance/reports/forecast', label: 'Previsão' },
];

interface PageAuditResult {
  path: string;
  label: string;
  status: 'OK' | 'ERROR' | 'WARNING' | 'TIMEOUT';
  consoleErrors: string[];
  consoleWarnings: string[];
  loadTimeMs: number;
  hasContent: boolean;
  hasLoadingStuck: boolean;
}

test.describe('Finance Module Page Audit — FASE 1', () => {
  const results: PageAuditResult[] = [];

  test.beforeAll(async ({ browser }) => {
    // Login once and save state
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Step 1: Fill identifier
    const identifierInput = page.locator('input').first();
    await identifierInput.waitFor({ timeout: 10000 });
    await identifierInput.fill(LOGIN_EMAIL);

    const continueBtn = page.locator('button:has-text("Continuar"), button[type="submit"]').first();
    await continueBtn.click();

    // Step 2: Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill(LOGIN_PASSWORD);

    const loginBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
    await loginBtn.click();

    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

    // Handle tenant selection if needed
    if (page.url().includes('select-tenant')) {
      await page.waitForTimeout(1000);
      const tenantCard = page.locator('[data-testid="tenant-card"], .cursor-pointer, [role="button"]').first();
      if (await tenantCard.isVisible({ timeout: 5000 })) {
        await tenantCard.click();
        await page.waitForURL(url => !url.toString().includes('select-tenant'), { timeout: 10000 });
      }
    }

    await context.storageState({ path: 'tests/e2e/audit/.finance-auth-state.json' });
    await context.close();
  });

  for (const pageInfo of FINANCE_PAGES) {
    test(`Audit: ${pageInfo.label} (${pageInfo.path})`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: 'tests/e2e/audit/.finance-auth-state.json',
      });
      const page = await context.newPage();

      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];

      // Capture console errors
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
          if (
            !text.includes('favicon') &&
            !text.includes('Failed to load resource: the server responded with a status of 404') &&
            !text.includes('Download the React DevTools') &&
            !text.includes('Hydration') // Next.js hydration warnings
          ) {
            consoleErrors.push(text.substring(0, 500));
          }
        }
        if (msg.type() === 'warning' && text.includes('Query data cannot be undefined')) {
          consoleErrors.push(`[QUERY ERROR] ${text.substring(0, 500)}`);
        }
      });

      // Capture page errors (uncaught exceptions)
      page.on('pageerror', error => {
        consoleErrors.push(`[PAGE CRASH] ${error.message.substring(0, 500)}`);
      });

      const startTime = Date.now();
      let hasContent = false;
      let hasLoadingStuck = false;
      let status: PageAuditResult['status'] = 'OK';

      try {
        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });

        // Wait for initial render
        await page.waitForTimeout(3000);

        // Check for React error boundaries
        const errorBoundary = await page.locator('text=/Something went wrong|Erro ao carregar|Objects are not valid/i').count();
        if (errorBoundary > 0) {
          consoleErrors.push('[UI] Error boundary or error message visible on page');
        }

        // Check for React rendering errors in page content
        const bodyText = await page.textContent('body') || '';
        if (bodyText.includes('Objects are not valid as a React child')) {
          consoleErrors.push('[REACT] Objects are not valid as a React child — rendering error');
        }
        if (bodyText.includes('Cannot read properties of')) {
          consoleErrors.push('[REACT] Runtime TypeError visible in page');
        }

        // Check for content
        hasContent = (bodyText?.length || 0) > 200;

        // Check if still loading after wait
        await page.waitForTimeout(2000);
        const stillLoading = await page.locator('.animate-spin').count();
        if (stillLoading > 2) {
          hasLoadingStuck = true;
          consoleWarnings.push('[UX] Page may be stuck in loading state');
        }

        // Take screenshot if errors
        if (consoleErrors.length > 0) {
          const screenshotName = `finance${pageInfo.path.replace(/\//g, '_')}`;
          await page.screenshot({
            path: `tests/e2e/audit/screenshots/${screenshotName}.png`,
            fullPage: false,
          });
          status = 'ERROR';
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('timeout') || msg.includes('Timeout')) {
          status = 'TIMEOUT';
          consoleErrors.push('[TIMEOUT] Page did not load within timeout');
        } else {
          status = 'ERROR';
          consoleErrors.push(`[NAVIGATION] ${msg.substring(0, 300)}`);
        }
      }

      const loadTimeMs = Date.now() - startTime;

      const result: PageAuditResult = {
        path: pageInfo.path,
        label: pageInfo.label,
        status: consoleErrors.length > 0 ? 'ERROR' : status,
        consoleErrors,
        consoleWarnings,
        loadTimeMs,
        hasContent,
        hasLoadingStuck,
      };

      results.push(result);

      // Log immediately
      const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.label} (${result.path}) — ${result.loadTimeMs}ms${result.consoleErrors.length > 0 ? ` — ${result.consoleErrors.length} error(s)` : ''}`);
      for (const err of result.consoleErrors) {
        console.log(`   ↳ ${err}`);
      }

      // Assert no critical errors (React crashes)
      if (consoleErrors.some(e => e.includes('[REACT]') || e.includes('[PAGE CRASH]'))) {
        expect(consoleErrors, `Critical errors on ${pageInfo.path}`).toHaveLength(0);
      }

      await context.close();
    });
  }

  test.afterAll(async () => {
    const errors = results.filter(r => r.status === 'ERROR');
    const warnings = results.filter(r => r.status === 'WARNING');
    const ok = results.filter(r => r.status === 'OK');
    const timeouts = results.filter(r => r.status === 'TIMEOUT');

    console.log('\n' + '='.repeat(80));
    console.log('FINANCE MODULE AUDIT REPORT — FASE 1 (Erros Técnicos)');
    console.log('='.repeat(80));
    console.log(`Total pages: ${results.length}`);
    console.log(`✅ OK: ${ok.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    console.log(`⏱ Timeouts: ${timeouts.length}`);

    if (errors.length > 0) {
      console.log('\n--- ERRORS ---');
      for (const r of errors) {
        console.log(`\n❌ ${r.label} (${r.path})`);
        for (const err of r.consoleErrors) {
          console.log(`   ${err}`);
        }
      }
    }

    if (timeouts.length > 0) {
      console.log('\n--- TIMEOUTS ---');
      for (const r of timeouts) {
        console.log(`⏱ ${r.label} (${r.path})`);
      }
    }

    const slowPages = results.filter(r => r.loadTimeMs > 8000);
    if (slowPages.length > 0) {
      console.log('\n--- SLOW PAGES (>8s) ---');
      for (const r of slowPages) {
        console.log(`🐌 ${r.label} (${r.path}) — ${r.loadTimeMs}ms`);
      }
    }

    console.log('\n' + '='.repeat(80));
  });
});
