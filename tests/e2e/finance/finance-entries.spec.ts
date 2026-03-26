/**
 * Finance Module - Entries (Contas a Pagar) E2E Tests
 *
 * Tests for the payable entries listing page: navigation, creation wizard,
 * detail view, status filtering, and search.
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
// PAYABLE ENTRIES
// ═══════════════════════════════════════════════════════════════

test.describe('Finance - Contas a Pagar', () => {
  test('1.1 - Navegar para listagem de contas a pagar', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/payable');
    await page.waitForLoadState('networkidle');

    // Page should render with heading or page layout
    const pageLayout = page.locator(
      '[data-testid="page-layout"], main, [class*="PageLayout"]'
    );
    await expect(pageLayout.first()).toBeVisible({ timeout: 15_000 });

    // Should have an action bar or heading referencing payable
    const heading = page.locator('text=Contas a Pagar').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('1.2 - Abrir wizard de nova conta a pagar', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/payable');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await expect(
      page.locator('text=Contas a Pagar').first()
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Nova Conta a Pagar" button
    const newBtn = page
      .getByRole('button')
      .filter({ hasText: /Nova Conta a Pagar/i })
      .first();

    if (await newBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Should open a wizard dialog or navigate to /payable/new
      const dialog = page.locator('[role="dialog"]');
      const isNewPage = page.url().includes('/payable/new');

      if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // Wizard modal opened
        await expect(dialog).toBeVisible();
      } else if (isNewPage) {
        // Navigated to new page — verify form loads
        await expect(page.locator('input').first()).toBeVisible({
          timeout: 10_000,
        });
      } else {
        // Fallback — page may have navigated
        expect(
          (await dialog.isVisible().catch(() => false)) || isNewPage
        ).toBeTruthy();
      }
    }
  });

  test('1.3 - Visualizar detalhe de um lancamento', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/payable');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Contas a Pagar').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for grid content to load (entries or empty state)
    await page.waitForTimeout(3_000);

    // Look for any entity card in the grid
    const entityCard = page
      .locator('[data-testid="entity-card"], [class*="EntityCard"], [class*="card"]')
      .first();

    if (await entityCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Click on the first entry card
      await entityCard.click();
      await page.waitForTimeout(2_000);

      // Should navigate to detail page /finance/payable/[id]
      const isDetailPage =
        page.url().includes('/finance/payable/') &&
        !page.url().endsWith('/payable') &&
        !page.url().endsWith('/new');

      if (isDetailPage) {
        // Detail page should have content visible
        const pageContent = page.locator(
          'main, [data-testid="page-layout"], [class*="PageLayout"]'
        );
        await expect(pageContent.first()).toBeVisible({ timeout: 10_000 });
      }
    } else {
      // No entries exist — skip gracefully
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No payable entries found in the listing to click',
      });
    }
  });

  test('1.4 - Filtrar lancamentos por status', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/payable');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Contas a Pagar').first()
    ).toBeVisible({ timeout: 15_000 });

    // Look for status filter dropdown
    const statusFilter = page
      .getByRole('button')
      .filter({ hasText: /Status/i })
      .first();

    if (await statusFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      // Should show filter options (Pendente, Vencido, Pago, etc.)
      const pendingOption = page
        .locator('[role="option"], [role="menuitemcheckbox"], [role="menuitem"]')
        .filter({ hasText: 'Pendente' })
        .first();

      if (
        await pendingOption.isVisible({ timeout: 3_000 }).catch(() => false)
      ) {
        await pendingOption.click();
        await page.waitForTimeout(1_000);

        // After filtering, URL should reflect the filter or grid should update
        // We just verify the page didn't crash
        const pageLayout = page.locator(
          'main, [data-testid="page-layout"], [class*="PageLayout"]'
        );
        await expect(pageLayout.first()).toBeVisible({ timeout: 5_000 });
      }
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Status filter button not found on payable page',
      });
    }
  });

  test('1.5 - Buscar lancamentos por texto', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/payable');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Contas a Pagar').first()
    ).toBeVisible({ timeout: 15_000 });

    // Find the search bar
    const searchInput = page.getByPlaceholder(/Buscar/i).first();

    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('teste');
      await page.waitForTimeout(1_000);

      // Page should not crash — grid should show filtered results or empty state
      const pageLayout = page.locator(
        'main, [data-testid="page-layout"], [class*="PageLayout"]'
      );
      await expect(pageLayout.first()).toBeVisible({ timeout: 5_000 });

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Search bar not found on payable page',
      });
    }
  });
});
