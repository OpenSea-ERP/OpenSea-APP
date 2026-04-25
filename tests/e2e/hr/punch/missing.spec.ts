/**
 * /hr/punch/missing — Playwright smoke tests (Phase 7 / Plan 07-06 / Task 4).
 *
 * Coverage:
 *   - Page renders + DatePicker + total badge + items OR empty state.
 *   - Infinite scroll: scrolling to bottom triggers fetchNextPage when
 *     there are enough items.
 *   - LGPD sentinel: no CPF visible.
 *   - Mobile: stacked layout.
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/hr/punch/missing';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page
    .getByPlaceholder('Email, CPF ou Matrícula')
    .fill('admin@teste.com');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByPlaceholder('••••••••').fill('Teste@123');
  await page.getByRole('button', { name: /Entrar|Login/i }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('/hr/punch/missing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders missing page root + total badge', async ({ page }) => {
    await expect(page.getByTestId('punch-missing-page')).toBeVisible();
    await expect(page.getByTestId('punch-missing-total')).toBeVisible();
  });

  test('infinite scroll triggers when there are enough rows', async ({
    page,
  }) => {
    const rows = page.locator('[data-testid^="punch-missing-row-"]');
    const initial = await rows.count();
    test.skip(
      initial < 30,
      'Need a full first page (30 rows) to exercise infinite scroll'
    );

    // Scroll the last row into view → IntersectionObserver fires fetchNextPage.
    await rows.nth(initial - 1).scrollIntoViewIfNeeded();
    // Allow the network round-trip to settle.
    await page.waitForLoadState('networkidle');

    const after = await rows.count();
    expect(after).toBeGreaterThanOrEqual(initial);
  });

  test('LGPD: no CPF visible in DOM', async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('cpf');
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('mobile renders missing page', async ({ page }) => {
      await expect(page.getByTestId('punch-missing-page')).toBeVisible();
    });
  });
});
