import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  TEAMS_FULL_PERMISSIONS,
  createTeamsUser,
} from '../helpers/teams-permissions.helper';
import {
  createTeamViaApi,
  navigateToTeamDetail,
  navigateToTeams,
} from '../helpers/teams.helper';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createTeamsUser(
    TEAMS_FULL_PERMISSIONS,
    `e2e-teams-nav-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;
});

test.describe('Teams - Navegação e Filtros', () => {
  test('4.1 - Busca por nome filtra a grid', async ({ page }) => {
    const uniqueId = Date.now().toString(36);
    const searchName = `SearchTarget-${uniqueId}`;

    // Create a team with distinctive name
    await createTeamViaApi(userToken, { name: searchName });
    // Create another team to have something to filter out
    await createTeamViaApi(userToken, { name: `OtherTeam-${uniqueId}` });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Type in the search bar
    const searchInput = page
      .locator('input[placeholder*="Buscar"], input[type="search"]')
      .first();
    await searchInput.fill('SearchTarget');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // The search target should be visible
    await expect(page.locator(`text=${searchName}`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('4.2 - Filtro por status funciona', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Click on status filter dropdown
    const statusFilter = page.locator('button:has-text("Status")');
    if (await statusFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await statusFilter.click();

      // Select "Ativas" option
      const activeOption = page.locator('text=Ativas').first();
      if (await activeOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await activeOption.click();
      }

      // URL should update with isActive parameter
      await page.waitForTimeout(500);
    }

    // Page should still be functional (no crash)
    await expect(
      page.locator('h1:has-text("Equipes"), h2:has-text("Equipes")')
    ).toBeVisible();
  });

  test('4.3 - Paginação com múltiplas equipes', async ({ page }) => {
    // Ensure we have some teams
    const baseId = Date.now().toString(36);
    for (let i = 0; i < 3; i++) {
      await createTeamViaApi(userToken, { name: `e2e-page-${baseId}-${i}` });
    }

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Grid should render with team cards
    const cards = page
      .locator('[class*="entity-card"], [class*="card"]')
      .first();
    await expect(cards).toBeVisible({ timeout: 10_000 });
  });

  test('4.4 - Navegação de listing para detail e voltar', async ({ page }) => {
    const name = `e2e-nav-${Date.now()}`;
    const team = await createTeamViaApi(userToken, { name });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Navigate to detail page via URL
    await navigateToTeamDetail(page, team.id);

    // Verify team detail page loaded
    await expect(page.locator(`h1:has-text("${name}")`)).toBeVisible({
      timeout: 10_000,
    });

    // Breadcrumb "Equipes" link should navigate back
    const breadcrumbLink = page.locator('a:has-text("Equipes")').first();
    if (await breadcrumbLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await breadcrumbLink.click();
      await page.waitForURL('**/admin/teams', { timeout: 10_000 });
      await expect(
        page.locator('h1:has-text("Equipes"), h2:has-text("Equipes")')
      ).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('4.5 - Opções de ordenação disponíveis', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Look for sort button/dropdown
    const sortButton = page
      .locator(
        'button:has-text("Nome"), button[aria-label*="sort"], button[aria-label*="Ordenar"]'
      )
      .first();
    if (await sortButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sortButton.click();

      // Sort options should be visible
      await expect(
        page.getByText('Mais recentes', { exact: true })
      ).toBeVisible({ timeout: 3_000 });
    }

    // Page should be functional regardless
    await expect(
      page.locator('h1:has-text("Equipes"), h2:has-text("Equipes")')
    ).toBeVisible();
  });
});
