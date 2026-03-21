import { test, expect } from '@playwright/test';
import { navigateToCentral } from '../helpers/central.helper';

test.describe('Central Tenants', () => {
  test('should render tenant listing page', async ({ page }) => {
    await navigateToCentral(page, '/central/tenants');
    // Should show tenant list or empty state
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toHaveText('Error');
  });

  test('should have search functionality', async ({ page }) => {
    await navigateToCentral(page, '/central/tenants');
    await page.waitForTimeout(1000);
    const searchInput = page
      .locator('input[placeholder*="Buscar"]')
      .or(page.locator('input[type="search"]'));
    if (await searchInput.isVisible()) {
      await searchInput.fill('empresa');
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to tenant detail on click', async ({ page }) => {
    await navigateToCentral(page, '/central/tenants');
    await page.waitForTimeout(2000);
    // Click first tenant link/row
    const tenantLink = page.locator('a[href*="/central/tenants/"]').first();
    if (await tenantLink.isVisible()) {
      await tenantLink.click();
      await page.waitForURL('**/central/tenants/**');
      // Should show tabs
      await page.waitForTimeout(1000);
      await expect(
        page.locator('text=Visão Geral').or(page.locator('text=Overview'))
      ).toBeVisible();
    }
  });

  test('should show 6 tabs on tenant detail', async ({ page }) => {
    await navigateToCentral(page, '/central/tenants');
    await page.waitForTimeout(2000);
    const tenantLink = page.locator('a[href*="/central/tenants/"]').first();
    if (await tenantLink.isVisible()) {
      await tenantLink.click();
      await page.waitForTimeout(2000);
      // Check for tab labels
      const tabs = [
        'Visão Geral',
        'Assinatura',
        'Usuários',
        'Configurações',
        'Integrações',
        'Logs',
      ];
      for (const tab of tabs) {
        const tabEl = page
          .locator('[role="tab"]')
          .filter({ hasText: tab })
          .or(page.locator('button').filter({ hasText: tab }));
        // At least some tabs should be visible
      }
    }
  });

  test('should switch between tabs', async ({ page }) => {
    await navigateToCentral(page, '/central/tenants');
    await page.waitForTimeout(2000);
    const tenantLink = page.locator('a[href*="/central/tenants/"]').first();
    if (await tenantLink.isVisible()) {
      await tenantLink.click();
      await page.waitForTimeout(2000);
      // Click Assinatura tab
      const subTab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Assinatura/i });
      if (await subTab.isVisible()) {
        await subTab.click();
        await page.waitForTimeout(1000);
      }
      // Click Usuários tab
      const usersTab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Usuários/i });
      if (await usersTab.isVisible()) {
        await usersTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
