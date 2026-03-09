import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  CORE_PERMISSIONS,
  TEAMS_FULL_PERMISSIONS,
  createTeamsUser,
} from '../helpers/teams-permissions.helper';
import {
  createTeamViaApi,
  createTeamViaUi,
  deleteTeamViaApi,
  enterActionPin,
  navigateToTeamDetail,
  navigateToTeams,
  waitForToast,
} from '../helpers/teams.helper';
import { setActionPinViaApi } from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const user = await createTeamsUser(
    [...TEAMS_FULL_PERMISSIONS, CORE_PERMISSIONS.USERS_LIST],
    `e2e-teams-crud-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  await setActionPinViaApi(userToken, TEST_PASSWORD, TEST_PIN);
});

test.describe('Teams - CRUD de Equipes', () => {
  test('1.1 - Criar equipe com campos mínimos', async ({ page }) => {
    const name = `e2e-minimal-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    await createTeamViaUi(page, name);
    await waitForToast(page, 'Equipe criada com sucesso');

    // Verify team appears in the grid
    await expect(page.locator(`text=${name}`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('1.2 - Criar equipe com todos os campos', async ({ page }) => {
    const name = `e2e-full-${Date.now()}`;
    const description = 'Equipe de testes E2E';

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    await createTeamViaUi(page, name, { description, colorIndex: 0 });
    await waitForToast(page, 'Equipe criada com sucesso');

    await expect(page.locator(`text=${name}`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('1.3 - Botão "Criar Equipe" desabilitado com nome vazio', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeams(page);

    // Open create modal
    await page.locator('button:has-text("Nova Equipe")').click();
    await expect(page.locator('text=Nova Equipe').first()).toBeVisible({
      timeout: 5_000,
    });

    // Submit button should be disabled with empty name
    const submitBtn = page.locator('button:has-text("Criar Equipe")');
    await expect(submitBtn).toBeDisabled();
  });

  test('1.4 - Visualizar detalhes da equipe', async ({ page }) => {
    // Create team via API
    const name = `e2e-detail-${Date.now()}`;
    const team = await createTeamViaApi(userToken, {
      name,
      description: 'Descrição de teste',
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeamDetail(page, team.id);

    // Verify team name in header
    await expect(page.locator(`h1:has-text("${name}")`)).toBeVisible({
      timeout: 10_000,
    });

    // Verify description is visible (no tabs - inline layout)
    await expect(page.getByText('Descrição de teste')).toBeVisible({
      timeout: 5_000,
    });

    // Verify members section is visible
    await expect(page.getByText('Membros').first()).toBeVisible();
  });

  test('1.5 - Editar equipe via modal (nome + descrição)', async ({ page }) => {
    const name = `e2e-edit-${Date.now()}`;
    const team = await createTeamViaApi(userToken, { name });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeamDetail(page, team.id);

    // Click edit button
    await page.locator('button:has-text("Editar")').click();
    await expect(page.locator('text=Editar Equipe')).toBeVisible({
      timeout: 5_000,
    });

    // Update name and description
    const updatedName = `${name}-updated`;
    const nameInput = page.locator('input[placeholder="Nome da equipe"]');
    await nameInput.clear();
    await nameInput.fill(updatedName);

    const descInput = page.locator(
      'textarea[placeholder="Descrição da equipe"]'
    );
    await descInput.fill('Descrição atualizada');

    // Save
    await page.locator('button:has-text("Salvar")').click();
    await waitForToast(page, 'Equipe atualizada com sucesso');

    // Verify updated name in header
    await expect(page.locator(`h1:has-text("${updatedName}")`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('1.6 - Excluir equipe via página de detalhes', async ({ page }) => {
    const name = `e2e-delete-${Date.now()}`;
    const team = await createTeamViaApi(userToken, { name });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeamDetail(page, team.id);

    // Click delete button in header
    await page.locator('button:has-text("Excluir")').first().click();

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    // Confirm button in PIN modal
    const confirmBtn = page.locator('button:has-text("Confirmar")');
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await waitForToast(page, 'Equipe excluída com sucesso');

    // Should redirect to teams list
    await page.waitForURL('**/admin/teams', { timeout: 10_000 });
  });

  test('1.7 - Slug auto-gerado a partir do nome', async ({ page }) => {
    const name = `Equipe Alpha ${Date.now()}`;
    const team = await createTeamViaApi(userToken, { name });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToTeamDetail(page, team.id);

    // The slug should be visible in the info tab
    await expect(page.locator(`text=${team.slug}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('1.8 - Equipe não encontrada mostra mensagem', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await page.goto('/admin/teams/00000000-0000-0000-0000-000000000000');

    await expect(page.locator('text=Equipe não encontrada')).toBeVisible({
      timeout: 15_000,
    });
  });
});
