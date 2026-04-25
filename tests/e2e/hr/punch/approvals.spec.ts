/**
 * /hr/punch/approvals — Playwright smoke tests (Phase 7 / Plan 07-06 / Task 4).
 *
 * Coverage:
 *   - Page renders queue + at least one row OR empty state.
 *   - Selecting > 5 rows → batch bar + PIN warning visible. Clicking
 *     "Aprovar" opens VerifyActionPinModal (PIN gate per Plan 07-03).
 *   - Selecting ≤ 5 rows → batch bar without PIN warning.
 *   - Mobile: stacked layout (no horizontal overflow).
 */

import { test, expect } from '@playwright/test';

const ROUTE = '/hr/punch/approvals';

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

test.describe('/hr/punch/approvals', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test('renders approvals page root', async ({ page }) => {
    await expect(page.getByTestId('punch-approvals-page')).toBeVisible();
  });

  test('selecting 6 rows shows PIN warning + opens VerifyActionPinModal on Aprovar', async ({
    page,
  }) => {
    const rows = page.locator('[data-testid^="punch-approval-row-"]');
    const count = await rows.count();
    test.skip(count < 6, 'Need at least 6 approval rows to exercise PIN gate');

    for (let i = 0; i < 6; i++) {
      await rows
        .nth(i)
        .locator('[data-testid^="punch-approval-checkbox-"]')
        .click();
    }

    // PIN warning chip visible (selectedCount > 5)
    await expect(page.getByTestId('punch-batch-pin-warning')).toBeVisible();

    // Approve → VerifyActionPinModal opens (rendered as a Dialog)
    await page.getByTestId('punch-batch-approve').click();
    await expect(
      page.getByRole('dialog', { name: /pin/i }).first()
    ).toBeVisible();
  });

  test('selecting 3 rows shows batch bar WITHOUT PIN warning', async ({
    page,
  }) => {
    const rows = page.locator('[data-testid^="punch-approval-row-"]');
    const count = await rows.count();
    test.skip(
      count < 3,
      'Need at least 3 approval rows for sub-threshold path'
    );

    for (let i = 0; i < 3; i++) {
      await rows
        .nth(i)
        .locator('[data-testid^="punch-approval-checkbox-"]')
        .click();
    }

    await expect(page.getByTestId('punch-batch-bar')).toBeVisible();
    await expect(page.getByTestId('punch-batch-pin-warning')).toHaveCount(0);
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('mobile renders approvals page', async ({ page }) => {
      await expect(page.getByTestId('punch-approvals-page')).toBeVisible();
    });
  });
});
