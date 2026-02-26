import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  TEAMS_FULL_PERMISSIONS,
  TEAMS_PERMISSIONS,
  TEAMS_VIEW_ONLY_PERMISSIONS,
  createTeamsUser,
} from '../helpers/teams-permissions.helper';
import {
  createTeamViaApi,
  navigateToTeamDetail,
  navigateToTeams,
} from '../helpers/teams.helper';

// Full-permission user
let fullToken: string;
let fullTenantId: string;

// View-only user (list + read only)
let viewOnlyToken: string;
let viewOnlyTenantId: string;

// User with no teams permissions at all
let noPermToken: string;
let noPermTenantId: string;

test.beforeAll(async () => {
  // Full permissions user
  const fullUser = await createTeamsUser(
    TEAMS_FULL_PERMISSIONS,
    `e2e-teams-acl-full-${Date.now().toString(36)}`
  );
  const fullAuth = await getAuthenticatedToken(fullUser.email, fullUser.password);
  fullToken = fullAuth.token;
  fullTenantId = fullAuth.tenantId;

  // View-only user
  const viewUser = await createTeamsUser(
    TEAMS_VIEW_ONLY_PERMISSIONS,
    `e2e-teams-acl-view-${Date.now().toString(36)}`
  );
  const viewAuth = await getAuthenticatedToken(viewUser.email, viewUser.password);
  viewOnlyToken = viewAuth.token;
  viewOnlyTenantId = viewAuth.tenantId;

  // No permissions user (give a single unrelated permission to create group)
  const noPermUser = await createTeamsUser(
    ['core.profiles.read'],
    `e2e-teams-acl-none-${Date.now().toString(36)}`
  );
  const noPermAuth = await getAuthenticatedToken(noPermUser.email, noPermUser.password);
  noPermToken = noPermAuth.token;
  noPermTenantId = noPermAuth.tenantId;
});

test.describe('Teams - Controle de Acesso', () => {
  test('3.1 - View-only: botão "Nova Equipe" não aparece', async ({ page }) => {
    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToTeams(page);

    // "Nova Equipe" button should NOT be visible
    await expect(page.locator('button:has-text("Nova Equipe")')).toHaveCount(0);
  });

  test('3.2 - View-only: detalhes sem botão "Excluir"', async ({ page }) => {
    // Create team with full user
    const team = await createTeamViaApi(fullToken, {
      name: `e2e-acl-nodelete-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToTeamDetail(page, team.id);

    // Verify team loads
    await expect(page.locator(`h1:has-text("${team.name}")`)).toBeVisible({
      timeout: 10_000,
    });

    // "Excluir" button should NOT be present
    await expect(page.locator('button:has-text("Excluir")')).toHaveCount(0);

    // "Editar" button should also NOT be present (no update permission)
    await expect(page.locator('button:has-text("Editar")')).toHaveCount(0);
  });

  test('3.3 - View-only: aba Membros sem botão "Adicionar Membro"', async ({ page }) => {
    const team = await createTeamViaApi(fullToken, {
      name: `e2e-acl-noadd-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, viewOnlyToken, viewOnlyTenantId);
    await navigateToTeamDetail(page, team.id);

    // Switch to members tab
    await page.getByRole('tab', { name: /Membros/ }).click();

    // "Adicionar Membro" button should NOT be visible
    await expect(page.locator('button:has-text("Adicionar Membro")')).toHaveCount(0);
  });

  test('3.4 - Full permission: todas ações visíveis', async ({ page }) => {
    const team = await createTeamViaApi(fullToken, {
      name: `e2e-acl-full-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, fullToken, fullTenantId);
    await navigateToTeamDetail(page, team.id);

    // "Editar" and "Excluir" buttons should be visible
    await expect(page.locator('button:has-text("Editar")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Excluir")').first()).toBeVisible();

    // Switch to members tab - "Adicionar Membro" should be visible
    await page.getByRole('tab', { name: /Membros/ }).click();
    await expect(page.locator('button:has-text("Adicionar Membro")')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('3.5 - Sem permissão: mensagem de acesso restrito', async ({ page }) => {
    await injectAuthIntoBrowser(page, noPermToken, noPermTenantId);
    await page.goto('/admin/teams');

    // Should show access denied message
    await expect(
      page.getByRole('heading', { name: 'Acesso Restrito' })
    ).toBeVisible({ timeout: 15_000 });
  });
});
