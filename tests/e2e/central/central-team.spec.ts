import { test, expect } from '@playwright/test';
import { navigateToCentral } from '../helpers/central.helper';

test.describe('Central Team', () => {
  test('should render team management page', async ({ page }) => {
    await navigateToCentral(page, '/central/team');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Equipe Central')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show at least one team member (the super admin)', async ({
    page,
  }) => {
    await navigateToCentral(page, '/central/team');
    await page.waitForTimeout(3000);
    // The seeded super admin should appear with role badge "Proprietário"
    await expect(page.locator('text=/Propriet[aá]rio/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should have invite button', async ({ page }) => {
    await navigateToCentral(page, '/central/team');
    await page.waitForTimeout(3000);
    const inviteBtn = page
      .locator('button')
      .filter({ hasText: /Cadastrar membro/i });
    await expect(inviteBtn).toBeVisible({ timeout: 10000 });
  });

  test('should open invite dialog', async ({ page }) => {
    await navigateToCentral(page, '/central/team');
    await page.waitForTimeout(3000);
    const inviteBtn = page
      .locator('button')
      .filter({ hasText: /Cadastrar membro/i });
    await inviteBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
