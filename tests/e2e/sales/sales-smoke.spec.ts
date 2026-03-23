/**
 * Sales Module Smoke Test
 *
 * Navega por TODAS as páginas do módulo Sales, captura:
 * - Erros de console (TypeError, ReferenceError, etc.)
 * - Erros de API (4xx, 5xx)
 * - Falhas de renderização (página em branco, crash)
 *
 * Gera um relatório completo de todos os bugs encontrados.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';

// ─── All Sales Routes ──────────────────────────────────────────
const SALES_ROUTES = [
  // Dashboard
  { path: '/sales', name: 'Sales Dashboard' },

  // Customers
  { path: '/sales/customers', name: 'Customers List' },

  // Contacts
  { path: '/sales/contacts', name: 'Contacts List' },

  // Pipelines
  { path: '/sales/pipelines', name: 'Pipelines List' },

  // Orders
  { path: '/sales/orders', name: 'Orders List' },

  // Catalogs
  { path: '/sales/catalogs', name: 'Catalogs List' },

  // Content
  { path: '/sales/content', name: 'Content List' },

  // Returns
  { path: '/sales/returns', name: 'Returns List' },

  // Campaigns
  { path: '/sales/campaigns', name: 'Campaigns List' },

  // Coupons
  { path: '/sales/coupons', name: 'Coupons List' },

  // Combos
  { path: '/sales/combos', name: 'Combos List' },

  // Pricing / Price Tables
  { path: '/sales/pricing', name: 'Pricing / Price Tables' },

  // Bids (Licitações)
  { path: '/sales/bids', name: 'Bids List' },
  { path: '/sales/bids/contracts', name: 'Bid Contracts' },
  { path: '/sales/bids/documents', name: 'Bid Documents' },

  // POS
  { path: '/sales/pos', name: 'POS Terminal Selector' },
  { path: '/sales/pos/terminals', name: 'POS Terminals Management' },

  // Marketplace
  { path: '/sales/marketplaces', name: 'Marketplaces' },

  // Analytics
  { path: '/sales/analytics', name: 'Analytics Dashboard' },
  { path: '/sales/analytics/goals', name: 'Analytics Goals' },
  { path: '/sales/analytics/reports', name: 'Analytics Reports' },
  { path: '/sales/analytics/rankings', name: 'Analytics Rankings' },
];

// ─── Types ─────────────────────────────────────────────────────

interface PageError {
  route: string;
  name: string;
  type: 'console_error' | 'api_error' | 'render_error' | 'navigation_error';
  message: string;
  details?: string;
}

// ─── Test ──────────────────────────────────────────────────────

test.describe('Sales Module - Smoke Test', () => {
  let authToken: string;
  let tenantId: string;

  test.beforeAll(async () => {
    const auth = await getAuthenticatedToken('admin@teste.com', 'Teste@123');
    authToken = auth.token;
    tenantId = auth.tenantId;
  });

  test('Navigate all Sales pages and collect errors', async ({ page }) => {
    // Inject auth
    await injectAuthIntoBrowser(page, authToken, tenantId);

    const allErrors: PageError[] = [];

    for (const route of SALES_ROUTES) {
      const pageErrors: PageError[] = [];

      // Collect console errors
      const consoleErrors: string[] = [];
      const consoleHandler = (
        msg: import('@playwright/test').ConsoleMessage
      ) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore known noise
          if (
            text.includes('favicon') ||
            text.includes('hydration') ||
            text.includes('Warning:')
          ) {
            return;
          }
          consoleErrors.push(text);
        }
      };
      page.on('console', consoleHandler);

      // Collect API errors
      const apiErrors: string[] = [];
      const responseHandler = (
        response: import('@playwright/test').Response
      ) => {
        const status = response.status();
        const url = response.url();
        if (
          status >= 400 &&
          url.includes('127.0.0.1:3333') &&
          !url.includes('/health')
        ) {
          apiErrors.push(`${status} ${response.statusText()} - ${url}`);
        }
      };
      page.on('response', responseHandler);

      // Navigate
      try {
        const response = await page.goto(route.path, {
          waitUntil: 'networkidle',
          timeout: 15_000,
        });

        if (!response) {
          pageErrors.push({
            route: route.path,
            name: route.name,
            type: 'navigation_error',
            message: 'No response received',
          });
        } else if (response.status() >= 400) {
          pageErrors.push({
            route: route.path,
            name: route.name,
            type: 'navigation_error',
            message: `HTTP ${response.status()} ${response.statusText()}`,
          });
        }

        // Wait for async data to load
        await page.waitForTimeout(3000);

        // Check for infinite loading — spinner still visible after 3s
        const loadingSpinner = await page
          .locator(
            '[data-testid="grid-loading"], .animate-spin, .animate-pulse, [class*="GridLoading"], [class*="Skeleton"]'
          )
          .first()
          .isVisible()
          .catch(() => false);

        if (loadingSpinner) {
          // Wait 4 more seconds — if still loading, it's stuck
          await page.waitForTimeout(4000);
          const stillLoading = await page
            .locator(
              '[data-testid="grid-loading"], .animate-spin, .animate-pulse, [class*="GridLoading"], [class*="Skeleton"]'
            )
            .first()
            .isVisible()
            .catch(() => false);

          if (stillLoading) {
            pageErrors.push({
              route: route.path,
              name: route.name,
              type: 'render_error',
              message:
                'Infinite loading detected — spinner still visible after 7s',
            });
          }
        }

        // Check for error boundaries / crash screens
        const errorBoundary = await page
          .locator(
            '[data-testid="error-boundary"], .error-boundary, .next-error-h1'
          )
          .first()
          .isVisible()
          .catch(() => false);

        if (errorBoundary) {
          const errorText = await page
            .locator(
              '[data-testid="error-boundary"], .error-boundary, .next-error-h1'
            )
            .first()
            .textContent()
            .catch(() => 'Unknown error');

          pageErrors.push({
            route: route.path,
            name: route.name,
            type: 'render_error',
            message: 'Error boundary triggered',
            details: errorText ?? undefined,
          });
        }

        // Check for blank page (no main content)
        const hasContent = await page
          .locator('main, [data-testid="page-layout"], [class*="PageLayout"]')
          .first()
          .isVisible()
          .catch(() => false);

        if (!hasContent) {
          // Check if there's any visible text at all
          const bodyText = await page
            .locator('body')
            .textContent()
            .catch(() => '');
          if (!bodyText || bodyText.trim().length < 20) {
            pageErrors.push({
              route: route.path,
              name: route.name,
              type: 'render_error',
              message: 'Page appears blank - no main content found',
            });
          }
        }
      } catch (err) {
        pageErrors.push({
          route: route.path,
          name: route.name,
          type: 'navigation_error',
          message: `Navigation failed: ${(err as Error).message}`,
        });
      }

      // Collect console errors
      for (const error of consoleErrors) {
        pageErrors.push({
          route: route.path,
          name: route.name,
          type: 'console_error',
          message: error.substring(0, 500),
        });
      }

      // Collect API errors
      for (const error of apiErrors) {
        pageErrors.push({
          route: route.path,
          name: route.name,
          type: 'api_error',
          message: error,
        });
      }

      // Cleanup listeners
      page.removeListener('console', consoleHandler);
      page.removeListener('response', responseHandler);

      allErrors.push(...pageErrors);

      // Log progress
      const status =
        pageErrors.length === 0 ? '✅' : `❌ (${pageErrors.length} errors)`;
      console.log(`  ${status} ${route.name} [${route.path}]`);

      if (pageErrors.length > 0) {
        for (const e of pageErrors) {
          console.log(`      ${e.type}: ${e.message}`);
        }
      }
    }

    // ─── Final Report ────────────────────────────────────────
    console.log('\n' + '='.repeat(80));
    console.log('SALES MODULE SMOKE TEST - FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`Pages tested: ${SALES_ROUTES.length}`);
    console.log(`Total errors: ${allErrors.length}`);

    const byType = {
      console_error: allErrors.filter(e => e.type === 'console_error'),
      api_error: allErrors.filter(e => e.type === 'api_error'),
      render_error: allErrors.filter(e => e.type === 'render_error'),
      navigation_error: allErrors.filter(e => e.type === 'navigation_error'),
    };

    console.log(`  Console errors: ${byType.console_error.length}`);
    console.log(`  API errors: ${byType.api_error.length}`);
    console.log(`  Render errors: ${byType.render_error.length}`);
    console.log(`  Navigation errors: ${byType.navigation_error.length}`);

    if (allErrors.length > 0) {
      console.log('\n--- ERRORS BY PAGE ---\n');
      const byPage = new Map<string, PageError[]>();
      for (const err of allErrors) {
        const key = `${err.name} [${err.route}]`;
        if (!byPage.has(key)) byPage.set(key, []);
        byPage.get(key)!.push(err);
      }

      for (const [pageName, errors] of byPage) {
        console.log(`\n${pageName}:`);
        for (const e of errors) {
          console.log(`  [${e.type}] ${e.message}`);
          if (e.details) console.log(`    Details: ${e.details}`);
        }
      }

      // Unique API errors (deduplicated by URL pattern)
      if (byType.api_error.length > 0) {
        console.log('\n--- UNIQUE API ERRORS ---\n');
        const uniqueApiErrors = new Set(byType.api_error.map(e => e.message));
        for (const err of uniqueApiErrors) {
          console.log(`  ${err}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));

    // The test itself doesn't fail — it's a diagnostic tool
    // But we log everything so the report is visible
    test.info().annotations.push({
      type: 'sales-smoke-report',
      description: `${allErrors.length} errors found across ${SALES_ROUTES.length} pages`,
    });
  });
});
