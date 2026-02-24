import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
} from '../helpers/permissions.helper';
import {
  clickContextMenuItem,
  createTestFolder,
  doubleClickItem,
  enterActionPin,
  getBreadcrumbTexts,
  getContextMenuItems,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
  setActionPinViaApi,
  waitForToast,
} from '../helpers/storage.helper';

const TEST_PIN = '1234';
const TEST_PASSWORD = 'E2eTest@123';

let userToken: string;
let userTenantId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  const user = await createUserWithPermissions(
    [...ALL_STORAGE_PERMISSIONS],
    `e2e-folder-crud-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  // Set action PIN for delete tests
  await setActionPinViaApi(userToken, TEST_PASSWORD, TEST_PIN);
});

test.describe('File Manager - CRUD de Pastas', () => {
  // ─── 1.1 Criar pasta via dialog ──────────────────────────────────
  test('1.1 - Criar pasta via dialog', async ({ page }) => {
    const folderName = `e2e-create-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Click "Nova pasta" button
    await page.locator('button:has-text("Nova pasta")').click();

    // Fill in the name
    await page.locator('input[placeholder="Nome da pasta"]').fill(folderName);

    // Select a color (e.g. blue = #3b82f6, 4th color option)
    await page
      .locator(
        'button[type="button"][style*="background-color: rgb(59, 130, 246)"]'
      )
      .click();

    // Click "Criar pasta"
    await page.locator('button:has-text("Criar pasta")').click();

    // Verify toast
    await waitForToast(page, 'Pasta criada com sucesso');

    // Reload to force fresh data fetch
    await navigateToFileManager(page);

    // Verify folder appears in the grid (use title attr to handle CSS truncation)
    await expect(page.locator(`[title="${folderName}"]`)).toBeVisible({
      timeout: 15_000,
    });
  });

  // ─── 1.2 Renomear pasta via context menu ─────────────────────────
  test('1.2 - Renomear pasta via context menu', async ({ page }) => {
    const originalName = `e2e-rename-${Date.now()}`;
    const newName = `e2e-renamed-${Date.now()}`;

    await createTestFolder(userToken, originalName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click → Renomear
    await rightClickItem(page, originalName);
    await clickContextMenuItem(page, 'Renomear');

    // Dialog opens with current name
    const input = page.locator('input[placeholder="Novo nome"]');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.clear();
    await input.fill(newName);

    // Click "Renomear"
    await page
      .locator('button:has-text("Renomear"):not(:has-text("Renomeando"))')
      .last()
      .click();

    // Verify toast and updated name
    await waitForToast(page, 'Pasta renomeada com sucesso');
    await expect(page.locator(`text=${newName}`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── 1.3 Alterar cor da pasta via context menu ────────────────────
  test('1.3 - Alterar cor da pasta via context menu', async ({ page }) => {
    const folderName = `e2e-color-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click → Alterar cor
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Alterar cor');

    // Dialog opens — select a different color (red = #ef4444)
    const colorButton = page.locator(
      'button[type="button"][style*="background-color: rgb(239, 68, 68)"]'
    );
    await expect(colorButton).toBeVisible({ timeout: 5_000 });
    await colorButton.click();

    // Click "Salvar"
    await page.locator('button:has-text("Salvar")').click();

    // Verify toast
    await waitForToast(page, 'Cor da pasta atualizada');
  });

  // ─── 1.4 Mover pasta via context menu ────────────────────────────
  test('1.4 - Mover pasta para outra pasta via context menu', async ({
    page,
  }) => {
    const targetName = `e2e-target-${Date.now()}`;
    const moveName = `e2e-move-${Date.now()}`;

    await createTestFolder(userToken, targetName);
    await createTestFolder(userToken, moveName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click on the folder to move → Mover
    await rightClickItem(page, moveName);
    await clickContextMenuItem(page, 'Mover');

    // Move dialog opens — select target folder
    const targetItem = page.locator(`[role="dialog"] :text("${targetName}")`);
    await expect(targetItem).toBeVisible({ timeout: 10_000 });
    await targetItem.click();

    // Click "Mover para cá"
    await page.locator('button:has-text("Mover para cá")').click();

    // Verify toast
    await waitForToast(page, 'Item movido com sucesso');

    // Verify folder disappeared from current view
    await expect(page.locator(`text=${moveName}`).first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── 1.5 Excluir pasta (com PIN) ─────────────────────────────────
  test('1.5 - Excluir pasta via context menu com PIN', async ({ page }) => {
    const folderName = `e2e-delete-${Date.now()}`;
    await createTestFolder(userToken, folderName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click → Excluir
    await rightClickItem(page, folderName);
    await clickContextMenuItem(page, 'Excluir');

    // PIN modal appears
    await expect(page.locator('text=Excluir Pasta')).toBeVisible({
      timeout: 5_000,
    });

    // Enter PIN
    await enterActionPin(page, TEST_PIN);

    // Verify toast
    await waitForToast(page, 'Pasta excluída com sucesso');

    // Verify folder disappeared
    await expect(page.locator(`text=${folderName}`).first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── 1.6 Criar subpasta (pasta dentro de pasta) ──────────────────
  test('1.6 - Criar subpasta dentro de pasta existente', async ({ page }) => {
    const parentName = `e2e-parent-${Date.now()}`;
    const childName = `e2e-child-${Date.now()}`;

    const parentId = await createTestFolder(userToken, parentName);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Navigate into parent
    await doubleClickItem(page, parentName);
    await page.waitForTimeout(1_000);

    // Create subfolder
    await page.locator('button:has-text("Nova pasta")').click();
    await page.locator('input[placeholder="Nome da pasta"]').fill(childName);
    await page.locator('button:has-text("Criar pasta")').click();

    // Verify toast
    await waitForToast(page, 'Pasta criada com sucesso');

    // Verify subfolder appears
    await expect(page.locator(`text=${childName}`)).toBeVisible({
      timeout: 10_000,
    });

    // Verify breadcrumb shows parent
    const breadcrumb = await getBreadcrumbTexts(page);
    expect(breadcrumb.join(' ')).toContain(parentName);
  });

  // ─── 1.7 Pasta do sistema não permite editar/excluir ─────────────
  test('1.7 - Pasta do sistema não exibe opções de edição/exclusão', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Right-click system folder
    await rightClickItem(page, 'Estoque');
    const items = await getContextMenuItems(page);

    // Should have "Abrir" but NOT edit/delete options
    expect(items).toContain('Abrir');
    expect(items).not.toContain('Renomear');
    expect(items).not.toContain('Alterar cor');
    expect(items).not.toContain('Mover');
    expect(items).not.toContain('Excluir');
  });

  // ─── 1.8 Criar pasta sem cor (cor padrão) ────────────────────────
  test('1.8 - Criar pasta sem selecionar cor (usa cor padrão)', async ({
    page,
  }) => {
    const folderName = `e2e-default-color-${Date.now()}`;

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    // Click "Nova pasta"
    await page.locator('button:has-text("Nova pasta")').click();

    // Fill name only, don't select any color
    await page.locator('input[placeholder="Nome da pasta"]').fill(folderName);
    await page.locator('button:has-text("Criar pasta")').click();

    // Verify toast
    await waitForToast(page, 'Pasta criada com sucesso');

    // Reload to force fresh data fetch
    await navigateToFileManager(page);

    // Verify folder appears (use title attr to handle CSS truncation)
    await expect(page.locator(`[title="${folderName}"]`)).toBeVisible({
      timeout: 15_000,
    });
  });
});
