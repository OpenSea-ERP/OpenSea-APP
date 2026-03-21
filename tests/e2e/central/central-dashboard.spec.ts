import { test, expect } from '@playwright/test';
import { navigateToCentral } from '../helpers/central.helper';

test.describe('Central Dashboard', () => {
  test('should render the hero banner with stat pills', async ({ page }) => {
    await navigateToCentral(page);
    await page.waitForTimeout(3000);
    // Verify hero section exists — greeting may be "Bom dia", "Boa tarde", "Boa noite", or "Olá"
    await expect(
      page.locator('text=/Bom dia|Boa tarde|Boa noite|Olá/i')
    ).toBeVisible({ timeout: 10000 });
    // Verify stat pills
    await expect(page.locator('text=Tenants').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=/Usu[aá]rios/i').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=MRR').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Tickets').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should render revenue chart and ticket list', async ({ page }) => {
    await navigateToCentral(page);
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Tenants por Status')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Tickets Recentes')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should render top tenants and growth chart', async ({ page }) => {
    await navigateToCentral(page);
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Tenants Recentes')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Crescimento')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should toggle theme between light and dark', async ({ page }) => {
    await navigateToCentral(page);
    await page.waitForTimeout(3000);
    // Find theme toggle button — it has a title attribute with "Alternar para tema"
    const themeToggle = page.locator('button[title*="Alternar para tema"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
    // Check initial theme attribute
    const htmlTheme = () =>
      page.evaluate(() =>
        document.documentElement.getAttribute('data-central-theme')
      );
    const initial = await htmlTheme();
    // Click toggle
    await themeToggle.click();
    // Theme should change
    const after = await htmlTheme();
    expect(after).not.toBe(initial);
  });
});
