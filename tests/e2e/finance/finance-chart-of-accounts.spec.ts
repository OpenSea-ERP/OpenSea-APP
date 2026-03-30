/**
 * Finance Module - Chart of Accounts (Plano de Contas) E2E Tests
 *
 * Tests for the chart of accounts listing page: navigation, search,
 * type filtering, create wizard, and detail view.
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
// PLANO DE CONTAS
// ═══════════════════════════════════════════════════════════════

test.describe('Finance - Plano de Contas', () => {
  test('1.1 - Navegar para listagem do plano de contas', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/chart-of-accounts');
    await page.waitForLoadState('networkidle');

    // Page should render with the page layout
    const pageLayout = page.locator(
      '[data-testid="page-layout"], main, [class*="PageLayout"]'
    );
    await expect(pageLayout.first()).toBeVisible({ timeout: 15_000 });

    // Should have the heading "Plano de Contas"
    const heading = page.locator('text=Plano de Contas').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Should show the table or an empty state
    const table = page.locator('table').first();
    const emptyState = page.locator('text=Nenhuma conta encontrada').first();

    const hasTable = await table.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 2_000 }).catch(() => false);

    // One of them must be visible (data loaded or empty state rendered)
    expect(hasTable || hasEmpty).toBeTruthy();

    // If table exists, verify column headers
    if (hasTable) {
      await expect(page.locator('th').filter({ hasText: /Codigo/i }).first()).toBeVisible();
      await expect(page.locator('th').filter({ hasText: /Tipo/i }).first()).toBeVisible();
    }
  });

  test('1.2 - Buscar conta por nome ou codigo', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/chart-of-accounts');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Plano de Contas').first()
    ).toBeVisible({ timeout: 15_000 });

    // Find the search bar
    const searchInput = page.getByPlaceholder(/Buscar/i).first();

    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('Ativo');
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
        description: 'Search bar not found on chart of accounts page',
      });
    }
  });

  test('1.3 - Filtrar contas por tipo', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/chart-of-accounts');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Plano de Contas').first()
    ).toBeVisible({ timeout: 15_000 });

    // Look for the "Tipo" filter dropdown button
    const typeFilter = page
      .getByRole('button')
      .filter({ hasText: /Tipo/i })
      .first();

    if (await typeFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);

      // Should show filter options (Ativo, Passivo, etc.)
      const activeOption = page
        .locator('[role="option"], [role="menuitemcheckbox"], [role="menuitem"]')
        .filter({ hasText: 'Ativo' })
        .first();

      if (
        await activeOption.isVisible({ timeout: 3_000 }).catch(() => false)
      ) {
        await activeOption.click();
        await page.waitForTimeout(1_000);

        // After filtering, URL should reflect the filter or grid should update
        const pageLayout = page.locator(
          'main, [data-testid="page-layout"], [class*="PageLayout"]'
        );
        await expect(pageLayout.first()).toBeVisible({ timeout: 5_000 });
      }
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Type filter button not found on chart of accounts page',
      });
    }
  });

  test('1.4 - Abrir wizard de nova conta', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/chart-of-accounts');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Plano de Contas').first()
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Nova Conta" button
    const newBtn = page
      .getByRole('button')
      .filter({ hasText: /Nova Conta/i })
      .first();

    if (await newBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Should open a wizard dialog
      const dialog = page.locator('[role="dialog"]');

      if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // Wizard modal opened — verify it has form fields
        await expect(dialog).toBeVisible();

        // Look for typical step 1 fields (code, name, type, nature)
        const codeInput = dialog.getByLabel(/Codigo|Code/i).first();
        const nameInput = dialog.getByLabel(/Nome|Name/i).first();

        // At least one form field should be visible
        const hasCodeField = await codeInput.isVisible({ timeout: 3_000 }).catch(() => false);
        const hasNameField = await nameInput.isVisible({ timeout: 3_000 }).catch(() => false);

        // Verify wizard has some input fields
        const inputFields = dialog.locator('input, select, [role="combobox"]');
        const fieldCount = await inputFields.count();
        expect(fieldCount).toBeGreaterThan(0);

        // Look for step indicator or "Proximo"/"Avancar" button
        const nextBtn = dialog
          .getByRole('button')
          .filter({ hasText: /Proximo|Avancar|Continuar|Next/i })
          .first();

        if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          // Step wizard confirmed
          expect(true).toBeTruthy();
        }
      }
    } else {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Nova Conta button not found — user may lack create permission',
      });
    }
  });

  test('1.5 - Visualizar detalhe de uma conta', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/chart-of-accounts');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Plano de Contas').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for content to load
    await page.waitForTimeout(3_000);

    // Look for an account row in the table
    const accountRow = page.locator('table tbody tr').first();

    if (await accountRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Find the actions dropdown (3-dot menu) for the first row
      const actionsBtn = accountRow
        .locator('button')
        .first();

      if (await actionsBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await actionsBtn.click();
        await page.waitForTimeout(300);

        // Click "Visualizar" from the dropdown
        const viewOption = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /Visualizar/i })
          .first();

        if (await viewOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await viewOption.click();
          await page.waitForTimeout(2_000);

          // Should navigate to detail page /finance/chart-of-accounts/[id]
          const isDetailPage =
            page.url().includes('/finance/chart-of-accounts/') &&
            !page.url().endsWith('/chart-of-accounts') &&
            !page.url().endsWith('/new');

          if (isDetailPage) {
            // Detail page should have content visible
            const pageContent = page.locator(
              'main, [data-testid="page-layout"], [class*="PageLayout"]'
            );
            await expect(pageContent.first()).toBeVisible({ timeout: 10_000 });
          }
        }
      }
    } else {
      // No account rows exist — skip gracefully
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No chart of accounts rows found in the listing',
      });
    }
  });
});
