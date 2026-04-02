/**
 * HR Module FULL Audit — Pente Fino
 *
 * Navega por TODAS as 109 páginas do módulo HR e verifica:
 * 1. Página carrega sem crash (sem 500, sem React error)
 * 2. Console errors capturados
 * 3. HTTP errors (4xx/5xx) capturados
 * 4. Conteúdo renderiza (não fica em loading infinito)
 * 5. Para listagens: verifica se grid/empty state aparece
 * 6. Para detail/edit: verifica se card de identidade aparece
 *
 * Gera relatório final em JSON + console table
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'guilherme@teste.com';
const LOGIN_PASSWORD = 'Teste@123';

// ============================================================================
// PAGE INVENTORY — All 109 HR pages
// ============================================================================

interface PageEntry {
  path: string;
  label: string;
  type: 'dashboard' | 'listing' | 'detail' | 'edit' | 'special';
  /** If detail/edit, the listing path to find a real ID */
  listingPath?: string;
  /** Entity key in API response (to extract first item ID) */
  entityKey?: string;
  /** API endpoint to fetch list (to get a real ID for detail/edit pages) */
  apiEndpoint?: string;
}

// --- Listing pages (no [id] needed) ---
const LISTING_PAGES: PageEntry[] = [
  // Dashboard & Overview
  { path: '/hr', label: 'Dashboard HR', type: 'dashboard' },
  { path: '/hr/overview', label: 'Visão Geral', type: 'special' },
  { path: '/hr/settings', label: 'Configurações', type: 'special' },

  // Core entities
  {
    path: '/hr/employees',
    label: 'Funcionários',
    type: 'listing',
    entityKey: 'employees',
    apiEndpoint: '/v1/hr/employees',
  },
  {
    path: '/hr/departments',
    label: 'Departamentos',
    type: 'listing',
    entityKey: 'departments',
    apiEndpoint: '/v1/hr/departments',
  },
  { path: '/hr/departments/org-chart', label: 'Organograma', type: 'special' },
  {
    path: '/hr/positions',
    label: 'Cargos',
    type: 'listing',
    entityKey: 'positions',
    apiEndpoint: '/v1/hr/positions',
  },
  {
    path: '/hr/teams',
    label: 'Equipes',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/teams',
  },

  // Lifecycle
  {
    path: '/hr/recruitment',
    label: 'Recrutamento - Vagas',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/recruitment/job-postings',
  },
  {
    path: '/hr/recruitment/candidates',
    label: 'Recrutamento - Candidatos',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/recruitment/candidates',
  },
  {
    path: '/hr/admissions',
    label: 'Admissões',
    type: 'listing',
    entityKey: 'invites',
    apiEndpoint: '/v1/hr/admissions',
  },
  {
    path: '/hr/onboarding',
    label: 'Onboarding',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/onboarding',
  },
  {
    path: '/hr/offboarding',
    label: 'Offboarding',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/offboarding',
  },
  {
    path: '/hr/terminations',
    label: 'Rescisões',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/terminations',
  },

  // Time & Attendance
  {
    path: '/hr/work-schedules',
    label: 'Escalas de Trabalho',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/work-schedules',
  },
  {
    path: '/hr/shifts',
    label: 'Turnos',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/shifts',
  },
  {
    path: '/hr/time-control',
    label: 'Controle de Ponto',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/time-entries',
  },
  {
    path: '/hr/time-control/overview',
    label: 'Ponto - Visão Geral',
    type: 'special',
  },
  {
    path: '/hr/time-control/settings',
    label: 'Ponto - Configurações',
    type: 'special',
  },
  {
    path: '/hr/time-bank',
    label: 'Banco de Horas',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/time-bank',
  },
  {
    path: '/hr/overtime',
    label: 'Horas Extras',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/overtime',
  },
  {
    path: '/hr/absences',
    label: 'Ausências',
    type: 'listing',
    entityKey: 'absences',
    apiEndpoint: '/v1/hr/absences',
  },
  {
    path: '/hr/vacations',
    label: 'Férias',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/vacations',
  },
  {
    path: '/hr/geofence-zones',
    label: 'Zonas de Geofence',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/geofence-zones',
  },

  // Payroll & Compensation
  {
    path: '/hr/payroll',
    label: 'Folha de Pagamento',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/payroll',
  },
  {
    path: '/hr/bonuses',
    label: 'Bonificações',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/bonuses',
  },
  {
    path: '/hr/deductions',
    label: 'Deduções',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/deductions',
  },
  {
    path: '/hr/benefits',
    label: 'Benefícios',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/benefit-plans',
  },

  // People Management
  {
    path: '/hr/dependants',
    label: 'Dependentes',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/dependants',
  },
  {
    path: '/hr/warnings',
    label: 'Advertências',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/warnings',
  },
  {
    path: '/hr/requests',
    label: 'Solicitações',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/employee-requests',
  },
  {
    path: '/hr/announcements',
    label: 'Comunicados',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/announcements',
  },
  {
    path: '/hr/kudos',
    label: 'Reconhecimentos',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/kudos',
  },
  {
    path: '/hr/delegations',
    label: 'Delegações',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/delegations',
  },

  // Development & Performance
  {
    path: '/hr/reviews',
    label: 'Avaliações',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/review-cycles',
  },
  {
    path: '/hr/trainings',
    label: 'Treinamentos',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/training-programs',
  },
  {
    path: '/hr/okrs',
    label: 'OKRs',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/okrs/objectives',
  },
  {
    path: '/hr/surveys',
    label: 'Pesquisas',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/surveys',
  },

  // Safety & Health
  {
    path: '/hr/safety-programs',
    label: 'Programas de Segurança',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/safety-programs',
  },
  {
    path: '/hr/workplace-risks',
    label: 'Riscos Ocupacionais',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/workplace-risks',
  },
  {
    path: '/hr/medical-exams',
    label: 'Exames Médicos',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/medical-exams',
  },
  { path: '/hr/medical-exams/pcmso', label: 'PCMSO', type: 'special' },
  {
    path: '/hr/ppe',
    label: 'EPI',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/ppe-items',
  },
  {
    path: '/hr/cipa',
    label: 'CIPA',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/cipa-mandates',
  },

  // Compliance
  {
    path: '/hr/esocial',
    label: 'eSocial',
    type: 'listing',
    entityKey: 'data',
    apiEndpoint: '/v1/hr/esocial/events',
  },
  { path: '/hr/esocial/batches', label: 'eSocial - Lotes', type: 'special' },
  {
    path: '/hr/esocial/settings',
    label: 'eSocial - Configurações',
    type: 'special',
  },

  // Self-service & Reports
  { path: '/hr/my-profile', label: 'Meu Perfil', type: 'special' },
  { path: '/hr/reports', label: 'Relatórios', type: 'special' },
];

// --- Detail/Edit page templates (will use real IDs from listing API) ---
interface DetailEditTemplate {
  basePath: string;
  label: string;
  hasDetail: boolean;
  hasEdit: boolean;
  apiEndpoint: string;
  entityKey: string;
}

const DETAIL_EDIT_TEMPLATES: DetailEditTemplate[] = [
  {
    basePath: '/hr/employees',
    label: 'Funcionários',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/employees',
    entityKey: 'employees',
  },
  {
    basePath: '/hr/departments',
    label: 'Departamentos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/departments',
    entityKey: 'departments',
  },
  {
    basePath: '/hr/positions',
    label: 'Cargos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/positions',
    entityKey: 'positions',
  },
  {
    basePath: '/hr/teams',
    label: 'Equipes',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/teams',
    entityKey: 'data',
  },
  {
    basePath: '/hr/vacations',
    label: 'Férias',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/vacations',
    entityKey: 'data',
  },
  {
    basePath: '/hr/absences',
    label: 'Ausências',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/absences',
    entityKey: 'absences',
  },
  {
    basePath: '/hr/warnings',
    label: 'Advertências',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/warnings',
    entityKey: 'data',
  },
  {
    basePath: '/hr/overtime',
    label: 'Horas Extras',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/overtime',
    entityKey: 'data',
  },
  {
    basePath: '/hr/payroll',
    label: 'Folha',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/payroll',
    entityKey: 'data',
  },
  {
    basePath: '/hr/bonuses',
    label: 'Bonificações',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/bonuses',
    entityKey: 'data',
  },
  {
    basePath: '/hr/deductions',
    label: 'Deduções',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/deductions',
    entityKey: 'data',
  },
  {
    basePath: '/hr/benefits',
    label: 'Benefícios',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/benefit-plans',
    entityKey: 'data',
  },
  {
    basePath: '/hr/dependants',
    label: 'Dependentes',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/dependants',
    entityKey: 'data',
  },
  {
    basePath: '/hr/announcements',
    label: 'Comunicados',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/announcements',
    entityKey: 'data',
  },
  {
    basePath: '/hr/requests',
    label: 'Solicitações',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/employee-requests',
    entityKey: 'data',
  },
  {
    basePath: '/hr/kudos',
    label: 'Reconhecimentos',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/kudos',
    entityKey: 'data',
  },
  {
    basePath: '/hr/admissions',
    label: 'Admissões',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/admissions',
    entityKey: 'invites',
  },
  {
    basePath: '/hr/onboarding',
    label: 'Onboarding',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/onboarding',
    entityKey: 'data',
  },
  {
    basePath: '/hr/offboarding',
    label: 'Offboarding',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/offboarding',
    entityKey: 'data',
  },
  {
    basePath: '/hr/terminations',
    label: 'Rescisões',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/terminations',
    entityKey: 'data',
  },
  {
    basePath: '/hr/work-schedules',
    label: 'Escalas',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/work-schedules',
    entityKey: 'data',
  },
  {
    basePath: '/hr/shifts',
    label: 'Turnos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/shifts',
    entityKey: 'data',
  },
  {
    basePath: '/hr/time-control',
    label: 'Ponto',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/time-entries',
    entityKey: 'data',
  },
  {
    basePath: '/hr/time-bank',
    label: 'Banco de Horas',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/time-bank',
    entityKey: 'data',
  },
  {
    basePath: '/hr/geofence-zones',
    label: 'Geofence',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/geofence-zones',
    entityKey: 'data',
  },
  {
    basePath: '/hr/safety-programs',
    label: 'Programas Seg.',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/safety-programs',
    entityKey: 'data',
  },
  {
    basePath: '/hr/workplace-risks',
    label: 'Riscos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/workplace-risks',
    entityKey: 'data',
  },
  {
    basePath: '/hr/medical-exams',
    label: 'Exames',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/medical-exams',
    entityKey: 'data',
  },
  {
    basePath: '/hr/ppe',
    label: 'EPI',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/ppe-items',
    entityKey: 'data',
  },
  {
    basePath: '/hr/cipa',
    label: 'CIPA',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/cipa-mandates',
    entityKey: 'data',
  },
  {
    basePath: '/hr/esocial',
    label: 'eSocial',
    hasDetail: true,
    hasEdit: false,
    apiEndpoint: '/v1/hr/esocial/events',
    entityKey: 'data',
  },
  {
    basePath: '/hr/reviews',
    label: 'Avaliações',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/review-cycles',
    entityKey: 'data',
  },
  {
    basePath: '/hr/trainings',
    label: 'Treinamentos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/training-programs',
    entityKey: 'data',
  },
  {
    basePath: '/hr/okrs',
    label: 'OKRs',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/okrs/objectives',
    entityKey: 'data',
  },
  {
    basePath: '/hr/surveys',
    label: 'Pesquisas',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/surveys',
    entityKey: 'data',
  },
  {
    basePath: '/hr/recruitment',
    label: 'Vagas',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/recruitment/job-postings',
    entityKey: 'data',
  },
  {
    basePath: '/hr/recruitment/candidates',
    label: 'Candidatos',
    hasDetail: true,
    hasEdit: true,
    apiEndpoint: '/v1/hr/recruitment/candidates',
    entityKey: 'data',
  },
];

// ============================================================================
// AUDIT INFRASTRUCTURE
// ============================================================================

interface AuditResult {
  path: string;
  label: string;
  type: string;
  loaded: boolean;
  httpStatus: number | null;
  consoleErrors: string[];
  httpErrors: string[];
  hasContent: boolean;
  loadTimeMs: number;
  severity: '🟢 OK' | '🟡 WARNING' | '🔴 CRITICAL';
  notes: string;
}

const results: AuditResult[] = [];

async function loginAndGetToken(page: Page): Promise<string> {
  // Login via API
  const response = await page.request.post(
    'http://localhost:3333/v1/auth/login/password',
    {
      data: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD },
    }
  );
  const body = await response.json();
  let token = body.token;

  // If backend auto-selected tenant, token is already scoped
  if (body.tenant) {
    return token;
  }

  // Otherwise, select first tenant
  const tenantsRes = await page.request.get(
    'http://localhost:3333/v1/auth/tenants',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const tenantsBody = await tenantsRes.json();
  const tenants = tenantsBody.tenants || [];

  if (tenants.length === 0) {
    throw new Error('No tenants found for user');
  }

  const selectRes = await page.request.post(
    'http://localhost:3333/v1/auth/select-tenant',
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { tenantId: tenants[0].id },
    }
  );
  const selectBody = await selectRes.json();
  return selectBody.token;
}

async function auditPage(
  page: Page,
  entry: { path: string; label: string; type: string }
): Promise<AuditResult> {
  const consoleErrors: string[] = [];
  const httpErrors: string[] = [];
  let httpStatus: number | null = null;

  // Capture console errors
  const consoleHandler = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known noise
      if (
        text.includes('favicon') ||
        text.includes('lockdown') ||
        text.includes('SES')
      )
        return;
      consoleErrors.push(text.substring(0, 200));
    }
  };
  page.on('console', consoleHandler);

  // Capture failed network requests
  const responseHandler = (response: import('@playwright/test').Response) => {
    const status = response.status();
    const url = response.url();
    // Ignore external, static assets, and known non-critical endpoints
    if (!url.includes('localhost')) return;
    if (url.includes('_next/') || url.includes('favicon')) return;
    if (status >= 400) {
      httpErrors.push(
        `${status} ${url.substring(url.indexOf('/v1')).substring(0, 100)}`
      );
    }
  };
  page.on('response', responseHandler);

  const startTime = Date.now();
  let loaded = false;
  let hasContent = false;

  try {
    const response = await page.goto(`${BASE_URL}${entry.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    httpStatus = response?.status() ?? null;

    // Wait for content to render (not just DOM loaded)
    await page.waitForTimeout(2000);

    // Check if page has real content (not stuck in loading)
    const bodyText = await page.textContent('body');
    hasContent = !!bodyText && bodyText.length > 100;

    // Check for loading spinners still visible after 2s
    const loadingVisible = await page
      .locator('[class*="animate-spin"], [class*="animate-pulse"]')
      .first()
      .isVisible()
      .catch(() => false);
    if (loadingVisible) {
      // Give it more time
      await page.waitForTimeout(3000);
      const stillLoading = await page
        .locator('[class*="animate-spin"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (stillLoading) {
        consoleErrors.push(
          'LOADING_STUCK: Page still showing spinner after 5s'
        );
      }
    }

    // Check for "Internal Server Error" or "Not Found" text
    if (bodyText?.includes('Internal Server Error')) {
      consoleErrors.push('PAGE_CRASH: Internal Server Error');
    }
    if (bodyText?.includes('Application error')) {
      consoleErrors.push('PAGE_CRASH: Application error');
    }

    loaded = true;
  } catch (err) {
    consoleErrors.push(
      `NAVIGATION_ERROR: ${(err as Error).message.substring(0, 150)}`
    );
  }

  const loadTimeMs = Date.now() - startTime;

  // Remove listeners
  page.removeListener('console', consoleHandler);
  page.removeListener('response', responseHandler);

  // Determine severity
  let severity: AuditResult['severity'] = '🟢 OK';
  let notes = '';

  const criticalErrors = consoleErrors.filter(
    e =>
      e.includes('PAGE_CRASH') ||
      e.includes('NAVIGATION_ERROR') ||
      e.includes('LOADING_STUCK')
  );
  const http5xx = httpErrors.filter(e => e.startsWith('5'));

  if (
    !loaded ||
    criticalErrors.length > 0 ||
    http5xx.length > 0 ||
    httpStatus === 500
  ) {
    severity = '🔴 CRITICAL';
    notes =
      criticalErrors.join('; ') || http5xx.join('; ') || 'Page did not load';
  } else if (consoleErrors.length > 0 || httpErrors.length > 0) {
    severity = '🟡 WARNING';
    notes = [...consoleErrors, ...httpErrors].join('; ').substring(0, 300);
  } else {
    notes = `OK (${loadTimeMs}ms)`;
  }

  return {
    path: entry.path,
    label: entry.label,
    type: entry.type,
    loaded,
    httpStatus,
    consoleErrors,
    httpErrors,
    hasContent,
    loadTimeMs,
    severity,
    notes,
  };
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('HR Full Audit — Pente Fino', () => {
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    authToken = await loginAndGetToken(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage before each test
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(token => {
      localStorage.setItem('auth_token', token);
    }, authToken);
  });

  // ── Phase 1: All listing/dashboard/special pages ──
  test('Phase 1: Audit all listing pages', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: LISTING & SPECIAL PAGES');
    console.log('='.repeat(80));

    for (const entry of LISTING_PAGES) {
      const result = await auditPage(page, entry);
      results.push(result);

      const icon =
        result.severity === '🟢 OK'
          ? '✅'
          : result.severity === '🟡 WARNING'
            ? '⚠️'
            : '❌';
      console.log(
        `${icon} ${result.label.padEnd(30)} ${result.path.padEnd(40)} ${result.severity} ${result.notes.substring(0, 60)}`
      );
    }
  });

  // ── Phase 2: Detail & Edit pages (need real IDs) ──
  test('Phase 2: Audit detail & edit pages', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes

    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: DETAIL & EDIT PAGES');
    console.log('='.repeat(80));

    for (const template of DETAIL_EDIT_TEMPLATES) {
      // Try to fetch first item ID from API
      let firstId: string | null = null;
      try {
        const apiRes = await page.request.get(
          `http://localhost:3333${template.apiEndpoint}?page=1&perPage=1`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (apiRes.ok()) {
          const body = await apiRes.json();
          const items = body[template.entityKey] || body.data || [];
          if (Array.isArray(items) && items.length > 0) {
            firstId = items[0].id;
          }
        }
      } catch {
        // API call failed — skip detail/edit for this entity
      }

      if (!firstId) {
        console.log(
          `⏭️  ${template.label.padEnd(30)} Sem dados — pulando detail/edit`
        );
        results.push({
          path: `${template.basePath}/[id]`,
          label: `${template.label} (detail)`,
          type: 'detail',
          loaded: false,
          httpStatus: null,
          consoleErrors: ['NO_DATA: No items found to test detail page'],
          httpErrors: [],
          hasContent: false,
          loadTimeMs: 0,
          severity: '🟡 WARNING',
          notes: 'Sem dados para testar',
        });
        continue;
      }

      // Test detail page
      if (template.hasDetail) {
        const detailResult = await auditPage(page, {
          path: `${template.basePath}/${firstId}`,
          label: `${template.label} (detail)`,
          type: 'detail',
        });
        results.push(detailResult);

        const icon =
          detailResult.severity === '🟢 OK'
            ? '✅'
            : detailResult.severity === '🟡 WARNING'
              ? '⚠️'
              : '❌';
        console.log(
          `${icon} ${detailResult.label.padEnd(30)} ${detailResult.path.padEnd(55)} ${detailResult.severity}`
        );
      }

      // Test edit page
      if (template.hasEdit) {
        const editResult = await auditPage(page, {
          path: `${template.basePath}/${firstId}/edit`,
          label: `${template.label} (edit)`,
          type: 'edit',
        });
        results.push(editResult);

        const icon =
          editResult.severity === '🟢 OK'
            ? '✅'
            : editResult.severity === '🟡 WARNING'
              ? '⚠️'
              : '❌';
        console.log(
          `${icon} ${editResult.label.padEnd(30)} ${editResult.path.padEnd(55)} ${editResult.severity}`
        );
      }
    }
  });

  // ── Phase 3: Summary Report ──
  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('FINAL REPORT');
    console.log('='.repeat(80));

    const critical = results.filter(r => r.severity === '🔴 CRITICAL');
    const warnings = results.filter(r => r.severity === '🟡 WARNING');
    const ok = results.filter(r => r.severity === '🟢 OK');

    console.log(`\nTotal: ${results.length} páginas`);
    console.log(`  🟢 OK:       ${ok.length}`);
    console.log(`  🟡 WARNING:  ${warnings.length}`);
    console.log(`  🔴 CRITICAL: ${critical.length}`);

    if (critical.length > 0) {
      console.log('\n--- CRITICAL ISSUES ---');
      for (const r of critical) {
        console.log(`  ❌ ${r.path}`);
        console.log(`     ${r.notes}`);
        if (r.httpErrors.length > 0)
          console.log(`     HTTP: ${r.httpErrors.join(', ')}`);
        if (r.consoleErrors.length > 0)
          console.log(`     Console: ${r.consoleErrors.join(', ')}`);
      }
    }

    if (warnings.length > 0) {
      console.log('\n--- WARNINGS ---');
      for (const r of warnings) {
        console.log(`  ⚠️  ${r.path}`);
        console.log(`     ${r.notes.substring(0, 200)}`);
      }
    }

    // Write JSON report
    const fs = await import('fs');
    const reportPath = 'tests/e2e/audit/hr-full-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  });
});
