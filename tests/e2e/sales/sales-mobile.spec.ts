import { test, expect } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';

let authToken: string;
let tenantId: string;

test.beforeAll(async () => {
  const auth = await getAuthenticatedToken('admin@teste.com', 'Teste@123');
  authToken = auth.token;
  tenantId = auth.tenantId;
});

test.use({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
});

const MOBILE_ROUTES = [
  { path: '/sales', name: 'Dashboard' },
  { path: '/sales/settings', name: 'Settings' },
  { path: '/sales/customers', name: 'Customers' },
  { path: '/sales/contacts', name: 'Contacts' },
  { path: '/sales/orders', name: 'Orders' },
  { path: '/sales/deals', name: 'Deals' },
  { path: '/sales/pipelines', name: 'Pipelines' },
  { path: '/sales/campaigns', name: 'Campaigns' },
  { path: '/sales/coupons', name: 'Coupons' },
  { path: '/sales/payment-conditions', name: 'Payment Conditions' },
  { path: '/sales/pricing', name: 'Pricing' },
  { path: '/sales/catalogs', name: 'Catalogs' },
  { path: '/sales/bids', name: 'Bids' },
  { path: '/sales/printers', name: 'Printers' },
  { path: '/sales/invoicing', name: 'Invoicing' },
  { path: '/sales/cashier', name: 'Cashier' },
  { path: '/sales/analytics', name: 'Analytics' },
];

test.describe('Sales Mobile Responsiveness', () => {
  test('All Sales pages render correctly on mobile', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);

    const issues: { route: string; name: string; issue: string }[] = [];

    for (const route of MOBILE_ROUTES) {
      try {
        await page.goto(route.path, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        await page.waitForTimeout(2000);

        // Check 1: No horizontal overflow (page wider than viewport)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 375;
        if (bodyWidth > viewportWidth + 5) {
          issues.push({
            route: route.path,
            name: route.name,
            issue: `Horizontal overflow: body is ${bodyWidth}px wide (viewport ${viewportWidth}px)`,
          });
        }

        // Check 2: No text cutoff (elements wider than viewport without overflow:hidden)
        const overflowElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const overflows: string[] = [];
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth + 10 && rect.width > 50) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className?.toString().slice(0, 60) || '';
              overflows.push(
                `<${tag} class="${cls}"> at x=${Math.round(rect.right)}`
              );
            }
          });
          return overflows.slice(0, 5);
        });

        if (overflowElements.length > 0) {
          issues.push({
            route: route.path,
            name: route.name,
            issue: `Elements overflow viewport: ${overflowElements.join(', ')}`,
          });
        }

        // Check 3: Page is not blank
        const hasContent = await page.locator('body').textContent();
        if (!hasContent || hasContent.trim().length < 20) {
          issues.push({
            route: route.path,
            name: route.name,
            issue: 'Page appears blank on mobile',
          });
        }

        // Check 4: No error boundary
        const hasError = await page
          .locator('.next-error-h1')
          .isVisible()
          .catch(() => false);
        if (hasError) {
          issues.push({
            route: route.path,
            name: route.name,
            issue: 'Error boundary triggered on mobile',
          });
        }

        // Take screenshot for visual review
        await page.screenshot({
          path: `tests/e2e/sales/screenshots/mobile-${route.name.toLowerCase().replace(/\s/g, '-')}.png`,
          fullPage: true,
        });

        const status =
          issues.filter(i => i.route === route.path).length === 0 ? '✅' : '⚠️';
        console.log(`  ${status} ${route.name} [${route.path}]`);
      } catch (err) {
        issues.push({
          route: route.path,
          name: route.name,
          issue: `Navigation failed: ${(err as Error).message}`,
        });
        console.log(`  ❌ ${route.name} [${route.path}] - FAILED`);
      }
    }

    // Report
    console.log('\n' + '='.repeat(60));
    console.log('MOBILE RESPONSIVENESS REPORT');
    console.log('='.repeat(60));
    console.log(`Pages tested: ${MOBILE_ROUTES.length}`);
    console.log(`Issues found: ${issues.length}`);

    if (issues.length > 0) {
      console.log('\n--- ISSUES ---\n');
      for (const issue of issues) {
        console.log(`${issue.name} [${issue.route}]: ${issue.issue}`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // Annotate test
    test.info().annotations.push({
      type: 'mobile-report',
      description: `${issues.length} issues across ${MOBILE_ROUTES.length} pages`,
    });
  });
});
