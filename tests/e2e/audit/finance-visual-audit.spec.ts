/**
 * Finance Module Visual & UX Audit — FASE 2
 * Para cada página do módulo Finance:
 * 1. Tira screenshot full-page (1440x900)
 * 2. Verifica: textos em inglês, acentos faltando, ícones desproporcionais,
 *    empty states sem contexto, botões sem aria-label, breadcrumbs faltando
 * 3. Gera relatório agrupado por categoria de issue
 */

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@teste.com';
const LOGIN_PASSWORD = 'Teste@123';
const SCREENSHOTS_DIR = 'tests/e2e/audit/finance-visual-screenshots';

const FINANCE_PAGES = [
  { path: '/finance', label: 'Dashboard Finance' },
  { path: '/finance/overview/cashflow', label: 'Cash Flow Overview' },
  { path: '/finance/overview/overdue', label: 'Overdue Overview' },
  { path: '/finance/accountant', label: 'Accountant Dashboard' },
  { path: '/finance/bank-accounts', label: 'Contas Bancarias' },
  { path: '/finance/categories', label: 'Categorias' },
  { path: '/finance/chart-of-accounts', label: 'Plano de Contas' },
  { path: '/finance/consortia', label: 'Consorcios' },
  { path: '/finance/consortia/new', label: 'Novo Consorcio' },
  { path: '/finance/contracts', label: 'Contratos' },
  { path: '/finance/cost-centers', label: 'Centros de Custo' },
  { path: '/finance/cost-centers/new', label: 'Novo Centro de Custo' },
  { path: '/finance/loans', label: 'Emprestimos' },
  { path: '/finance/loans/new', label: 'Novo Emprestimo' },
  { path: '/finance/payable', label: 'Contas a Pagar' },
  { path: '/finance/payable/new', label: 'Nova Conta a Pagar' },
  { path: '/finance/receivable', label: 'Contas a Receber' },
  { path: '/finance/receivable/new', label: 'Nova Conta a Receber' },
  { path: '/finance/recurring', label: 'Recorrencias' },
  { path: '/finance/recurring/new', label: 'Nova Recorrencia' },
  { path: '/finance/approval-rules', label: 'Regras de Aprovacao' },
  { path: '/finance/bank-connections', label: 'Conexoes Bancarias' },
  { path: '/finance/compliance', label: 'Compliance Fiscal' },
  { path: '/finance/escalations', label: 'Escalacoes' },
  { path: '/finance/exchange-rates', label: 'Taxas de Cambio' },
  { path: '/finance/fiscal', label: 'Documentos Fiscais' },
  { path: '/finance/fiscal/config', label: 'Config Fiscal' },
  { path: '/finance/payment-links', label: 'Links de Pagamento' },
  { path: '/finance/reconciliation', label: 'Conciliacao' },
  { path: '/finance/settings', label: 'Configuracoes Finance' },
  { path: '/finance/reports', label: 'Relatorios Hub' },
  { path: '/finance/reports/analytics', label: 'Analytics' },
  { path: '/finance/reports/balance-sheet', label: 'Balanco Patrimonial' },
  { path: '/finance/reports/budget', label: 'Orcamento' },
  { path: '/finance/reports/export', label: 'Exportacao' },
  { path: '/finance/reports/forecast', label: 'Previsao' },
];

interface VisualIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  description: string;
}

async function analyzePageUX(page: Page, pageInfo: { path: string; label: string }): Promise<VisualIssue[]> {
  const issues: VisualIssue[] = [];
  const bodyText = await page.textContent('body') || '';

  // 1. Check for English text that should be Portuguese
  const englishPatterns = [
    { pattern: /\bNo results\b/i, text: 'No results' },
    { pattern: /\bLoading\.\.\./, text: 'Loading...' },
    { pattern: /\bDelete\b(?!d)/, text: 'Delete' },
    { pattern: /\bCreate\b/, text: 'Create' },
    { pattern: /\bEdit\b/, text: 'Edit' },
    { pattern: /\bSave\b/, text: 'Save' },
    { pattern: /\bCancel\b(?!ar|amento|ado)/, text: 'Cancel' },
    { pattern: /\bSubmit\b/, text: 'Submit' },
    { pattern: /\bSearch\b/, text: 'Search' },
    { pattern: /\bFilter\b(?!ro)/, text: 'Filter' },
    { pattern: /\bSettings\b/, text: 'Settings' },
    { pattern: /\bSuccess\b/, text: 'Success' },
    { pattern: /\bConfirm\b(?!ar|ação|ado)/, text: 'Confirm' },
    { pattern: /\bAre you sure\b/i, text: 'Are you sure' },
    { pattern: /\bNo data\b/i, text: 'No data' },
    { pattern: /\bAdd new\b/i, text: 'Add new' },
    { pattern: /\bView all\b/i, text: 'View all' },
    { pattern: /\bTotal balance\b/i, text: 'Total balance' },
    { pattern: /\bOverdue\b/, text: 'Overdue' },
    { pattern: /\bPending\b/, text: 'Pending' },
    { pattern: /\bPaid\b/, text: 'Paid' },
    { pattern: /\bUnpaid\b/, text: 'Unpaid' },
    { pattern: /\bDue date\b/i, text: 'Due date' },
    { pattern: /\bAmount\b/, text: 'Amount' },
    { pattern: /\bDescription\b/, text: 'Description' },
    { pattern: /\bCategory\b/, text: 'Category' },
    { pattern: /\bStatus\b/, text: 'Status' },
    { pattern: /\bDate\b/, text: 'Date' },
    { pattern: /\bName\b/, text: 'Name' },
    { pattern: /\bType\b/, text: 'Type' },
    { pattern: /\bAccount\b/, text: 'Account' },
    { pattern: /\bBalance\b/, text: 'Balance' },
    { pattern: /\bPayment\b/, text: 'Payment' },
    { pattern: /\bInvoice\b/, text: 'Invoice' },
    { pattern: /\bTransaction\b/, text: 'Transaction' },
    { pattern: /\bReconcil/, text: 'Reconcil*' },
    { pattern: /\bForecast\b/, text: 'Forecast' },
    { pattern: /\bBudget\b/, text: 'Budget' },
    { pattern: /\bExport\b/, text: 'Export' },
    { pattern: /\bImport\b/, text: 'Import' },
    { pattern: /\bDashboard\b/, text: 'Dashboard' },
    { pattern: /\bOverview\b/, text: 'Overview' },
    { pattern: /\bReport\b/, text: 'Report' },
    { pattern: /\bChart\b/, text: 'Chart' },
  ];

  for (const { pattern, text } of englishPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      issues.push({
        type: 'warning',
        category: 'i18n',
        description: `Texto em inglês detectado: "${match[0]}" (contexto: "${bodyText.substring(Math.max(0, bodyText.indexOf(match[0]) - 20), bodyText.indexOf(match[0]) + match[0].length + 20).trim()}")`,
      });
    }
  }

  // 2. Check for missing accents in common Portuguese words
  const missingAccents = [
    { wrong: /\bSaldo\b/, correct: null }, // saldo is correct
    { wrong: /\bRecebiveis\b/, correct: 'Recebíveis' },
    { wrong: /\bConsorcio\b/, correct: 'Consórcio' },
    { wrong: /\bEmprestimo\b/, correct: 'Empréstimo' },
    { wrong: /\bOrcamento\b/, correct: 'Orçamento' },
    { wrong: /\bBalanco\b/, correct: 'Balanço' },
    { wrong: /\bPrevisao\b/, correct: 'Previsão' },
    { wrong: /\bTransacao\b/, correct: 'Transação' },
    { wrong: /\bConciliacao\b/, correct: 'Conciliação' },
    { wrong: /\bAprovacao\b/, correct: 'Aprovação' },
    { wrong: /\bDescricao\b/, correct: 'Descrição' },
    { wrong: /\bSituacao\b/, correct: 'Situação' },
    { wrong: /\bOperacao\b/, correct: 'Operação' },
    { wrong: /\bComissao\b/, correct: 'Comissão' },
    { wrong: /\bJuridica\b/, correct: 'Jurídica' },
    { wrong: /\bCredito\b/, correct: 'Crédito' },
    { wrong: /\bDebito\b/, correct: 'Débito' },
    { wrong: /\bCodigo\b/, correct: 'Código' },
    { wrong: /\bNumero\b/, correct: 'Número' },
    { wrong: /\bRelatorio\b/, correct: 'Relatório' },
    { wrong: /\bPeriodo\b/, correct: 'Período' },
    { wrong: /\bInicio\b/, correct: 'Início' },
    { wrong: /\bTermino\b/, correct: 'Término' },
  ];

  for (const { wrong, correct } of missingAccents) {
    if (correct && wrong.test(bodyText)) {
      issues.push({
        type: 'warning',
        category: 'i18n',
        description: `Acento faltando: "${bodyText.match(wrong)?.[0]}" deveria ser "${correct}"`,
      });
    }
  }

  // 3. Check for error states
  const errorPatterns = [
    /Erro ao carregar/,
    /Something went wrong/,
    /Objects are not valid/,
    /Cannot read properties/,
    /undefined is not/,
    /Query data cannot be undefined/,
    /Unhandled Runtime Error/,
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(bodyText)) {
      issues.push({
        type: 'error',
        category: 'runtime',
        description: `Erro visível na página: "${bodyText.match(pattern)?.[0]}"`,
      });
    }
  }

  // 4. Check for oversized icons in main content
  const mainLargeIcons = await page.locator('main svg[class*="h-12"], main svg[class*="h-16"], [class*="PageBody"] svg[class*="h-12"]').count();
  if (mainLargeIcons > 3) {
    issues.push({
      type: 'warning',
      category: 'design',
      description: `${mainLargeIcons} ícones grandes (h-12+) no conteúdo principal`,
    });
  }

  // 5. Check for broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let broken = 0;
    imgs.forEach(img => {
      if (img.naturalWidth === 0 && img.src) broken++;
    });
    return broken;
  });
  if (brokenImages > 0) {
    issues.push({
      type: 'error',
      category: 'design',
      description: `${brokenImages} imagem(ns) quebrada(s)`,
    });
  }

  // 6. Check for empty states
  const emptyGrids = await page.locator('text=/Nenhum.*encontrad/i').count();
  const emptyGeneric = await page.locator('text=/Sem dados|Sem registros|Nenhum registro/i').count();
  if (emptyGrids > 0 || emptyGeneric > 0) {
    issues.push({
      type: 'info',
      category: 'data',
      description: `Empty state visível (${emptyGrids + emptyGeneric} ocorrência(s)) — verificar se há dados no banco`,
    });
  }

  // 7. Check for buttons without text or aria-label
  const iconOnlyButtons = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    let count = 0;
    btns.forEach(btn => {
      const text = btn.textContent?.trim();
      const ariaLabel = btn.getAttribute('aria-label');
      const title = btn.getAttribute('title');
      if (!text && !ariaLabel && !title) count++;
    });
    return count;
  });
  if (iconOnlyButtons > 0) {
    issues.push({
      type: 'warning',
      category: 'a11y',
      description: `${iconOnlyButtons} botão(ões) sem texto, aria-label ou title`,
    });
  }

  // 8. Check page has breadcrumb (skip dashboard)
  if (pageInfo.path !== '/finance') {
    const hasBreadcrumb = await page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"], [class*="Breadcrumb"]').count();
    if (hasBreadcrumb === 0) {
      issues.push({
        type: 'warning',
        category: 'navigation',
        description: 'Breadcrumb não encontrado na página',
      });
    }
  }

  // 9. Check for truncated text (text-overflow issues)
  const truncatedElements = await page.evaluate(() => {
    let count = 0;
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.overflow === 'hidden' && style.textOverflow === 'ellipsis') {
        const htmlEl = el as HTMLElement;
        if (htmlEl.scrollWidth > htmlEl.clientWidth + 5) count++;
      }
    });
    return count;
  });
  if (truncatedElements > 5) {
    issues.push({
      type: 'info',
      category: 'design',
      description: `${truncatedElements} elementos com texto truncado — verificar se intencional`,
    });
  }

  return issues;
}

test.describe('Finance Visual & UX Audit — FASE 2', () => {
  const allIssues: Map<string, VisualIssue[]> = new Map();

  test.beforeAll(async ({ browser }) => {
    const dir = path.resolve(SCREENSHOTS_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Login
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const identifierInput = page.locator('input').first();
    await identifierInput.waitFor({ timeout: 10000 });
    await identifierInput.fill(LOGIN_EMAIL);
    const continueBtn = page.locator('button:has-text("Continuar"), button[type="submit"]').first();
    await continueBtn.click();
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill(LOGIN_PASSWORD);
    const loginBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
    await loginBtn.click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

    if (page.url().includes('select-tenant')) {
      await page.waitForTimeout(1000);
      const tenantCard = page.locator('[data-testid="tenant-card"], .cursor-pointer, [role="button"]').first();
      if (await tenantCard.isVisible({ timeout: 5000 })) {
        await tenantCard.click();
        await page.waitForURL(url => !url.toString().includes('select-tenant'), { timeout: 10000 });
      }
    }

    await context.storageState({ path: 'tests/e2e/audit/.finance-visual-auth-state.json' });
    await context.close();
  });

  for (const pageInfo of FINANCE_PAGES) {
    test(`Visual: ${pageInfo.label} (${pageInfo.path})`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: 'tests/e2e/audit/.finance-visual-auth-state.json',
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });

        // Wait for content to settle
        await page.waitForTimeout(4000);

        // Take full-page screenshot
        const screenshotName = (pageInfo.path.replace(/\//g, '_').replace(/^_/, '') || 'finance_root');
        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/${screenshotName}.png`,
          fullPage: true,
        });

        // Analyze UX
        const issues = await analyzePageUX(page, pageInfo);
        allIssues.set(pageInfo.path, issues);

        // Log
        const errorCount = issues.filter(i => i.type === 'error').length;
        const warnCount = issues.filter(i => i.type === 'warning').length;
        const icon = errorCount > 0 ? '❌' : warnCount > 0 ? '⚠️' : '✅';
        console.log(`${icon} ${pageInfo.label} (${pageInfo.path}) — ${issues.length} issue(s)`);
        for (const issue of issues) {
          const issueIcon = issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
          console.log(`   ${issueIcon} [${issue.category}] ${issue.description}`);
        }
      } catch (error) {
        console.log(`❌ ${pageInfo.label} (${pageInfo.path}) — FAILED TO LOAD`);
        allIssues.set(pageInfo.path, [{
          type: 'error',
          category: 'navigation',
          description: `Página não carregou: ${error instanceof Error ? error.message : String(error)}`,
        }]);
      }

      await context.close();
    });
  }

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('FINANCE VISUAL & UX AUDIT REPORT — FASE 2');
    console.log('='.repeat(80));

    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfo = 0;

    for (const [, issues] of allIssues) {
      totalErrors += issues.filter(i => i.type === 'error').length;
      totalWarnings += issues.filter(i => i.type === 'warning').length;
      totalInfo += issues.filter(i => i.type === 'info').length;
    }

    console.log(`Pages audited: ${allIssues.size}`);
    console.log(`🔴 Errors: ${totalErrors}`);
    console.log(`🟡 Warnings: ${totalWarnings}`);
    console.log(`🔵 Info: ${totalInfo}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);

    // Group by category
    const byCategory = new Map<string, { path: string; issue: VisualIssue }[]>();
    for (const [pagePath, issues] of allIssues) {
      for (const issue of issues) {
        if (!byCategory.has(issue.category)) byCategory.set(issue.category, []);
        byCategory.get(issue.category)!.push({ path: pagePath, issue });
      }
    }

    if (byCategory.size > 0) {
      console.log('\n--- ISSUES BY CATEGORY ---\n');
      for (const [category, items] of byCategory) {
        console.log(`[${category.toUpperCase()}] (${items.length} issues)`);
        for (const { path: p, issue } of items) {
          const icon = issue.type === 'error' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
          console.log(`  ${icon} ${p} — ${issue.description}`);
        }
        console.log('');
      }
    }

    // Pages with no issues
    const cleanPages = [...allIssues.entries()].filter(([, issues]) => issues.length === 0);
    console.log(`\n✅ ${cleanPages.length} páginas sem problemas detectados`);

    // Pages with most issues
    const worstPages = [...allIssues.entries()]
      .filter(([, issues]) => issues.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);
    if (worstPages.length > 0) {
      console.log('\n--- TOP 10 WORST PAGES ---');
      for (const [p, issues] of worstPages) {
        console.log(`  ${p} — ${issues.length} issue(s)`);
      }
    }

    console.log('\n' + '='.repeat(80));
  });
});
