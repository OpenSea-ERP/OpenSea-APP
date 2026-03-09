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
  clickTrashToggle,
  createTestFolder,
  deleteFileViaApi,
  deleteFolderViaApi,
  enterActionPin,
  initializeSystemFolders,
  navigateToFileManager,
  setActionPinViaApi,
  uploadTestFile,
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
    `e2e-trash-${Date.now().toString(36)}`
  );
  const auth = await getAuthenticatedToken(user.email, user.password);
  userToken = auth.token;
  userTenantId = auth.tenantId;

  await setActionPinViaApi(userToken, TEST_PASSWORD, TEST_PIN);
});

test.describe('File Manager - Lixeira', () => {
  // ─── T-1 Lixeira vazia ──────────────────────────────────────────────
  test('T-1 - Deve exibir lixeira vazia quando não há itens excluídos', async ({
    page,
  }) => {
    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    await expect(page.locator('text=A lixeira está vazia')).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('text=Itens excluídos aparecerão aqui')
    ).toBeVisible();
  });

  // ─── T-2 Restaurar arquivo excluído ────────────────────────────────
  test('T-2 - Deve exibir arquivo excluído na lixeira e restaurar', async ({
    page,
  }) => {
    const folderName = `e2e-trash-file-${Date.now()}`;
    const fileName = `trash-file-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    const fileId = await uploadTestFile(userToken, folderId, fileName);
    await deleteFileViaApi(userToken, fileId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    // File should appear with line-through
    const deletedFile = page.locator('.line-through', { hasText: fileName });
    await expect(deletedFile).toBeVisible({ timeout: 10_000 });

    // Click Restaurar on the file's row
    const fileRow = page
      .locator(`div:has(.line-through:text("${fileName}"))`)
      .first();
    await fileRow.locator('button:has-text("Restaurar")').click();

    await waitForToast(page, `Arquivo "${fileName}" restaurado`);

    // Exit trash view
    await clickTrashToggle(page);

    // Navigate to folder and verify file is back
    const { doubleClickItem } = await import('../helpers/storage.helper');
    await doubleClickItem(page, folderName);
    await page.waitForTimeout(1_000);

    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── T-3 Restaurar pasta excluída ──────────────────────────────────
  test('T-3 - Deve exibir pasta excluída na lixeira e restaurar', async ({
    page,
  }) => {
    const folderName = `e2e-trash-folder-${Date.now()}`;
    const folderId = await createTestFolder(userToken, folderName);
    await deleteFolderViaApi(userToken, folderId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    // Folder should appear with line-through
    const deletedFolder = page.locator('.line-through', {
      hasText: folderName,
    });
    await expect(deletedFolder).toBeVisible({ timeout: 10_000 });

    // Should show "Pasta · {path}"
    await expect(page.locator(`text=Pasta`).first()).toBeVisible();

    // Click Restaurar
    const folderRow = page
      .locator(`div:has(.line-through:text("${folderName}"))`)
      .first();
    await folderRow.locator('button:has-text("Restaurar")').click();

    await waitForToast(page, `Pasta "${folderName}" restaurada`);

    // Exit trash and verify folder in root
    await clickTrashToggle(page);
    await expect(page.locator(`[title="${folderName}"]`)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── T-4 Contador de itens na lixeira ──────────────────────────────
  test('T-4 - Deve exibir contador correto de itens na lixeira', async ({
    page,
  }) => {
    // Create and delete 2 files + 1 folder
    const folder1 = `e2e-trash-cnt-f-${Date.now()}`;
    const f1Id = await createTestFolder(userToken, folder1);
    const file1Id = await uploadTestFile(
      userToken,
      f1Id,
      `cnt1-${Date.now()}.txt`
    );
    const file2Id = await uploadTestFile(
      userToken,
      f1Id,
      `cnt2-${Date.now()}.txt`
    );

    const folder2 = `e2e-trash-cnt-d-${Date.now()}`;
    const f2Id = await createTestFolder(userToken, folder2);

    await deleteFileViaApi(userToken, file1Id);
    await deleteFileViaApi(userToken, file2Id);
    await deleteFolderViaApi(userToken, f2Id);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    await expect(page.locator('text=3 itens na lixeira')).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── T-5 Esvaziar lixeira permanentemente ─────────────────────────
  test('T-5 - Deve esvaziar a lixeira permanentemente', async ({ page }) => {
    // Create and delete 2 files
    const folder = `e2e-trash-empty-${Date.now()}`;
    const fId = await createTestFolder(userToken, folder);
    const fa = await uploadTestFile(userToken, fId, `empty1-${Date.now()}.txt`);
    const fb = await uploadTestFile(userToken, fId, `empty2-${Date.now()}.txt`);
    await deleteFileViaApi(userToken, fa);
    await deleteFileViaApi(userToken, fb);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    // Wait for items to appear
    await expect(page.locator('text=itens na lixeira')).toBeVisible({
      timeout: 10_000,
    });

    // Click "Esvaziar lixeira"
    await page.locator('button:has-text("Esvaziar lixeira")').click();

    // EmptyTrashDialog uses VerifyActionPinModal — enter PIN
    await enterActionPin(page, TEST_PIN);

    // Verify success toast
    await waitForToast(page, 'Lixeira esvaziada');

    // Verify empty state
    await expect(page.locator('text=A lixeira está vazia')).toBeVisible({
      timeout: 10_000,
    });
  });

  // ─── T-6 Restaurar arquivo para raiz se pasta pai excluída ────────
  test('T-6 - Deve restaurar arquivo para raiz se pasta pai foi excluída', async ({
    page,
  }) => {
    const folderName = `e2e-trash-cascade-${Date.now()}`;
    const fileName = `cascade-${Date.now()}.txt`;

    const folderId = await createTestFolder(userToken, folderName);
    await uploadTestFile(userToken, folderId, fileName);

    // Delete folder (cascading: files inside also go to trash)
    await deleteFolderViaApi(userToken, folderId);

    await injectAuthIntoBrowser(page, userToken, userTenantId);
    await navigateToFileManager(page);

    await clickTrashToggle(page);

    // Find and restore the file (not the folder)
    const fileRow = page
      .locator(`div:has(.line-through:text("${fileName}"))`)
      .first();
    await expect(fileRow).toBeVisible({ timeout: 10_000 });
    await fileRow.locator('button:has-text("Restaurar")').click();

    await waitForToast(page, `Arquivo "${fileName}" restaurado`);

    // Exit trash — file should appear at root (parent folder is deleted)
    await clickTrashToggle(page);
    await expect(page.locator(`[title="${fileName}"]`)).toBeVisible({
      timeout: 10_000,
    });
  });
});
