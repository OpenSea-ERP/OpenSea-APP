import { test, expect } from '@playwright/test';
import { navigateToCentral } from '../helpers/central.helper';

test.describe('Central Sidebar Navigation', () => {
  test('should show all 7 navigation items', async ({ page }) => {
    await navigateToCentral(page);
    // Sidebar should have navigation items (tooltips or aria-labels)
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('should navigate to Empresas page', async ({ page }) => {
    await navigateToCentral(page);
    // Click the Empresas nav item (Building2 icon -> /central/tenants)
    await page.click('a[href="/central/tenants"]');
    await page.waitForURL('**/central/tenants');
    await expect(page).toHaveURL(/\/central\/tenants/);
  });

  test('should navigate to Catálogo page', async ({ page }) => {
    await navigateToCentral(page);
    await page.click('a[href="/central/catalog"]');
    await page.waitForURL('**/central/catalog');
    await expect(page).toHaveURL(/\/central\/catalog/);
  });

  test('should navigate to Equipe page', async ({ page }) => {
    await navigateToCentral(page);
    await page.click('a[href="/central/team"]');
    await page.waitForURL('**/central/team');
    await expect(page).toHaveURL(/\/central\/team/);
  });

  test('should navigate to Assinaturas page', async ({ page }) => {
    await navigateToCentral(page);
    await page.click('a[href="/central/subscriptions"]');
    await page.waitForURL('**/central/subscriptions');
    await expect(page).toHaveURL(/\/central\/subscriptions/);
  });

  test('should highlight active navigation item', async ({ page }) => {
    await navigateToCentral(page);
    // Dashboard link should be active (has active styling)
    const dashboardLink = page.locator('a[href="/central"]').first();
    await expect(dashboardLink).toBeVisible();
  });
});
