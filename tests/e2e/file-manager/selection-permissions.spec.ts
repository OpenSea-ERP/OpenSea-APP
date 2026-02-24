import { expect, test } from '@playwright/test';
import {
  API_URL,
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  ALL_STORAGE_PERMISSIONS,
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  clickItem,
  createTestFolder,
  initializeSystemFolders,
  navigateToFileManager,
  uploadTestFile,
} from '../helpers/storage.helper';

// System folder name
const SYSTEM_FOLDER = 'Estoque';

// Test file that lives in a system folder
let systemFolderId: string;
const TEST_FILE_NAME = `e2e-sel-${Date.now()}.txt`;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);

  // Find system folder and upload a test file
  const res = await fetch(`${API_URL}/v1/storage/folders/root/contents`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const data = await res.json();
  const estoque = data.folders.find(
    (f: { name: string; isSystem: boolean }) =>
      f.name === 'Estoque' && f.isSystem
  );
  if (!estoque) throw new Error('System folder "Estoque" not found');
  systemFolderId = estoque.id;

  await uploadTestFile(admin.token, systemFolderId, TEST_FILE_NAME);
});

/**
 * Helper to get visible text of selection toolbar action buttons.
 */
async function getSelectionActions(
  page: import('@playwright/test').Page
): Promise<string[]> {
  // Wait a bit for the selection toolbar to appear
  await page.waitForTimeout(500);

  // The SelectionToolbar renders action buttons with labels
  const toolbar = page
    .locator('[class*="fixed"][class*="bottom"], [class*="sticky"]')
    .last();
  if (!(await toolbar.isVisible({ timeout: 3_000 }).catch(() => false))) {
    return [];
  }

  const buttons = toolbar.locator('button');
  const texts: string[] = [];
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const text = await buttons.nth(i).textContent();
    if (text?.trim()) texts.push(text.trim());
  }
  return texts;
}

test.describe('File Manager - Permissões da Toolbar de Seleção', () => {
  // ─── 5.1 Ocultar "Mover" sem permissão de update ──────────────────

  test('5.1 - Deve ocultar "Mover" na seleção sem permissão de update', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_DOWNLOAD,
      // NO files.update and NO user-folders.update
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // Navigate to system folder and select a file
    await page.locator(`text="${SYSTEM_FOLDER}"`).first().dblclick();
    await expect(page.locator(`text="${TEST_FILE_NAME}"`).first()).toBeVisible({
      timeout: 10_000,
    });

    await clickItem(page, TEST_FILE_NAME);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Mover');
  });

  // ─── 5.2 Ocultar "Mover" ao selecionar pasta de sistema ───────────

  test('5.2 - Deve ocultar "Mover" ao selecionar pasta de sistema', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([...ALL_STORAGE_PERMISSIONS]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // Click (select) the system folder
    await clickItem(page, SYSTEM_FOLDER);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Mover');
  });

  // ─── 5.3 Ocultar "Compartilhar" sem permissão de share ────────────

  test('5.3 - Deve ocultar "Compartilhar" sem permissão de share', async ({
    page,
  }) => {
    const folderName = `e2e-sel-share-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_UPDATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_DOWNLOAD,
      // NO share-user / share-group
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickItem(page, folderName);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Compartilhar');
  });

  // ─── 5.4 Ocultar "Alterar cor" sem user-folders.update ────────────

  test('5.4 - Deve ocultar "Alterar cor" sem storage.user-folders.update', async ({
    page,
  }) => {
    const folderName = `e2e-sel-color-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_DOWNLOAD,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_USER,
      // NO user-folders.update
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickItem(page, folderName);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Alterar cor');
  });

  // ─── 5.5 Ocultar "Alterar cor" ao selecionar pasta de sistema ─────

  test('5.5 - Deve ocultar "Alterar cor" ao selecionar pasta de sistema', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([...ALL_STORAGE_PERMISSIONS]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickItem(page, SYSTEM_FOLDER);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Alterar cor');
  });

  // ─── 5.6 Ocultar "Baixar" sem permissão de download ───────────────

  test('5.6 - Deve ocultar "Baixar" sem permissão de download de arquivo', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO files.download
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    // Navigate to system folder and select file
    await page.locator(`text="${SYSTEM_FOLDER}"`).first().dblclick();
    await expect(page.locator(`text="${TEST_FILE_NAME}"`).first()).toBeVisible({
      timeout: 10_000,
    });

    await clickItem(page, TEST_FILE_NAME);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).not.toContain('Baixar');
  });

  // ─── 5.7 Todas as ações com permissões completas ───────────────────

  test('5.7 - Deve exibir todas as ações com permissões completas em pasta de usuário', async ({
    page,
  }) => {
    const folderName = `e2e-sel-full-${Date.now()}`;
    const user = await createUserWithPermissions([...ALL_STORAGE_PERMISSIONS]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickItem(page, folderName);
    const actions = await getSelectionActions(page);

    expect(actions.join(',')).toContain('Mover');
    expect(actions.join(',')).toContain('Compartilhar');
    expect(actions.join(',')).toContain('Alterar cor');
    expect(actions.join(',')).toContain('Baixar');
  });
});
