import { test, expect } from '@playwright/test';
import { navigateToCentral } from '../helpers/central.helper';

test.describe('Central Subscriptions', () => {
  test('should render subscriptions page', async ({ page }) => {
    await navigateToCentral(page, '/central/subscriptions');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/Assinaturas.*Billing/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show summary stat cards', async ({ page }) => {
    await navigateToCentral(page, '/central/subscriptions');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/MRR/i').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
