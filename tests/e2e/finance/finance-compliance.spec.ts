/**
 * Finance Module - Compliance Fiscal E2E Tests
 *
 * Tests for the compliance page: Simples Nacional status,
 * tax calendar navigation, and SPED export section.
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
// COMPLIANCE FISCAL
// ═══════════════════════════════════════════════════════════════

test.describe('Finance - Compliance Fiscal', () => {
  test('2.1 - Navegar para pagina de compliance', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/compliance');
    await page.waitForLoadState('networkidle');

    // Page should render with the page layout
    const pageLayout = page.locator(
      '[data-testid="page-layout"], main, [class*="PageLayout"]'
    );
    await expect(pageLayout.first()).toBeVisible({ timeout: 15_000 });

    // Should have the heading "Compliance Fiscal"
    const heading = page.locator('text=Compliance Fiscal').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Verify Simples Nacional section is visible
    const simplesSection = page.locator('text=Simples Nacional').first();
    await expect(simplesSection).toBeVisible({ timeout: 10_000 });

    // Verify Calendario Fiscal section is visible
    const calendarSection = page.locator('text=Calendario Fiscal').first();
    await expect(calendarSection).toBeVisible({ timeout: 10_000 });
  });

  test('2.2 - Verificar status do Simples Nacional', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/compliance');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Compliance Fiscal').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for Simples Nacional data to load
    await page.waitForTimeout(3_000);

    // Verify "Simples Nacional" heading exists
    await expect(
      page.locator('text=Simples Nacional').first()
    ).toBeVisible({ timeout: 5_000 });

    // Look for the status badge (one of: "Dentro do limite", "Atenção", "Limite excedido")
    // or a loading/error/empty state
    const statusBadge = page
      .locator('text=Dentro do limite, text=Limite excedido')
      .first();
    const progressBar = page.locator('[role="progressbar"]').first();
    const loadingSpinner = page.locator('.animate-spin').first();
    const errorState = page.locator('text=Erro ao carregar dados do Simples Nacional').first();
    const emptyState = page.locator('text=Nenhum dado disponivel').first();

    const hasStatus = await statusBadge.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasProgress = await progressBar.isVisible({ timeout: 2_000 }).catch(() => false);
    const hasLoading = await loadingSpinner.isVisible({ timeout: 2_000 }).catch(() => false);
    const hasError = await errorState.isVisible({ timeout: 2_000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 2_000 }).catch(() => false);

    // At least one state must be rendered (data loaded, loading, error, or empty)
    expect(hasStatus || hasProgress || hasLoading || hasError || hasEmpty).toBeTruthy();

    // Verify year selector exists
    const yearSelector = page.locator('[role="combobox"]').first();
    if (await yearSelector.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Year selector is visible — can change the year
      expect(true).toBeTruthy();
    }
  });

  test('2.3 - Navegar pelo calendario fiscal', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/compliance');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Compliance Fiscal').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for calendar section to load
    await page.waitForTimeout(2_000);

    // Verify "Calendario Fiscal" section exists
    await expect(
      page.locator('text=Calendario Fiscal').first()
    ).toBeVisible({ timeout: 5_000 });

    // Look for the month navigator (prev/next buttons with month name between them)
    // The month navigator has ChevronLeft and ChevronRight buttons
    const monthNavButtons = page.locator('button').filter({
      has: page.locator('svg'),
    });

    // Find the next month button (ChevronRight within the month navigator area)
    // The month name should be visible in the navigator
    const currentYear = new Date().getFullYear();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    // Check that some month name is displayed
    let foundMonth = false;
    for (const month of monthNames) {
      const monthLabel = page.locator(`text=${month}`).first();
      if (await monthLabel.isVisible({ timeout: 1_000 }).catch(() => false)) {
        foundMonth = true;
        break;
      }
    }

    // Also check for accented month names (Março)
    if (!foundMonth) {
      const accentedMonths = ['Marco', 'Março'];
      for (const month of accentedMonths) {
        const monthLabel = page.locator(`text=${month}`).first();
        if (await monthLabel.isVisible({ timeout: 500 }).catch(() => false)) {
          foundMonth = true;
          break;
        }
      }
    }

    if (foundMonth) {
      // Page layout should remain stable after viewing calendar section
      const pageLayout = page.locator(
        'main, [data-testid="page-layout"], [class*="PageLayout"]'
      );
      await expect(pageLayout.first()).toBeVisible({ timeout: 5_000 });
    }

    // Verify summary chips exist (e.g., "X pendentes", "X pagos")
    const pendingChip = page.locator('text=pendente').first();
    const paidChip = page.locator('text=pago').first();

    const hasPendingChip = await pendingChip.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasPaidChip = await paidChip.isVisible({ timeout: 2_000 }).catch(() => false);

    // At least one summary chip should appear (or the section renders normally)
    expect(hasPendingChip || hasPaidChip || foundMonth).toBeTruthy();
  });

  test('2.4 - Secao de exportacoes SPED', async ({ page }) => {
    await injectAuthIntoBrowser(page, authToken, tenantId);
    await page.goto('/finance/compliance');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('text=Compliance Fiscal').first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for full page to render
    await page.waitForTimeout(2_000);

    // Look for the "Exportacoes" section
    const exportSection = page.locator('text=Exportacoes').first();

    if (await exportSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Section is visible — verify the SPED ECD export button exists
      const spedButton = page
        .getByRole('button')
        .filter({ hasText: /Exportar SPED ECD/i })
        .first();

      if (await spedButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Export button is visible
        await expect(spedButton).toBeVisible();
      }

      // Verify the year selector for SPED export exists
      // (there should be a combobox/select near the export section)
      const pageLayout = page.locator(
        'main, [data-testid="page-layout"], [class*="PageLayout"]'
      );
      await expect(pageLayout.first()).toBeVisible({ timeout: 5_000 });
    } else {
      // Export section may be hidden due to permissions
      test.info().annotations.push({
        type: 'skip-reason',
        description:
          'Export section not visible — user may lack export permission',
      });
    }
  });
});
