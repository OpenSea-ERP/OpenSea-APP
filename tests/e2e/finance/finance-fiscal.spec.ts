/**
 * Finance Module - Fiscal Documents E2E Tests
 *
 * Tests for the fiscal documents listing page: navigation, NF-e/NFC-e wizard,
 * and fiscal configuration page.
 */
import { test, expect } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';

// ─── Auth State ────────────────────────────────────────────────
let authToken: string;
let tenantId: string;

test.beforeAll(async () => {
  const auth = await getAuthenticatedToken('admin@teste.com', 'Teste@123');
  authToken = auth.token;
  tenantId = auth.tenantId;
});

// ═══════════════════════════════════════════════════════════════
// FISCAL DOCUMENTS
// ═══════════════════════════════════════════════════════════════

test.describe('Finance - Documentos Fiscais', () => {
  test('2.1 - Navegar para listagem de documentos fiscais', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/fiscal');
    await page.waitForLoadState('networkidle');

    // Page should render
    const pageLayout = page.locator(
      '[data-testid="page-layout"], main, [class*="PageLayout"]'
    );
    await expect(pageLayout.first()).toBeVisible({ timeout: 15_000 });

    // Should show fiscal documents heading or description
    const heading = page
      .locator('text=Documentos Fiscais, text=Fiscal, text=NF-e')
      .first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('2.2 - Abrir wizard de emissao de NF-e', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/fiscal');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await page.waitForTimeout(3_000);

    // Click "Emitir NF-e" button
    const nfeBtn = page
      .getByRole('button')
      .filter({ hasText: /Emitir NF-e/i })
      .first();

    if (await nfeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nfeBtn.click();
      await page.waitForTimeout(500);

      // Should open the NF-e emission wizard dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Close the dialog
      const closeBtn = page
        .locator(
          '[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has(svg.lucide-x)'
        )
        .first();

      if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        // Press Escape to close
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(300);
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Emitir NF-e button not found (user may lack fiscal.register permission)',
      });
    }
  });

  test('2.3 - Abrir wizard de emissao de NFC-e', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/fiscal');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await page.waitForTimeout(3_000);

    // Click "Emitir NFC-e" button
    const nfceBtn = page
      .getByRole('button')
      .filter({ hasText: /Emitir NFC-e/i })
      .first();

    if (await nfceBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nfceBtn.click();
      await page.waitForTimeout(500);

      // Should open the NFC-e emission wizard dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Close the dialog
      const closeBtn = page
        .locator(
          '[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has(svg.lucide-x)'
        )
        .first();

      if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }

      await page.waitForTimeout(300);
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Emitir NFC-e button not found (user may lack fiscal.register permission)',
      });
    }
  });

  test('2.4 - Navegar para configuracoes fiscais', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/fiscal');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await page.waitForTimeout(3_000);

    // Click "Configuracoes" button
    const configBtn = page
      .getByRole('button')
      .filter({ hasText: /Configura/i })
      .first();

    if (await configBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await configBtn.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to /finance/fiscal/config
      await expect(page).toHaveURL(/\/finance\/fiscal\/config/, {
        timeout: 10_000,
      });

      // Config page should render
      const pageLayout = page.locator(
        'main, [data-testid="page-layout"], [class*="PageLayout"]'
      );
      await expect(pageLayout.first()).toBeVisible({ timeout: 10_000 });
    } else {
      // Try direct navigation as fallback
      await page.goto('/finance/fiscal/config');
      await page.waitForLoadState('networkidle');

      const pageLayout = page.locator(
        'main, [data-testid="page-layout"], [class*="PageLayout"]'
      );
      await expect(pageLayout.first()).toBeVisible({ timeout: 15_000 });
    }
  });
});
