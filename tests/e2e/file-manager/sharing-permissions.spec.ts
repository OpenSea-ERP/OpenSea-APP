import { expect, test } from '@playwright/test';
import {
  getAuthenticatedToken,
  injectAuthIntoBrowser,
} from '../helpers/auth.helper';
import {
  createUserWithPermissions,
  getAdminToken,
  STORAGE_PERMISSIONS,
} from '../helpers/permissions.helper';
import {
  createTestFolder,
  getContextMenuItems,
  initializeSystemFolders,
  navigateToFileManager,
  rightClickItem,
} from '../helpers/storage.helper';

// System folder name
const SYSTEM_FOLDER = 'Estoque';
// Filter folder name
const FILTER_FOLDER = 'Boletos (Todos)';

test.beforeAll(async () => {
  const admin = await getAdminToken();
  await initializeSystemFolders(admin.token);
});

/**
 * Open the "Gerenciar acesso" dialog for a folder via context menu.
 */
async function openAccessDialog(
  page: import('@playwright/test').Page,
  folderName: string
): Promise<boolean> {
  await rightClickItem(page, folderName);

  const manageAccessItem = page.locator(
    '[role="menuitem"]:has-text("Gerenciar acesso")'
  );
  if (await manageAccessItem.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await manageAccessItem.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({
      timeout: 5_000,
    });
    return true;
  }
  return false;
}

/**
 * Get the sidebar section labels in the access dialog.
 */
async function getAccessDialogSections(
  page: import('@playwright/test').Page
): Promise<string[]> {
  const dialog = page.locator('[role="dialog"]');
  // Sections are sidebar buttons with text matching known section names
  const sections = dialog.locator('button, [role="tab"], a').filter({
    hasText: /Quem pode ver|Grupos|Usuários/,
  });

  const texts: string[] = [];
  const count = await sections.count();
  for (let i = 0; i < count; i++) {
    const text = await sections.nth(i).textContent();
    if (text?.trim()) texts.push(text.trim());
  }
  return texts;
}

test.describe('File Manager - Permissões de Compartilhamento (Diálogo)', () => {
  // ─── 6.1 Tab "Grupos" com share-group ──────────────────────────────

  test('6.1 - Deve exibir tab "Grupos" com storage.user-folders.share-group', async ({
    page,
  }) => {
    const folderName = `e2e-share-grp-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_GROUP,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const opened = await openAccessDialog(page, folderName);
    expect(opened).toBe(true);

    const sections = await getAccessDialogSections(page);
    expect(sections).toContain('Quem pode ver');
    expect(sections).toContain('Grupos');
  });

  // ─── 6.2 Tab "Usuários" com share-user ─────────────────────────────

  test('6.2 - Deve exibir tab "Usuários" com storage.user-folders.share-user', async ({
    page,
  }) => {
    const folderName = `e2e-share-usr-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_USER,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const opened = await openAccessDialog(page, folderName);
    expect(opened).toBe(true);

    const sections = await getAccessDialogSections(page);
    expect(sections).toContain('Quem pode ver');
    expect(sections).toContain('Usuários');
  });

  // ─── 6.3 Ambas as tabs com ambas permissões ────────────────────────

  test('6.3 - Deve exibir ambas as tabs com ambas permissões de share', async ({
    page,
  }) => {
    const folderName = `e2e-share-both-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_USER,
      STORAGE_PERMISSIONS.USER_FOLDERS_SHARE_GROUP,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const opened = await openAccessDialog(page, folderName);
    expect(opened).toBe(true);

    const sections = await getAccessDialogSections(page);
    expect(sections).toContain('Quem pode ver');
    expect(sections).toContain('Grupos');
    expect(sections).toContain('Usuários');
    expect(sections).toHaveLength(3);
  });

  // ─── 6.4 "Gerenciar acesso" não aparece sem share permissions ─────

  test('6.4 - Deve ocultar "Gerenciar acesso" sem permissões de share em pasta do usuário', async ({
    page,
  }) => {
    const folderName = `e2e-share-none-${Date.now()}`;
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
      STORAGE_PERMISSIONS.USER_FOLDERS_READ,
      // NO share-user / share-group
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await createTestFolder(auth.token, folderName);

    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await rightClickItem(page, folderName);
    const items = await getContextMenuItems(page);

    // "Gerenciar acesso" should NOT appear (canShare is false)
    expect(items).not.toContain('Gerenciar acesso');
  });

  // ─── 6.5 Permissão de system-folder para pasta de sistema ─────────

  test('6.5 - Deve usar permissão de sistema-folder para pasta de sistema', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_SHARE_GROUP,
      // NO user-folders share permissions
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const opened = await openAccessDialog(page, SYSTEM_FOLDER);
    expect(opened).toBe(true);

    const sections = await getAccessDialogSections(page);
    expect(sections).toContain('Grupos');
  });

  // ─── 6.6 Permissão de sistema para pasta de filtragem (isSystem+isFilter) ───

  test('6.6 - Deve usar permissão de sistema para pasta de filtragem (isSystem+isFilter)', async ({
    page,
  }) => {
    // Filter folders also have isSystem=true, so resolveFolderPermissions
    // uses system-folder permissions (isSystem check comes first).
    // We need system-folders.share-user to see "Gerenciar acesso" on filter folders.
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_LIST,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_READ,
      STORAGE_PERMISSIONS.SYSTEM_FOLDERS_SHARE_USER,
      STORAGE_PERMISSIONS.FILTER_FOLDERS_LIST,
      STORAGE_PERMISSIONS.FILTER_FOLDERS_READ,
    ]);

    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    const opened = await openAccessDialog(page, FILTER_FOLDER);
    expect(opened).toBe(true);

    const sections = await getAccessDialogSections(page);
    expect(sections).toContain('Usuários');
  });
});
