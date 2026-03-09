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
  addTeamMemberViaApi,
  createTeamViaApi,
  enterActionPin,
  listTeamMembersViaApi,
  navigateToTeamDetail,
  waitForToast,
} from '../helpers/teams.helper';
import { setActionPinViaApi } from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let ownerToken: string;
let ownerTenantId: string;
let ownerUserId: string;
let memberUserId: string;
let memberEmail: string;

test.beforeAll(async () => {
  // Create the owner user (full permissions)
  const owner = await createTeamsUser(
    [
      ...TEAMS_FULL_PERMISSIONS,
      CORE_PERMISSIONS.USERS_LIST,
      CORE_PERMISSIONS.USERS_CREATE,
    ],
    `e2e-teams-members-owner-${Date.now().toString(36)}`
  );
  const ownerAuth = await getAuthenticatedToken(owner.email, owner.password);
  ownerToken = ownerAuth.token;
  ownerTenantId = ownerAuth.tenantId;
  ownerUserId = ownerAuth.userId;

  // Set action PIN for the owner
  await setActionPinViaApi(ownerToken, TEST_PASSWORD, TEST_PIN);

  // Create a second user to be used as a member
  const member = await createTeamsUser(
    [...TEAMS_FULL_PERMISSIONS],
    `e2e-teams-members-member-${Date.now().toString(36)}`
  );
  const memberAuth = await getAuthenticatedToken(member.email, member.password);
  memberUserId = memberAuth.userId;
  memberEmail = member.email;
});

test.describe('Teams - Gerenciamento de Membros', () => {
  test('2.1 - Criador aparece como OWNER na aba Membros', async ({ page }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-owner-check-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // The owner should be listed with "Proprietário" badge (members always visible)
    await expect(page.locator('text=Proprietário')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('2.2 - Adicionar membro via API e verificar na UI', async ({ page }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-add-member-${Date.now()}`,
    });

    // Add member via API
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Should see 2 members: owner + the new member (members always visible)
    await expect(page.locator('text=Proprietário')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text=Membro').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('2.3 - Adicionar membro como ADMIN via API e verificar badge', async ({
    page,
  }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-admin-member-${Date.now()}`,
    });

    // Add member as ADMIN
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId, 'ADMIN');

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Should see "Administrador" badge (members always visible)
    await expect(page.locator('text=Administrador')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('2.4 - Alterar papel de MEMBER para ADMIN (com PIN)', async ({
    page,
  }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-change-role-${Date.now()}`,
    });

    // Add as MEMBER first
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId, 'MEMBER');

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Members are always visible - wait for member badge
    await expect(page.locator('text=Membro').first()).toBeVisible({
      timeout: 10_000,
    });

    // Click the change role button (Shield icon) — only non-owner members have it
    await page.locator('button[title="Alterar papel"]').first().click();

    // Change role dialog should appear
    await expect(page.locator('text=Alterar Papel do Membro')).toBeVisible({
      timeout: 5_000,
    });

    // Select ADMIN role from the dropdown
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Administrador")').click();

    // Click Confirmar — opens PIN confirmation
    await page.locator('button:has-text("Confirmar")').click();

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    await waitForToast(page, 'Papel alterado com sucesso');
  });

  test('2.5 - Remover membro da equipe (com PIN)', async ({ page }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-remove-member-${Date.now()}`,
    });

    // Add member first
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Members are always visible
    await expect(page.locator('text=Membro').first()).toBeVisible({
      timeout: 10_000,
    });

    // Click remove button on the non-owner member — opens PIN confirmation
    const removeBtn = page.locator('button[title="Remover membro"]').first();
    await removeBtn.click();

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    await waitForToast(page, 'Membro removido com sucesso');
  });

  test('2.6 - OWNER não tem botões de alterar papel ou remover', async ({
    page,
  }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-owner-no-actions-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Members are always visible
    await expect(page.locator('text=Proprietário')).toBeVisible({
      timeout: 10_000,
    });

    // The owner row should NOT have change-role or remove buttons
    // With only 1 member (owner), there should be no action buttons at all
    await expect(page.locator('button[title="Alterar papel"]')).toHaveCount(0);
    await expect(page.locator('button[title="Remover membro"]')).toHaveCount(0);
  });

  test('2.7 - Botão "Adicionar Membro" visível com permissão', async ({
    page,
  }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-add-btn-${Date.now()}`,
    });

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // "Adicionar Membro" button should be visible (members always visible)
    await expect(
      page.locator('button:has-text("Adicionar Membro")')
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('2.8 - Transferir propriedade via UI (com PIN)', async ({ page }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-transfer-${Date.now()}`,
    });

    // Add member to transfer ownership to
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    // Wait for member to be visible
    await expect(page.locator('text=Membro').first()).toBeVisible({
      timeout: 10_000,
    });

    // Click the change role button for the non-owner member
    await page.locator('button[title="Alterar papel"]').first().click();

    // Change role dialog should appear
    await expect(page.locator('text=Alterar Papel do Membro')).toBeVisible({
      timeout: 5_000,
    });

    // Select OWNER (transfer ownership) from the dropdown
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Proprietário")').click();

    // Warning banner about transfer should appear
    await expect(page.locator('text=Transferência de propriedade')).toBeVisible(
      {
        timeout: 3_000,
      }
    );

    // Click "Transferir Propriedade" button (not the combobox) — opens PIN confirmation
    await page
      .getByRole('button', { name: 'Transferir Propriedade', exact: true })
      .click();

    // PIN modal should appear with transfer title
    await expect(
      page.locator('text=Confirmar Transferência de Propriedade')
    ).toBeVisible({
      timeout: 5_000,
    });

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    await waitForToast(page, 'Propriedade transferida com sucesso');
  });

  test('2.9 - Modal de alterar papel mostra aviso ao selecionar OWNER', async ({
    page,
  }) => {
    const team = await createTeamViaApi(ownerToken, {
      name: `e2e-owner-warning-${Date.now()}`,
    });

    // Add member
    await addTeamMemberViaApi(ownerToken, team.id, memberUserId);

    await injectAuthIntoBrowser(page, ownerToken, ownerTenantId);
    await navigateToTeamDetail(page, team.id);

    await expect(page.locator('text=Membro').first()).toBeVisible({
      timeout: 10_000,
    });

    // Open change role dialog
    await page.locator('button[title="Alterar papel"]').first().click();
    await expect(page.locator('text=Alterar Papel do Membro')).toBeVisible({
      timeout: 5_000,
    });

    // Initially, no warning should be visible (default is ADMIN or MEMBER)
    await expect(
      page.locator('text=Transferência de propriedade')
    ).not.toBeVisible();

    // Select OWNER
    await page.locator('button[role="combobox"]').click();
    await page.locator('[role="option"]:has-text("Proprietário")').click();

    // Warning should now be visible
    await expect(
      page.locator('text=Transferência de propriedade')
    ).toBeVisible();

    // Button should say "Transferir Propriedade" instead of "Confirmar"
    await expect(
      page.getByRole('button', { name: 'Transferir Propriedade', exact: true })
    ).toBeVisible();

    // Cancel
    await page.locator('button:has-text("Cancelar")').click();
  });
});
