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
  apiRequest,
  clickTrashToggle,
  createTestFolder,
  deleteFileViaApi,
  initializeSystemFolders,
  navigateToFileManager,
  uploadTestFile,
} from '../helpers/storage.helper';

// Base permissions to see the file manager page
const BASE_PERMS = [
  STORAGE_PERMISSIONS.INTERFACE_VIEW,
  STORAGE_PERMISSIONS.USER_FOLDERS_LIST,
  STORAGE_PERMISSIONS.USER_FOLDERS_READ,
  STORAGE_PERMISSIONS.USER_FOLDERS_CREATE,
];

let adminToken: string;
let testFileId: string;
let testFolderId: string;

test.beforeAll(async () => {
  const admin = await getAdminToken();
  adminToken = admin.token;
  await initializeSystemFolders(adminToken);

  // Create a folder + file and soft-delete the file for trash tests
  const folderName = `e2e-tperms-${Date.now()}`;
  testFolderId = await createTestFolder(adminToken, folderName);
  testFileId = await uploadTestFile(
    adminToken,
    testFolderId,
    `tperm-${Date.now()}.txt`
  );
  await deleteFileViaApi(adminToken, testFileId);
});

test.describe('File Manager - Permissões da Lixeira (UI)', () => {
  // ─── TP-1 Botão "Lixeira" visível com FILES_LIST ──────────────────
  test('TP-1 - Deve exibir botão "Lixeira" com permissão storage.files.list', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      STORAGE_PERMISSIONS.FILES_LIST,
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await expect(page.locator('button:has-text("Lixeira")')).toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── TP-2 Botão "Lixeira" oculto sem FILES_LIST ───────────────────
  test('TP-2 - Deve ocultar botão "Lixeira" sem permissão storage.files.list', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      // NO FILES_LIST
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await page.waitForTimeout(2_000);
    await expect(page.locator('button:has-text("Lixeira")')).not.toBeVisible();
  });

  // ─── TP-3 "Restaurar" visível com FILES_UPDATE ─────────────────────
  test('TP-3 - Deve exibir botão "Restaurar" com permissão files.update', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_UPDATE,
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    // Ensure at least one Restaurar button is visible
    await expect(
      page.locator('button:has-text("Restaurar")').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── TP-4 "Restaurar" oculto sem FILES_UPDATE ─────────────────────
  test('TP-4 - Deve ocultar botão "Restaurar" sem permissão files.update', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO FILES_UPDATE
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);
    await page.waitForTimeout(2_000);

    const restoreButtons = page.locator('button:has-text("Restaurar")');
    const count = await restoreButtons.count();
    // Either no buttons or they should be disabled
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(restoreButtons.nth(i)).toBeDisabled();
      }
    }
  });

  // ─── TP-5 "Esvaziar lixeira" visível com FILES_DELETE ─────────────
  test('TP-5 - Deve exibir "Esvaziar lixeira" com permissão files.delete', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      STORAGE_PERMISSIONS.FILES_DELETE,
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);
    await page.waitForTimeout(1_000);

    await expect(
      page.locator('button:has-text("Esvaziar lixeira")')
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─── TP-6 "Esvaziar lixeira" oculto sem FILES_DELETE ──────────────
  test('TP-6 - Deve ocultar "Esvaziar lixeira" sem permissão files.delete', async ({
    page,
  }) => {
    const user = await createUserWithPermissions([
      ...BASE_PERMS,
      STORAGE_PERMISSIONS.FILES_LIST,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO FILES_DELETE
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);
    await injectAuthIntoBrowser(page, auth.token, auth.tenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);
    await page.waitForTimeout(2_000);

    await expect(
      page.locator('button:has-text("Esvaziar lixeira")')
    ).not.toBeVisible();
  });
});

test.describe('File Manager - Enforcement Backend (Lixeira)', () => {
  // ─── TP-7 Backend rejeita restauração sem permissão ────────────────
  test('TP-7 - Backend deve rejeitar restauração sem permissão (403)', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO FILES_UPDATE
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'POST',
      `/v1/storage/trash/restore-file/${testFileId}`
    );

    expect(status).toBe(403);
  });

  // ─── TP-8 Backend rejeita esvaziar lixeira sem permissão ──────────
  test('TP-8 - Backend deve rejeitar esvaziar lixeira sem permissão (403)', async () => {
    const user = await createUserWithPermissions([
      STORAGE_PERMISSIONS.INTERFACE_VIEW,
      STORAGE_PERMISSIONS.FILES_READ,
      // NO FILES_DELETE
    ]);
    const auth = await getAuthenticatedToken(user.email, user.password);

    const { status } = await apiRequest(
      auth.token,
      'DELETE',
      '/v1/storage/trash/empty'
    );

    expect(status).toBe(403);
  });
});
