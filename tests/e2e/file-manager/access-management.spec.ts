import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createPermissionGroup,
  createUserWithPermissions,
  getAdminToken,
} from '../helpers/permissions.helper';
import {
  clickContextMenuItem,
  createTestFolder,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
  setFolderAccessViaApi,
  waitForToast,
} from '../helpers/storage.helper';

let userToken: string;
let userTenantId: string;
let testGroupId: string;
let testGroupName: string;
let secondUserUsername: string;
let secondUserId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  // Create primary user with all storage + rbac.groups.list permissions
  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS, 'rbac.groups.list'],
    `e2e-access-mgmt-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Create a test group for sharing tests
  testGroupName = `e2e-share-target-${Date.now().toString(36)}`;
  testGroupId = await createPermissionGroup(admin.token, testGroupName, [
    'storage.interface.view',
  ]);

  // Create a second user for user sharing tests
  const secondUser = await createUserWithPermissions(
    [ALL_STORAGE_PERMISSIONS[0]],
    `e2e-share-user-${Date.now().toString(36)}`
  );
  secondUserId = secondUser.userId;
  secondUserUsername = secondUser.username;
});

test.describe('File Manager - Gerenciamento de Acesso', () => {
  // ─── 4.1 Abrir dialog "Gerenciar acesso" ─────────────────────────
  test('4.1 - Abrir dialog "Gerenciar acesso" em pasta do usuário', async ({
    page,
  }) => {
    const folderName = `e2e-access-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click → Gerenciar acesso
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');

    // Dialog opens
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Sidebar sections visible: "Quem pode ver", "Grupos", "Usuários"
    await expect(
      page.locator('button:has-text("Quem pode ver")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Grupos")')).toBeVisible();
    await expect(page.locator('button:has-text("Usuários")')).toBeVisible();

    // Empty state: "Nenhuma regra de acesso configurada"
    await expect(
      page.locator('text=Nenhuma regra de acesso configurada')
    ).toBeVisible();
  });

  // ─── 4.2 Compartilhar pasta com grupo via dialog ──────────────────
  test('4.2 - Compartilhar pasta com grupo', async ({ page }) => {
    const folderName = `e2e-share-group-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Grupos" tab and wait for groups to load from API
    await page.locator('button:has-text("Grupos")').click();
    await page.waitForResponse(
      resp => resp.url().includes('/rbac/permission-groups'),
      { timeout: 15_000 }
    );
    await page.waitForTimeout(1_000);

    // Search for the group
    const groupSearchInput = page.locator(
      'input[placeholder="Buscar grupo..."]'
    );
    await groupSearchInput.fill(testGroupName);
    await page.waitForTimeout(500);

    // Select the group
    const groupButton = page.locator(`button:has-text("${testGroupName}")`);
    await expect(groupButton).toBeVisible({ timeout: 10_000 });
    await groupButton.click();

    // Permissions form appears — check "Escrita" in addition to default "Leitura"
    await expect(
      page.locator('text=Permissões para o grupo selecionado')
    ).toBeVisible();

    const escritaCheckbox = page
      .locator('label:has-text("Escrita") [role="checkbox"]')
      .first();
    await escritaCheckbox.click();

    // Click "Adicionar"
    await page.locator('button:has-text("Adicionar")').click();

    // Verify toast
    await waitForToast(page, 'Acesso concedido ao grupo');

    // Verify group appears in "Grupos com acesso"
    await expect(page.locator(`text=${testGroupName}`).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 4.3 Compartilhar pasta com usuário via dialog ────────────────
  test('4.3 - Compartilhar pasta com usuário', async ({ page }) => {
    const folderName = `e2e-share-user-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Usuários" tab
    await page.locator('button:has-text("Usuários")').click();
    await page.waitForTimeout(500);

    // Search for the user by username
    const usernameInput = page.locator(
      'input[placeholder="Username exato do usuário..."]'
    );
    await usernameInput.fill(secondUserUsername);

    // Click "Buscar"
    await page.locator('button:has-text("Buscar")').click();
    await page.waitForTimeout(2_000);

    // Select the found user
    const userButton = page.locator(
      `button:has-text("@${secondUserUsername}")`
    );
    await expect(userButton).toBeVisible({ timeout: 10_000 });
    await userButton.click();

    // Permissions form appears — keep default Leitura
    await expect(
      page.locator('text=Permissões para o usuário selecionado')
    ).toBeVisible();

    // Click "Adicionar"
    await page.locator('button:has-text("Adicionar")').click();

    // Verify toast
    await waitForToast(page, 'Acesso concedido ao usuário');

    // Verify form is reset (search input cleared, no "já possui acesso" warning)
    const resetInput = page.locator(
      'input[placeholder="Username exato do usuário..."]'
    );
    await expect(resetInput).toHaveValue('', { timeout: 5_000 });
    await expect(page.locator('text=já possui acesso')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  // ─── 4.4 Remover regra de acesso ─────────────────────────────────
  test('4.4 - Remover regra de acesso', async ({ page }) => {
    const folderName = `e2e-remove-access-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    // Add access via API
    await setFolderAccessViaApi(userToken, folderId, {
      groupId: testGroupId,
      canRead: true,
      canWrite: true,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Should show the rule in "Quem pode ver"
    await expect(page.locator(`text=${testGroupName}`).first()).toBeVisible({
      timeout: 10_000,
    });

    // Click the remove (trash) button
    const removeButton = page.locator('button:has(svg.lucide-trash-2)').first();
    await removeButton.click();

    // Verify toast
    await waitForToast(page, 'Regra de acesso removida');
  });

  // ─── 4.5 Verificar permissões na overview ────────────────────────
  test('4.5 - Verificar permissões exibidas na overview', async ({ page }) => {
    const folderName = `e2e-overview-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    // Add access with read + write
    await setFolderAccessViaApi(userToken, folderId, {
      groupId: testGroupId,
      canRead: true,
      canWrite: true,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Verify permission badges
    await expect(
      page.locator('[role="dialog"]').getByText('Leitura').first()
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('[role="dialog"]').getByText('Escrita').first()
    ).toBeVisible();
  });

  // ─── 4.6 Buscar usuário inexistente mostra erro ──────────────────
  test('4.6 - Buscar usuário inexistente mostra mensagem de erro', async ({
    page,
  }) => {
    const folderName = `e2e-nouser-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Usuários" tab
    await page.locator('button:has-text("Usuários")').click();
    await page.waitForTimeout(500);

    // Search for nonexistent user
    const usernameInput = page.locator(
      'input[placeholder="Username exato do usuário..."]'
    );
    await usernameInput.fill('nonexistent_user_xyz_999');

    // Click "Buscar"
    await page.locator('button:has-text("Buscar")').click();
    await page.waitForTimeout(2_000);

    // Verify error message
    await expect(
      page.locator('text=Nenhum usuário encontrado com o username')
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── 4.7 Compartilhar pasta de sistema com grupo ──────────────────
  test('4.7 - Compartilhar pasta de sistema com grupo', async ({ page }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click system folder → Gerenciar acesso
    await rightClickItem(page, 'Estoque');
    await clickContextMenuItem(page, 'Gerenciar acesso');

    // Dialog opens
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Grupos" tab and wait for groups to load
    await page.locator('button:has-text("Grupos")').click();
    await page.waitForResponse(
      resp => resp.url().includes('/rbac/permission-groups'),
      { timeout: 15_000 }
    );
    await page.waitForTimeout(1_000);

    // Search for the group
    const groupSearchInput = page.locator(
      'input[placeholder="Buscar grupo..."]'
    );
    await groupSearchInput.fill(testGroupName);
    await page.waitForTimeout(500);

    // Select the group
    const groupButton = page.locator(`button:has-text("${testGroupName}")`);
    await expect(groupButton).toBeVisible({ timeout: 10_000 });
    await groupButton.click();

    // Keep default permissions (Leitura)
    await expect(
      page.locator('text=Permissões para o grupo selecionado')
    ).toBeVisible();

    // Click "Adicionar"
    await page.locator('button:has-text("Adicionar")').click();

    // Verify toast
    await waitForToast(page, 'Acesso concedido ao grupo');
  });

  // ─── 4.8 Alterar permissões de regra existente ─────────────────────
  test('4.8 - Alterar permissões de regra existente', async ({ page }) => {
    const folderName = `e2e-edit-perm-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);

    // Add access with canRead=true, canWrite=false via API
    await setFolderAccessViaApi(userToken, folderId, {
      groupId: testGroupId,
      canRead: true,
      canWrite: false,
    });

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Open access dialog
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Gerenciar acesso');
    await expect(page.locator('text=Gerenciar acesso')).toBeVisible({
      timeout: 10_000,
    });

    // Should show the rule in overview
    await expect(page.locator(`text=${testGroupName}`).first()).toBeVisible({
      timeout: 10_000,
    });

    // Click edit (Pencil) button on the rule
    const editButton = page.locator('button:has(svg.lucide-pencil)').first();
    await editButton.click();

    // Edit form should appear — check "Escrita"
    const escritaCheckbox = page
      .locator('label:has-text("Escrita") [role="checkbox"]')
      .first();
    await escritaCheckbox.click();

    // Click "Salvar"
    await page.locator('button:has-text("Salvar")').click();

    // Verify toast
    await waitForToast(page, 'Permissões atualizadas');

    // Verify "Escrita" badge now appears on the rule
    await expect(
      page.locator('[role="dialog"]').getByText('Escrita').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
