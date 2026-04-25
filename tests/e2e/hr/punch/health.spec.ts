/**
 * /hr/punch/health — Playwright smoke tests (Phase 7 / Plan 07-06 / Task 4).
 *
 * Coverage:
 *   - Page renders + at least one device row OR empty state.
 *   - Online/offline counters render.
 *   - Mobile: stacked layout.
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/hr/punch/health';

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

test.describe('/hr/punch/health', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders health page root', async ({ page }) => {
    await expect(page.getByTestId('punch-health-page')).toBeVisible();
  });

  test('renders online/offline counters when devices exist', async ({
    page,
  }) => {
    const onlineCount = page.getByTestId('punch-health-online-count');
    const offlineCount = page.getByTestId('punch-health-offline-count');

    // Either both counters visible (devices exist) OR empty state shown.
    if (await onlineCount.isVisible()) {
      await expect(offlineCount).toBeVisible();
    } else {
      await expect(
        page.getByText(/Nenhum dispositivo cadastrado/i)
      ).toBeVisible();
    }
  });

  test('LGPD: no CPF visible in DOM', async ({ page }) => {
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('cpf');
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('mobile renders health page', async ({ page }) => {
      await expect(page.getByTestId('punch-health-page')).toBeVisible();
    });
  });
});
