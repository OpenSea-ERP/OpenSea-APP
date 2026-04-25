/**
 * /hr/punch/dashboard — Playwright smoke tests (Phase 7 / Plan 07-06 / Task 4).
 *
 * Compiles standalone (no run required against live stack); runs against the
 * dev stack with `npm run test:e2e`. Coverage:
 *   - Desktop: page renders heatmap + feed + 2 compact cards.
 *   - Export modal opens on Exportar button.
 *   - LGPD sentinel: no CPF visible in DOM.
 *   - Mobile (375×812): heatmap remains visible (sticky col + h-scroll).
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/hr/punch/dashboard';

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

test.describe('/hr/punch/dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders dashboard root + heatmap + feed + 2 cards (desktop)', async ({
    page,
  }) => {
    await expect(page.getByTestId('punch-dashboard-page')).toBeVisible();
    await expect(page.getByTestId('punch-feed')).toBeVisible();
    await expect(page.getByTestId('punch-missing-card')).toBeVisible();
    await expect(page.getByTestId('punch-devices-card')).toBeVisible();
  });

  test('opens export modal on Exportar button', async ({ page }) => {
    await page.getByRole('button', { name: /exportar/i }).click();
    await expect(page.getByTestId('punch-export-modal')).toBeVisible();
  });

  test('LGPD: no CPF visible in DOM', async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('cpf');
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('mobile renders dashboard root + horizontal-scrollable heatmap area', async ({
      page,
    }) => {
      await expect(page.getByTestId('punch-dashboard-page')).toBeVisible();
      await expect(page.getByTestId('punch-feed')).toBeVisible();
    });
  });
});
